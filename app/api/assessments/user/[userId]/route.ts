import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';

interface Params {
  userId: string;
}

// GET /api/assessments/user/:userId
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json({ message: 'Invalid user ID' }, { status: 400 });
    }
    
    const assessments = await storage.listAssessmentsByUser(userId);
    return NextResponse.json(assessments);
  } catch (error) {
    console.error('Error fetching assessments by user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
} 