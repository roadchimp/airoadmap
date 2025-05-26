import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { assessments, wizardStepDataSchema, WizardStepData } from '@shared/schema';
import { PgStorage } from '@/server/pg-storage';
import { z } from 'zod';

type Params = {
  id: string;
};

// Create an extended schema that includes strategicFocus
const stepUpdateSchema = wizardStepDataSchema.partial().extend({
  // Allow strategicFocus as a top-level field
  strategicFocus: z.array(z.string()).optional(),
});

/**
 * PATCH /api/assessments/:id/step
 * Updates step data for a specific assessment
 */
export async function PATCH(request: Request, { params }: { params: Params }) {
  const storage = new PgStorage();
  try {
    const assessmentId = parseInt(params.id, 10);
    if (isNaN(assessmentId)) {
      return NextResponse.json({ error: "Invalid assessment ID" }, { status: 400 });
    }

    const assessment = await storage.getAssessment(assessmentId);
    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    const body = await request.json();
    
    // Handle special case for aiAdoptionScoreInputs if it exists
    if (body.aiAdoptionScoreInputs) {
      // Extract strategicFocus if present
      const { strategicFocus, ...restBody } = body;
      
      const updatedAssessment = await storage.updateAssessmentStep(
        assessmentId, 
        {
          aiAdoptionScoreInputs: body.aiAdoptionScoreInputs
        },
        strategicFocus
      );
      
      return NextResponse.json(updatedAssessment);
    }

    // The body here is Partial<WizardStepData> plus potentially strategicFocus
    // For example: { basics: { companyName: "New Name", ... }, strategicFocus: ["focus1", "focus2"] }
    
    // Validate using our extended schema that allows strategicFocus
    const validatedData = stepUpdateSchema.parse(body);

    // Extract strategicFocus if present
    const { strategicFocus, ...validatedPartialStepData } = validatedData;

    // The updated pg-storage.updateAssessmentStep method now handles extracting data for
    // dedicated columns if 'basics' is present in validatedPartialStepData.
    // Pass strategicFocus as a separate parameter if it exists
    const updatedAssessment = await storage.updateAssessmentStep(
      assessmentId, 
      validatedPartialStepData as Partial<WizardStepData>,
      strategicFocus
    );

    return NextResponse.json(updatedAssessment);
  } catch (error) {
    console.error(`Failed to update assessment step for ID ${params.id}:`, error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input for step", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update assessment step" }, { status: 500 });
  } finally {
    await storage.disconnect();
  }
} 