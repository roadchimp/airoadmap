import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/../../utils/supabase/server';
import { generateCsrfToken } from '../../middleware/AuthMiddleware';

export async function GET(request: Request) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate CSRF token
    const token = generateCsrfToken(user.id);

    // Set the CSRF token as a cookie
    const response = NextResponse.json(
      { token },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
    response.cookies.set('csrfToken', token, {
      httpOnly: false, // must be false so JS can read it
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 // 1 hour
    });
    return response;
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
} 