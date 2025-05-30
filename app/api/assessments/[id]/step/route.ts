import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { withAuthAndSecurity } from '../../../middleware';
import { z } from 'zod';
import { wizardStepDataSchema } from '@shared/schema';

// Create an extended schema that includes strategicFocus
const stepUpdateSchema = wizardStepDataSchema.partial().extend({
  // Allow strategicFocus as a top-level field
  strategicFocus: z.array(z.string()).optional(),
});

// PATCH /api/assessments/[id]/step
async function updateAssessmentStep(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const assessmentId = parseInt(params.id);
    if (isNaN(assessmentId)) {
      return NextResponse.json(
        { error: 'Invalid assessment ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    // Extract strategicFocus if present
    const { strategicFocus, ...restBody } = body;

    // The body here is Partial<WizardStepData> plus potentially strategicFocus
    // For example: { basics: { companyName: "New Name", ... }, strategicFocus: ["focus1", "focus2"] }
    const validatedData = stepUpdateSchema.parse(body);

    // Extract strategicFocus if present
    const { strategicFocus: validatedStrategicFocus, ...validatedPartialStepData } = validatedData;

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
        { error: 'Invalid step data', details: error.errors },
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