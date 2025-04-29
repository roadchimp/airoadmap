import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';

interface Params {
  id: string;
}

// PATCH /api/job-scraper-configs/:id/status
export async function PATCH(request: Request, { params }: { params: Params }) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid job scraper config ID' }, { status: 400 });
  }

  try {
    const { isActive } = await request.json();
    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ message: 'isActive is required and must be a boolean' }, { status: 400 });
    }
    
    const config = await storage.updateJobScraperConfigStatus(id, isActive);
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating job scraper config status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error updating job scraper config status';
     // Assuming 400 based on original code, could be 500 or 404 if ID not found
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }
} 