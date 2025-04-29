import { NextResponse, NextRequest } from 'next/server';
import { storage } from '@/server/storage';

interface Params {
  status: string;
}

// GET /api/job-descriptions/status/:status
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const status = params.status;
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    const limit = limitParam ? parseInt(limitParam) : 100;
    const offset = offsetParam ? parseInt(offsetParam) : 0;

    if (isNaN(limit) || isNaN(offset)) {
        return NextResponse.json({ message: 'Invalid limit or offset parameter' }, { status: 400 });
    }
    
    // Basic validation for status, could be enhanced with specific allowed values
    if (!status || typeof status !== 'string') {
      return NextResponse.json({ message: 'Invalid status parameter' }, { status: 400 });
    }

    const jobDescriptions = await storage.listJobDescriptionsByStatus(status, limit, offset);
    return NextResponse.json(jobDescriptions);
  } catch (error) {
    console.error('Error fetching job descriptions by status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
} 