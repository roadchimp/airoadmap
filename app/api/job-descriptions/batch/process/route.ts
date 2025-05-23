import { NextResponse } from 'next/server';
import { processBatchResults } from '@/server/batch-processing/JDProcessor';

// POST /api/job-descriptions/batch/process
export async function POST(request: Request) {
  try {
    const { responsePath } = await request.json();
    
    if (!responsePath) {
      return NextResponse.json({ 
        success: false, 
        message: 'Response file path is required' 
      }, { status: 400 });
    }

    await processBatchResults(responsePath);
    return NextResponse.json({ 
      success: true, 
      message: 'Batch processing completed successfully' 
    });
  } catch (error) {
    console.error('Error processing batch results:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error processing batch results',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 