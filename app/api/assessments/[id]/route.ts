import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { withAuthAndSecurity } from '../../middleware/AuthMiddleware';
import { z } from 'zod';
import { wizardStepDataSchema } from '@shared/schema';

// Input validation schema
const assessmentUpdateSchema = wizardStepDataSchema.partial().extend({
  strategicFocus: z.array(z.string()).optional()
});

// GET /api/assessments/[id]
async function getAssessment(
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

    const assessment = await storage.getAssessment(assessmentId);
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment' },
      { status: 500 }
    );
  }
}

// PATCH /api/assessments/[id]
async function updateAssessment(
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
    const validatedData = assessmentUpdateSchema.parse(body);

    // Extract strategicFocus if present
    const { strategicFocus, ...stepData } = validatedData;

    const assessment = await storage.updateAssessmentStep(
      assessmentId,
      stepData,
      strategicFocus
    );
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error updating assessment:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid assessment data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update assessment' },
      { status: 500 }
    );
  }
}

// DELETE /api/assessments/[id]
async function deleteAssessment(
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

    await storage.deleteAssessment(assessmentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assessment' },
      { status: 500 }
    );
  }
}

// Export the handlers wrapped with auth and security middleware
export const GET = withAuthAndSecurity(getAssessment);
export const PATCH = withAuthAndSecurity(updateAssessment);
export const DELETE = withAuthAndSecurity(deleteAssessment); 