import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';

interface Params {
  wizardStepId: string;
}

// GET /api/assessment-scores/:wizardStepId
export async function GET(request: Request, { params }: { params: Promise<Params> }) {
  const { wizardStepId } = await params;
  
  if (!wizardStepId) {
    // This check might be redundant due to route parameter presence, but kept for parity
    return NextResponse.json({ message: 'wizardStepId is required' }, { status: 400 });
  }
  
  try {
    const score = await storage.getAssessmentScore(wizardStepId);
    if (!score) {
      return NextResponse.json({ message: 'Assessment score not found' }, { status: 404 });
    }
    
    return NextResponse.json(score);
  } catch (error) {
    console.error('Error fetching assessment score:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error fetching assessment score';
    return NextResponse.json({ message: errorMessage }, { status: 400 }); // Original used 400
  }
} 