import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { AssessmentResponseService } from '@/server/assessment-response-service';
import { InsertAssessmentResponse } from '@shared/schema';

interface Params {
  assessmentId: string;
}

/**
 * GET /api/assessment-responses/:assessmentId
 * Fetches all responses for a specific assessment
 */
export async function GET(request: Request, { params }: { params: Params }) {
  const { assessmentId } = params;
  
  if (!assessmentId) {
    return NextResponse.json({ message: 'Assessment ID is required' }, { status: 400 });
  }
  
  try {
    const assessmentIdNumber = parseInt(assessmentId, 10);
    
    if (isNaN(assessmentIdNumber)) {
      return NextResponse.json({ message: 'Assessment ID must be a number' }, { status: 400 });
    }
    
    const responses = await storage.getAssessmentResponsesByAssessment(assessmentIdNumber);
    
    return NextResponse.json({
      success: true,
      data: responses
    });
  } catch (error) {
    console.error('Error fetching assessment responses:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error fetching assessment responses';
    return NextResponse.json({ 
      success: false,
      message: errorMessage 
    }, { status: 500 });
  }
}

/**
 * POST /api/assessment-responses/:assessmentId
 * Saves responses for a specific assessment step
 */
export async function POST(request: Request, { params }: { params: Params }) {
  const { assessmentId } = params;
  
  if (!assessmentId) {
    return NextResponse.json({ message: 'Assessment ID is required' }, { status: 400 });
  }
  
  try {
    const assessmentIdNumber = parseInt(assessmentId, 10);
    
    if (isNaN(assessmentIdNumber)) {
      return NextResponse.json({ message: 'Assessment ID must be a number' }, { status: 400 });
    }
    
    const { userId, stepId, stepData } = await request.json();
    
    // Use default user ID if not provided or invalid
    const userIdToUse = userId && userId > 0 ? userId : 1;
    
    // Validate required fields
    if (!stepId) {
      console.warn("Missing stepId in assessment response");
      return NextResponse.json({ message: 'Step ID is required' }, { status: 400 });
    }
    
    if (!stepData || typeof stepData !== 'object' || Object.keys(stepData).length === 0) {
      console.warn("Missing or invalid stepData in assessment response");
      return NextResponse.json({ message: 'Valid step data is required' }, { status: 400 });
    }
    
    // Create individual assessment responses for each question/answer in stepData
    try {
      const responses: Array<InsertAssessmentResponse> = [];
      
      // Process the step data and convert to individual responses
      Object.entries(stepData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          // Create a question identifier based on the step ID and key
          const questionIdentifier = `${stepId}.${key}`;
          
          let response: InsertAssessmentResponse = {
            assessmentId: assessmentIdNumber,
            userId: userIdToUse,
            questionIdentifier
          };
          
          // Determine the type of response and set the appropriate field
          if (typeof value === 'string') {
            response.responseText = value;
          } else if (typeof value === 'number') {
            response.responseNumeric = value.toString();
          } else if (typeof value === 'boolean') {
            response.responseBoolean = value;
          } else {
            // For arrays, objects, etc.
            response.responseJson = value;
          }
          
          responses.push(response);
        }
      });
      
      // Save all responses in batch if there are any
      if (responses.length > 0) {
        await storage.batchCreateAssessmentResponses(responses);
      }
      
      return NextResponse.json({
        success: true,
        message: `Created ${responses.length} assessment responses`
      });
    } catch (error) {
      console.error('Error creating assessment responses:', error);
      return NextResponse.json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing assessment responses request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error saving assessment responses';
    return NextResponse.json({ 
      success: false,
      message: errorMessage 
    }, { status: 500 });
  }
} 