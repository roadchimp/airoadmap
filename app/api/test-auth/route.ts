import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/../../utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Test auth endpoint hit');
    
    // Test Supabase connection
    const supabase = await createClient();
    console.log('Supabase client created');
    
    // Test getting user
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log('User data:', { user: user?.id, error });
    
    if (error) {
      console.error('Supabase auth error:', error);
      return NextResponse.json(
        { error: 'Auth error', details: error.message },
        { status: 401 }
      );
    }

    if (!user) {
      console.log('No user found');
      return NextResponse.json(
        { error: 'No user found' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email
    });
  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json(
      { error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 