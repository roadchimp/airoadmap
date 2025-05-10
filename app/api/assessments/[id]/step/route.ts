import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { assessments, wizardStepDataSchema, WizardStepData } from '@shared/schema';
import { PgStorage } from '@/server/pg-storage';
import { z } from 'zod';

interface Params {
  id: string;
}

/**
 * PATCH /api/assessments/:id/step
 * Updates step data for a specific assessment
 */
export async function PATCH(request: Request, { params }: { params: Params }) {
  const storage = new PgStorage();
  try {
    await (storage as any).ensureInitialized();
    const assessmentId = parseInt(params.id, 10);
    if (isNaN(assessmentId)) {
      return NextResponse.json({ error: "Invalid assessment ID" }, { status: 400 });
    }

    const body = await request.json();

    // The body here is Partial<WizardStepData>
    // For example: { basics: { companyName: "New Name", ... } } or { roles: { ... } }
    
    // Validate the incoming partial step data against the corresponding part of the main schema.
    // This is a bit more complex because we don't know which step it is beforehand without a stepId in path.
    // However, wizardStepDataSchema.partial() can validate that the structure is a valid partial of WizardStepData.
    const validatedPartialStepData = wizardStepDataSchema.partial().parse(body);

    // The updated pg-storage.updateAssessmentStep method now handles extracting data for
    // dedicated columns if 'basics' is present in validatedPartialStepData.
    const updatedAssessment = await storage.updateAssessmentStep(assessmentId, validatedPartialStepData);

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