import { NextResponse } from 'next/server';
import { generateReportForAssessment } from '@/server/lib/services/reportService';

// POST /api/prioritize
export async function POST(request: Request) {
  // Security check for internal requests
  console.log('[PRIORITIZE_ROUTE] Received request');
  const internalSecret = request.headers.get('X-Internal-Request-Secret');
  const isDevelopment = process.env.NODE_ENV === 'development';

  console.log(`[PRIORITIZE_ROUTE] Environment: ${process.env.NODE_ENV}`);
  console.log(`[PRIORITIZE_ROUTE] Received X-Internal-Request-Secret: ${internalSecret ? 'Present' : 'Missing'}`);

  // In development, the internal secret is REQUIRED.
  // In production, we assume a different mechanism (like Vercel's private network) handles this.
  if (isDevelopment) {
    if (internalSecret !== process.env.INTERNAL_REQUEST_SECRET) {
      console.error('[PRIORITIZE_ROUTE] Unauthorized: Invalid or missing internal secret in development.');
      return NextResponse.json({ error: 'Unauthorized: Invalid internal secret' }, { status: 401 });
    }
    console.log('[PRIORITIZE_ROUTE] Development authentication successful.');
  } else {
    // Production environment - you might have different checks here
    console.log('[PRIORITIZE_ROUTE] Running in production, skipping local secret check.');
  }

  try {
    const { assessmentId } = await request.json();
    console.log(`[PRIORITIZE_ROUTE] Processing assessmentId: ${assessmentId}`);

    if (!assessmentId || typeof assessmentId !== 'number') {
      console.error(`[PRIORITIZE_ROUTE] Invalid assessmentId: ${assessmentId}`);
      return NextResponse.json({ message: 'Valid assessment ID is required and must be a number' }, { status: 400 });
    }

    const report = await generateReportForAssessment(assessmentId);

    return NextResponse.json(report, { status: 201 });

  } catch (error) {
    // The request object might have already been consumed, so we can't reliably get the body again here.
    // Logging within the service is the primary source of truth for errors.
    console.error(`[PRIORITIZE_ROUTE] Error processing request:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Error generating prioritization results';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
} 