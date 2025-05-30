import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { withAuthAndSecurity } from '../../middleware';
import { z } from 'zod';

// Input validation schema
const assessmentResponseSchema = z.object({
  questionIdentifier: z.string().min(1),
  responseText: z.string().min(1),
  responseNumeric: z.string().optional(),
  responseBoolean: z.boolean().optional(),
  responseJson: z.unknown().optional()
});

// GET /api/assessment-responses/[assessmentId]
async function getAssessmentResponses(
  request: Request,
  { params }: { params: { assessmentId: string } }
) {
  try {
    const assessmentId = parseInt(params.assessmentId);
    if (isNaN(assessmentId)) {
      return NextResponse.json(
        { error: 'Invalid assessment ID' },
        { status: 400 }
      );
    }

    const responses = await storage.getAssessmentResponsesByAssessment(assessmentId);
    return NextResponse.json({ success: true, data: responses });
  } catch (error) {
    console.error('Error fetching assessment responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment responses' },
      { status: 500 }
    );
  }
}

// POST /api/assessment-responses/[assessmentId]
async function createAssessmentResponse(
  request: Request,
  { params }: { params: { assessmentId: string } }
) {
  try {
    const assessmentId = parseInt(params.assessmentId);
    if (isNaN(assessmentId)) {
      return NextResponse.json(
        { error: 'Invalid assessment ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = assessmentResponseSchema.parse(body);

    // Get user from request (added by withAuth middleware)
    const user = (request as any).user;
    if (!user) {
      return NextResponse.json(
        { error: 'User not found in request context' },
        { status: 500 }
      );
    }

    const response = await storage.createAssessmentResponse({
      assessmentId,
      userId: user.id,
      ...validatedData
    });

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error creating assessment response:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid response data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create assessment response' },
      { status: 500 }
    );
  }
}

// Export the handlers wrapped with auth and security middleware
export const GET = withAuthAndSecurity(getAssessmentResponses);
export const POST = withAuthAndSecurity(createAssessmentResponse); 