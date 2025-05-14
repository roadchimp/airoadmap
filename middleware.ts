import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public API routes to bypass authentication
  if (pathname.startsWith('/api/public/')) {
    return NextResponse.next();
  }

  // We can add real auth logic here in the future
  // For now, we are letting everything through
  
  return NextResponse.next();
}

// Configure the paths that should trigger this middleware
export const config = {
  matcher: [
    // Match all API routes except those starting with 'public'
    '/api/:path*',
    // Match protected app routes
    '/(app)/:path*',
  ],
}; 