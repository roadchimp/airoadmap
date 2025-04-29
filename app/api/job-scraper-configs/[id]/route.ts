import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';

interface Params {
  id: string;
}

// GET /api/job-scraper-configs/:id
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid job scraper config ID' }, { status: 400 });
    }
    
    const config = await storage.getJobScraperConfig(id);
    if (!config) {
      return NextResponse.json({ message: 'Job scraper config not found' }, { status: 404 });
    }
    
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching job scraper config by ID:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
} 