import { NextResponse } from 'next/server';
import { createClient as supabaseClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // This is a development-only endpoint to manually confirm users
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Endpoint only available in development mode' }, { status: 403 });
    }
    
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Create a Supabase client with the service role key for admin operations
    const adminClient = supabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    ).auth.admin;
    
    // Get the user by email first
    const { data: usersData, error: getUserError } = await adminClient.listUsers({
      page: 1,
      perPage: 1
    });
    
    if (getUserError) {
      return NextResponse.json({ error: getUserError.message }, { status: 400 });
    }
    
    // Find the user with the matching email
    const users = usersData.users.filter(user => user.email === email);
    
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const user = users[0];
    
    // Update the user to confirm them
    const { data, error } = await adminClient.updateUserById(user.id, {
      email_confirm: true,
      user_metadata: {
        ...user.user_metadata,
        email_verified: true
      }
    });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'User confirmed successfully'
    });
    
  } catch (error) {
    console.error('Error confirming user:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 