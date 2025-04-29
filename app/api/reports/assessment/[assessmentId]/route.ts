import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';

interface Params {
  assessmentId: string;
}

// GET /api/reports/assessment/:assessmentId
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const assessmentId = parseInt(params.assessmentId);
    if (isNaN(assessmentId)) {
      return NextResponse.json({ message: 'Invalid assessment ID' }, { status: 400 });
    }
    
    const report = await storage.getReportByAssessment(assessmentId);
    if (!report) {
      // Changed to 404 to match original logic more closely
      return NextResponse.json({ message: 'Report not found for this assessment' }, { status: 404 });
    }
    
    return NextResponse.json(report);
  } catch (error) {
    console.error('Error fetching report by assessment ID:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
} 