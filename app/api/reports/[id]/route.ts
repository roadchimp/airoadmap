import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';

interface Params {
  id: string;
}

// GET /api/reports/:id
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const reportId = parseInt(params.id);
    if (isNaN(reportId)) {
      return NextResponse.json({ message: 'Invalid report ID' }, { status: 400 });
    }
    
    const report = await storage.getReport(reportId);
    if (!report) {
      return NextResponse.json({ message: 'Report not found' }, { status: 404 });
    }
    
    return NextResponse.json(report);
  } catch (error) {
    console.error('Error fetching report by ID:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
} 