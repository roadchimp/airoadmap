import { createClient } from '@/../../utils/supabase/server';
import { cookies } from 'next/headers';
import { storage } from '@/../../server/pg-storage';

/**
 * Get the authenticated user from Supabase auth
 * Use this in API routes to get the current user
 */
export async function getAuthUser() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
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
  const { user } = await getAuthUser();
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  
  return null; // No response means the request can continue
}

/**
 * Auth middleware that sets up authentication context for storage operations (GET)
 * This ensures RLS policies are applied with the correct user context
 */
export function withAuthGet(handler: (request: Request, authId: string) => Promise<Response>) {
  return async function GET(request: Request) {
    // Check authentication
    const authResponse = await requireAuth(request);
    if (authResponse) {
      return authResponse; // Return auth error if present
    }
    
    // Get authenticated user
    const { user } = await getAuthUser();
    const authId = user!.id; // We know user exists because requireAuth passed
    
    // Call the handler with the auth ID
    return handler(request, authId);
  };
}

/**
 * Auth middleware that sets up authentication context for storage operations (POST)
 * This ensures RLS policies are applied with the correct user context
 */
export function withAuthPost(handler: (request: Request, authId: string) => Promise<Response>) {
  return async function POST(request: Request) {
    // Check authentication
    const authResponse = await requireAuth(request);
    if (authResponse) {
      return authResponse; // Return auth error if present
    }
    
    // Get authenticated user
    const { user } = await getAuthUser();
    const authId = user!.id; // We know user exists because requireAuth passed
    
    // Call the handler with the auth ID
    return handler(request, authId);
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