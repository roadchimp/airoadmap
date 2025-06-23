import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { withAuth } from '../../../middleware/AuthMiddleware';

async function getReportStatus(request: Request, { params }: { params: { id: string } }) {
  try {
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
    const reports = await storage.listReports(assessmentId);
    const report = reports.length > 0 ? reports[0] : null;

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
  } catch (error) {
    console.error('Error checking report status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getReportStatus); 