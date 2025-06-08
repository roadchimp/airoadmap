import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { withAuthAndSecurity } from '../../../middleware/AuthMiddleware';
import { z } from 'zod';

// Input validation schema
const statusUpdateSchema = z.object({
  status: z.enum(['draft', 'submitted', 'completed'])
});

// PATCH /api/assessments/[id]/status
async function updateAssessmentStatus(
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
    const validatedData = statusUpdateSchema.parse(body);

    const assessment = await storage.updateAssessmentStatus(assessmentId, validatedData.status);
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error updating assessment status:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid status data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update assessment status' },
      { status: 500 }
    );
  }
}

// Export the handler wrapped with auth and security middleware
export const PATCH = withAuthAndSecurity(updateAssessmentStatus);
