import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';

interface Params {
  id: string;
}

// PATCH /api/reports/:id/commentary
export async function PATCH(request: Request, { params }: { params: Params }) {
  const reportId = parseInt(params.id);
  if (isNaN(reportId)) {
    return NextResponse.json({ message: 'Invalid report ID' }, { status: 400 });
  }

  try {
    const { commentary } = await request.json();
    if (!commentary || typeof commentary !== 'string') {
      return NextResponse.json({ message: 'Commentary is required and must be a string' }, { status: 400 });
    }
    
    const report = await storage.updateReportCommentary(reportId, commentary);
    return NextResponse.json(report);
  } catch (error) {
    console.error('Error updating report commentary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error updating report commentary';
    // Assuming 400 based on original code, could be 500 if storage layer fails
    return NextResponse.json({ message: errorMessage }, { status: 400 }); 
  }
} 