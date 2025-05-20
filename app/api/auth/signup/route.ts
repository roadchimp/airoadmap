import { NextResponse } from 'next/server';
import { createClient } from '@/../../utils/supabase/server';
import { organizations } from '@/../../shared/schema';
import { storage } from '@/../../server/pg-storage';
import { createClient as supabaseClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // Get request body
    const { email, password, organizationName } = await request.json();
    
    // Validate inputs
    if (!email || !password || !organizationName) {
      return NextResponse.json(
        { error: 'Email, password and organization name are required' },
        { status: 400 }
      );
    }
    
    // Create organization using the existing storage implementation
    const organization = await storage.createOrganization({ 
      name: organizationName,
      industry: 'Unknown', // Required field in schema
      size: 'Unknown',     // Required field in schema
    });
    
    if (!organization) {
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }
    
    // Create a Supabase client with the service role key for admin operations
    const adminAuthClient = supabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    ).auth.admin;
    
    // Create the user in Supabase Auth
    const { data: userData, error: userError } = await adminAuthClient.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for development
      user_metadata: {
        organization_id: organization.id.toString(),
      }
    });
    
    if (userError) {
      // Rollback organization creation if user creation fails
      await storage.deleteOrganization(organization.id);
      
      return NextResponse.json(
        { error: userError.message },
        { status: 400 }
      );
    }
    
    // Create a user profile record in our database
    if (userData && userData.user) {
      try {
        await storage.createUserProfile({
          auth_id: userData.user.id,
          organization_id: organization.id,
          full_name: email.split('@')[0], // Basic name from email
        });
      } catch (profileError) {
        console.error('Error creating user profile:', profileError);
        // Continue anyway - the auth user is created
      }
    }
    
    // Return successful response with redirect flag
    return NextResponse.json({ 
      success: true,
      confirmEmail: true,
      redirectUrl: '/signup/confirm-email-prompt'
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}