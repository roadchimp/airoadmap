import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';

interface Params {
  id: string;
}

// PATCH /api/assessments/:id/status
export async function PATCH(request: Request, { params }: { params: Params }) {
  const assessmentId = parseInt(params.id);
  if (isNaN(assessmentId)) {
    return NextResponse.json({ message: 'Invalid assessment ID' }, { status: 400 });
  }

  try {
    const { status } = await request.json();
    if (!status || typeof status !== 'string') {
      return NextResponse.json({ message: 'Status is required and must be a string' }, { status: 400 });
    }
    
    const assessment = await storage.updateAssessmentStatus(assessmentId, status);
    return NextResponse.json(assessment);
  } catch (error) {
    console.error('Error updating assessment status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error updating assessment status';
    return NextResponse.json({ message: errorMessage }, { status: 400 }); // Assuming 400 based on original
  }
}
