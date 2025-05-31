import { storage } from '@/server/storage';
import { createClient } from '@/../../utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';



interface Params {
  userId: string;
}

// GET /api/assessments/user/:userId
export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    // CRITICAL: Add this authentication block at the start
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId)) {
      return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
    }
    
    const assessments = await storage.listAssessmentsByUser(parsedUserId);
    return NextResponse.json(assessments);

  } catch (error) {
    console.error('Error fetching assessments by user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}   

export async function PUT(request: NextRequest) {
  try {
    // CRITICAL: Add this authentication block at the start
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Your existing route logic continues here...
    return NextResponse.json({ message: 'PUT not implemented yet' }, { status: 501 });
  } catch (error) {
    console.error('Error in PUT request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}