import { NextResponse } from 'next/server';
import { exportJobsForBatch } from '@/server/batch-processing/batchProcessor';

// POST /api/job-descriptions/batch/export
export async function POST() {
  try {
    const filepath = await exportJobsForBatch();
    return NextResponse.json({ 
      success: true, 
      message: 'Job descriptions exported for batch processing',
      filepath: filepath
    });
  } catch (error) {
    console.error('Error exporting job descriptions for batch:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error exporting job descriptions',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 