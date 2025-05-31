import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/../../utils/supabase/server';
import { randomBytes, createHmac } from 'crypto';

/**
 * CRITICAL: CVE-2025-29927 Protection
 * Block x-middleware-subrequest header to prevent authentication bypass
 */
function isHeaderSpoofingAttempt(request: NextRequest): boolean {
  const maliciousHeaders = [
    'x-middleware-subrequest',
    'x-middleware-rewrite',
    'x-invoke-subrequest',
    'x-forwarded-host',
    'x-forwarded-proto',
    'x-forwarded-port'
  ];
  
  for (const header of maliciousHeaders) {
    if (request.headers.has(header)) {
      const clientIp = getClientIpAddress(request);
      console.error(`🚨 SECURITY ALERT: Blocked malicious header ${header} from ${clientIp}`);
      return true;
    }
  }
  return false;
}

/**
 * Extract client IP address from request headers
 * Handles both Vercel and self-hosted environments
 */
function getClientIpAddress(request: NextRequest): string {
  // Try x-forwarded-for first (most common proxy header)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }
  
  // Try x-real-ip (alternative proxy header)
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  
  // Try x-client-ip (another alternative)
  const clientIp = request.headers.get('x-client-ip');
  if (clientIp) {
    return clientIp.trim();
  }
  
  // Fallback to unknown if no IP headers are present
  return 'unknown';
}

// Memory-based rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

async function checkRateLimit(ip: string): Promise<boolean> {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 10;
  
  // Clean expired entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      rateLimitMap.delete(key);
    }
  }
  
  const current = rateLimitMap.get(ip);
  
  if (!current) {
    // First request from this IP
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.resetTime < now) {
    // Window expired, reset
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false; // Rate limited
  }
  
  // Increment counter
  current.count++;
  return true;
}

// CSRF token secret - should be in env vars in production
const CSRF_SECRET = process.env.CSRF_SECRET || 'your-csrf-secret-key';

/**
 * Generate a CSRF token for a user
 */
export function generateCsrfToken(userId: string): string {
  const timestamp = Date.now();
  const random = randomBytes(32).toString('hex');
  const data = `${userId}:${timestamp}:${random}`;
  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(data);
  const token = `${data}:${hmac.digest('hex')}`;
  return Buffer.from(token).toString('base64');
}

/**
 * Validate a CSRF token
 */
export function validateCsrfToken(token: string, userId: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const [tokenUserId, timestamp, random, signature] = decoded.split(':');
    
    // Verify user ID matches
    if (tokenUserId !== userId) {
      return false;
    }
    
    // Verify token hasn't expired (24 hours)
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 24 * 60 * 60 * 1000) {
      return false;
    }
    
    // Verify signature
    const data = `${tokenUserId}:${timestamp}:${random}`;
    const hmac = createHmac('sha256', CSRF_SECRET);
    hmac.update(data);
    const expectedSignature = hmac.digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('CSRF token validation failed:', error);
    return false;
  }
}

/**
 * Secure user authentication using getUser() instead of getSession()
 * This prevents JWT spoofing attacks
 */
async function getAuthenticatedUser(request: NextRequest) {
  try {
    // Add memory-based rate limiting
    const ip = getClientIpAddress(request);
    const isAllowed = await checkRateLimit(ip);
    if (!isAllowed) {
      throw new Error('Too many requests');
    }

    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    // Add CSRF token validation for non-GET requests
    if (request.method !== 'GET') {
      const csrfToken = request.headers.get('x-csrf-token');
      if (!csrfToken || !validateCsrfToken(csrfToken, user.id)) {
        throw new Error('CSRF validation failed: Token mismatch');
      }
    }
    
    return user;
  } catch (error) {
    console.error('Auth validation failed:', error);
    return null;
  }
}

/**
 * Main middleware function with CVE-2025-29927 protection
 */
export async function middleware(request: NextRequest) {
  // CRITICAL: Block CVE-2025-29927 exploitation attempts
  if (isHeaderSpoofingAttempt(request)) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Forbidden: Invalid request headers detected',
        code: 'HEADER_SPOOFING_BLOCKED'
      }), 
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const { pathname } = request.nextUrl;
  
  // Define protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/api/assessments', 
    '/api/reports',
    '/api/user'
  ];
  
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (isProtectedRoute) {
    const user = await getAuthenticatedUser(request);
    
    if (!user) {
      // Redirect to login for page routes
      if (!pathname.startsWith('/api/')) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      // Return 401 for API routes  
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
  
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

type ApiHandler = (request: NextRequest, context: any) => Promise<NextResponse>;

/**
 * Add security headers to a response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  return response;
}

/**
 * Higher-order function to wrap API route handlers with security headers
 */
export function withSecurityHeaders(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context: any) => {
    try {
      const response = await handler(request, context);
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('API route error:', error);
      return addSecurityHeaders(
        NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      );
    }
  };
}

/**
 * Secure auth middleware for API routes
 * Validates user authentication and CSRF token
 */
export function withAuth(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context: any) => {
    try {
      // Rate limiting
      const ip = getClientIpAddress(request);
      const isAllowed = await checkRateLimit(ip);
      if (!isAllowed) {
        return addSecurityHeaders(
          NextResponse.json(
            { error: 'Too many requests' },
            { status: 429 }
          )
        );
      }

      // Auth validation
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return addSecurityHeaders(
          NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          )
        );
      }

      // CSRF protection for non-GET requests
      if (request.method !== 'GET') {
        const csrfToken = request.headers.get('x-csrf-token');
        if (!csrfToken || !validateCsrfToken(csrfToken, user.id)) {
          return addSecurityHeaders(
            NextResponse.json(
              { error: 'Invalid CSRF token' },
              { status: 403 }
            )
          );
        }
      }

      // Add user to request context
      const contextWithUser = { ...context, user };
      const response = await handler(request, contextWithUser);
      return addSecurityHeaders(response);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return addSecurityHeaders(
        NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      );
    }
  };
}

/**
 * Combined middleware that applies both auth and security headers
 */
export function withAuthAndSecurity(handler: ApiHandler): ApiHandler {
  return withSecurityHeaders(withAuth(handler));
}

