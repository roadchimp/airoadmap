import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { withAuth } from '../../../middleware/AuthMiddleware';

async function getReportStatus(request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const assessmentId = parseInt(params.id);
  
  if (isNaN(assessmentId)) {
    return NextResponse.json({ error: 'Invalid assessment ID' }, { status: 400 });
  }

  // Check if assessment exists
  const assessment = await storage.getAssessment(assessmentId);
  if (!assessment) {
    return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
  }

  // Check if report exists for this assessment
  const report = await storage.getReportByAssessment(assessmentId);

  if (report) {
    return NextResponse.json({
      status: 'completed',
      reportId: report.id,
      reportGenerated: true,
      message: 'Report is ready'
    });
  } else {
    return NextResponse.json({
      status: 'generating',
      reportId: null,
      reportGenerated: false,
      message: 'Report is still being generated'
    });
  }
}

export const GET = withAuth(getReportStatus); 