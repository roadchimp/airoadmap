import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { unstable_noStore } from 'next/cache';

interface Params {
  id: string;
}

// GET /api/assessments/:id
export async function GET(request: Request, { params }: { params: Params }) {
  // Disable caching for this route
  unstable_noStore();
  
  try {
    const assessmentId = parseInt(params.id);
    if (isNaN(assessmentId)) {
      return NextResponse.json({ message: 'Invalid assessment ID' }, { status: 400 });
    }
    
    const assessment = await storage.getAssessment(assessmentId);
    if (!assessment) {
      return NextResponse.json({ message: 'Assessment not found' }, { status: 404 });
    }
    
    // Add debug logging
    console.log(`GET /api/assessments/${assessmentId} - Retrieved assessment:`, assessment);
    console.log(`Organization data:`, (assessment as any).organization || 'No organization data');
    
    return NextResponse.json(assessment, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Error fetching assessment by ID:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate'
      }
    });
  }
}

// PATCH /api/assessments/:id/step
export async function PATCH(request: Request, { params }: { params: Params }) {
  const assessmentId = parseInt(params.id);
  if (isNaN(assessmentId)) {
    return NextResponse.json({ message: 'Invalid assessment ID' }, { status: 400 });
  }
  
  try {
    const body = await request.json(); // Note: No explicit validation here, matches original
    
    // Extract strategicFocus if present
    const { strategicFocus, ...stepData } = body;
    
    // Pass strategicFocus as a separate parameter if it exists
    const assessment = await storage.updateAssessmentStep(assessmentId, stepData, strategicFocus);
    
    return NextResponse.json(assessment);
  } catch (error) {
    console.error('Error updating assessment step:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error updating assessment step';
    return NextResponse.json({ message: errorMessage }, { status: 400 }); // Assuming 400 based on original
  }
} 