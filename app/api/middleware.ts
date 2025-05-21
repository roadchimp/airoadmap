import { createClient } from '@/../../utils/supabase/server';
import { cookies } from 'next/headers';
import { storage } from '@/../../server/pg-storage';

/**
 * Get the authenticated user from Supabase auth
 * Use this in API routes to get the current user
 */
export async function getAuthUser() {
  console.log("Attempting to get auth user in middleware...");
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    console.log("Auth user found in middleware:", JSON.stringify(session.user, null, 2));
  } else {
    console.log("No active session found in middleware.");
  }
  
  return {
    user: session?.user || null,
    session
  };
}

/**
 * Get the authenticated user and their profile
 * Returns user, session, and profile information
 */
export async function getAuthUserWithProfile() {
  const { user, session } = await getAuthUser();
  
  if (!user) {
    return { user: null, session: null, profile: null };
  }
  
  // Get user profile from our database
  const profile = await storage.getUserProfileByAuthId(user.id);
  
  return {
    user,
    session,
    profile
  };
}

/**
 * Check if a request is authenticated
 * Use this to protect API routes
 */
export async function requireAuth(request: Request) {
  console.log(`requireAuth called for: ${request.method} ${request.url}`);
  const { user } = await getAuthUser();
  
  if (!user) {
    console.error(`requireAuth: Unauthorized access attempt to ${request.method} ${request.url}. No user found.`);
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  
  console.log(`requireAuth: Authorized access for user ${user.id} to ${request.method} ${request.url}`);
  return null; // No response means the request can continue
}

/**
 * Auth middleware that sets up authentication context for storage operations (GET)
 * This ensures RLS policies are applied with the correct user context
 */
export function withAuthGet(handler: (request: Request, authId: string, context?: any) => Promise<Response>) {
  return async function GET(request: Request, context?: any) {
    // Check authentication
    const authResponse = await requireAuth(request);
    if (authResponse) {
      return authResponse; // Return auth error if present
    }
    
    // Get authenticated user
    const { user } = await getAuthUser();
    const authId = user!.id; // We know user exists because requireAuth passed
    
    console.log(`withAuthGet: Calling handler for ${request.url} with authId: ${authId}`);
    // Call the handler with the auth ID and context (including params)
    return handler(request, authId, context);
  };
}

/**
 * Auth middleware that sets up authentication context for storage operations (POST)
 * This ensures RLS policies are applied with the correct user context
 */
export function withAuthPost(handler: (request: Request, authId: string, context?: any) => Promise<Response>) {
  return async function POST(request: Request, context?: any) {
    // Check authentication
    const authResponse = await requireAuth(request);
    if (authResponse) {
      return authResponse; // Return auth error if present
    }
    
    // Get authenticated user
    const { user } = await getAuthUser();
    const authId = user!.id; // We know user exists because requireAuth passed
    
    console.log(`withAuthPost: Calling handler for ${request.url} with authId: ${authId}`);
    // Call the handler with the auth ID and context (including params)
    return handler(request, authId, context);
  };
}

/**
 * @deprecated Use withAuthGet or withAuthPost instead
 */
export function withAuth(handler: (request: Request, authId: string) => Promise<Response>) {
  console.warn('withAuth is deprecated, use withAuthGet or withAuthPost instead');
  return withAuthGet(handler);
}

/**
 * Check if a user's email is confirmed
 * Returns true if confirmed, false if not
 */
export async function isUserEmailConfirmed() {
  const { user } = await getAuthUser();
  
  if (!user) {
    return false;
  }
  
  return user.email_confirmed_at !== null;
} 