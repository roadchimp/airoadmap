import { NextResponse } from 'next/server';
import { generateReportForAssessment } from '@/server/lib/services/reportService';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const assessmentId = parseInt(resolvedParams.id, 10);
  console.log(`[REGENERATE_ROUTE] Received request for assessment ID: ${assessmentId}`);

  if (isNaN(assessmentId)) {
    return NextResponse.json({ error: 'Invalid assessment ID' }, { status: 400 });
  }

  try {
    // We can call the service directly, but we still want this to be async
    // so the client gets an immediate response. We won't await the result here.
    generateReportForAssessment(assessmentId, { regenerate: true }).catch(error => {
      // Log the error centrally, perhaps using a more robust logging service in the future.
      console.error(`[REGENERATE_ROUTE] Background report generation failed for assessment ${assessmentId}:`, error);
    });

    return NextResponse.json(
      { message: 'Report regeneration started in the background.', success: true },
      { status: 202 }
    );
  } catch (error) {
    console.error(`[REGENERATE_ROUTE] Error processing request for assessment ${assessmentId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
} 