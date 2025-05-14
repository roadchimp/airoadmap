import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';

// POST /api/reports/set-assessment
// Body: { reportId: number, assessmentId: number }
export async function POST(request: Request) {
  try {
    const { reportId, assessmentId } = await request.json();
    
    // Validate input
    if (!reportId || !assessmentId || typeof reportId !== 'number' || typeof assessmentId !== 'number') {
      return NextResponse.json(
        { message: 'Invalid input. Both reportId and assessmentId must be provided as numbers.' }, 
        { status: 400 }
      );
    }

    // Update the report's assessmentId
    const updatedReport = await storage.updateReportAssessmentId(reportId, assessmentId);
    
    return NextResponse.json({
      success: true,
      message: `Report ${reportId} successfully linked to assessment ${assessmentId}`,
      report: updatedReport
    });
  } catch (error) {
    console.error('Error updating report assessment ID:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
} 