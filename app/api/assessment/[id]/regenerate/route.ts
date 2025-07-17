import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';

// Helper function to get base URL
function getBaseUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return 'http://localhost:3000';
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const assessmentId = parseInt(params.id, 10);
  console.log(`[REGENERATE_ROUTE] Received request for assessment ID: ${assessmentId}`);

  if (isNaN(assessmentId)) {
    return NextResponse.json({ error: 'Invalid assessment ID' }, { status: 400 });
  }

  try {
    // 1. Fetch the existing assessment to ensure it exists
    const assessment = await storage.getAssessment(assessmentId);
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }
    console.log(`[REGENERATE_ROUTE] Found assessment: ${assessment.title}`);

    // 2. Trigger the prioritization logic asynchronously
    const triggerReportGeneration = async () => {
      try {
        const baseUrl = getBaseUrl();
        const internalSecret = process.env.INTERNAL_REQUEST_SECRET;
        
        console.log(`[REGENERATE_ROUTE] Triggering report generation for assessment ${assessment.id} to ${baseUrl}/api/prioritize`);

        if (!internalSecret && process.env.NODE_ENV === 'development') {
          console.error('[REGENERATE_ROUTE] CRITICAL: INTERNAL_REQUEST_SECRET is not set in development. Report generation will likely fail authentication.');
        }

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (internalSecret) {
          headers['X-Internal-Request-Secret'] = internalSecret;
        }

        console.log('[REGENERATE_ROUTE] Sending headers:', JSON.stringify(headers, null, 2));
        
        const reportResponse = await fetch(`${baseUrl}/api/prioritize`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ assessmentId: assessment.id }),
        });

        if (reportResponse.ok) {
          const reportData = await reportResponse.json();
          console.log(`[REGENERATE_ROUTE] Successfully started report generation. Response: ${JSON.stringify(reportData)}`);
        } else {
          const errorBody = await reportResponse.text();
          console.error(`[REGENERATE_ROUTE] Failed to generate report. Status: ${reportResponse.status}. Body: ${errorBody}`);
        }
      } catch (reportError) {
        console.error('[REGENERATE_ROUTE] Error triggering report generation fetch call:', reportError);
      }
    };

    // Fire and forget
    triggerReportGeneration();

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