import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';

interface Params {
  id: string;
}

/**
 * PATCH /api/assessments/:id/step
 * Updates step data for a specific assessment
 */
export async function PATCH(request: Request, { params }: { params: Params }) {
  const assessmentId = parseInt(params.id);
  if (isNaN(assessmentId)) {
    return NextResponse.json({ 
      success: false,
      message: 'Invalid assessment ID' 
    }, { status: 400 });
  }
  
  try {
    const stepData = await request.json();
    console.log(`Updating assessment ID ${assessmentId} with step data:`, stepData);
    
    // Get the current assessment to check if userId exists
    const currentAssessment = await storage.getAssessment(assessmentId);
    
    // If no userId is present, add the default user ID (1)
    if (currentAssessment && (!currentAssessment.userId || currentAssessment.userId <= 0)) {
      // Update the assessment with default user ID
      await storage.updateAssessmentUserID(assessmentId, 1);
      console.log(`Set default user ID (1) for assessment ${assessmentId}`);
    }
    
    const assessment = await storage.updateAssessmentStep(assessmentId, stepData);
    
    return NextResponse.json(assessment);
  } catch (error) {
    console.error(`Error updating assessment step:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Error updating assessment step';
    return NextResponse.json({ 
      success: false,
      message: errorMessage 
    }, { status: 500 });
  }
} 