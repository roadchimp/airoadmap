import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { unstable_noStore } from 'next/cache';

interface Params {
  id: string;
}

// GET /api/reports/:id
export async function GET(request: Request, { params }: { params: Params }) {
  // Disable caching for this route
  unstable_noStore();
  
  try {
    const reportId = parseInt(params.id);
    if (isNaN(reportId)) {
      return NextResponse.json({ message: 'Invalid report ID' }, { status: 400 });
    }
    
    const report = await storage.getReport(reportId);
    if (!report) {
      return NextResponse.json({ message: 'Report not found' }, { status: 404 });
    }
    
    // Also fetch the associated assessment
    let assessment = null;
    if (report.assessmentId) {
      assessment = await storage.getAssessment(report.assessmentId);
    }
    
    return NextResponse.json({ report, assessment }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate'
      }
    });
  } catch (error) {
    console.error('Error fetching report by ID:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate'
      }
    });
  }
} 