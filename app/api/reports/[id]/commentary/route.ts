import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { withAuthAndSecurity } from '../../../middleware';
import { z } from 'zod';

// Input validation schema
const commentarySchema = z.object({
  commentary: z.string().min(1)
});

// PATCH /api/reports/[id]/commentary
async function updateReportCommentary(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = parseInt(params.id);
    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = commentarySchema.parse(body);

    const report = await storage.updateReportCommentary(reportId, validatedData.commentary);
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error('Error updating report commentary:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid commentary data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update report commentary' },
      { status: 500 }
    );
  }
}

// Export the handler wrapped with auth and security middleware
export const PATCH = withAuthAndSecurity(updateReportCommentary); 