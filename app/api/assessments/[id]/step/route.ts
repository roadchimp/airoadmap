import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { withAuthAndSecurity } from '../../../middleware/AuthMiddleware';
import { z } from 'zod';

// Create a very flexible schema for step updates that allows any partial data
const stepUpdateSchema = z.object({
  // Allow strategicFocus as a top-level field
  strategicFocus: z.array(z.string()).optional(),
}).catchall(z.any()); // catchall allows any additional properties

// PATCH /api/assessments/[id]/step
async function updateAssessmentStep(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assessmentId = parseInt(id);
    if (isNaN(assessmentId)) {
      return NextResponse.json(
        { error: 'Invalid assessment ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('Received step update data:', JSON.stringify(body, null, 2));

    // Basic validation - just ensure it's an object and has the expected structure
    const validatedData = stepUpdateSchema.parse(body);

    // Extract strategicFocus if present
    const { strategicFocus: validatedStrategicFocus, ...validatedPartialStepData } = validatedData;

    console.log('Validated step data:', JSON.stringify(validatedPartialStepData, null, 2));
    console.log('Strategic focus:', validatedStrategicFocus);

    // Pass strategicFocus as a separate parameter if it exists
    const assessment = await storage.updateAssessmentStep(
      assessmentId,
      validatedPartialStepData,
      validatedStrategicFocus
    );

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error updating assessment step:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid step data format', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update assessment step' },
      { status: 500 }
    );
  }
}

// Export the handler wrapped with auth and security middleware
export const PATCH = withAuthAndSecurity(updateAssessmentStep); 