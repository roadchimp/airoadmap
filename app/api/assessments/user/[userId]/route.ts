import { storage } from '@/server/storage';
import { createClient } from '@/../../utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';



interface Params {
  userId: string;
}

// GET /api/assessments/user/:userId
export async function GET(request: NextRequest) {
  // CRITICAL: Add this authentication block at the start
  try {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  };

  const userId = parseInt(params.userId);
  if (isNaN(userId)) {
    return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
  }
  
  const assessments = await storage.listAssessmentsByUser(userId);
  return NextResponse.json(assessments);

  return NextResponse.json({ user });

} catch (error) {
  console.error('Error fetching assessments by user:', error);
  const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
  return NextResponse.json({ message: errorMessage }, { status: 500 });
}
}   

export async function PUT(request: NextRequest) {
  // CRITICAL: Add this authentication block at the start
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Your existing route logic continues here...
}