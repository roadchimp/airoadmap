import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';

interface Params {
  id: string;
}

// PATCH /api/job-descriptions/:id/status
export async function PATCH(request: Request, { params }: { params: Params }) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid job description ID' }, { status: 400 });
  }

  try {
    const { status, error: errorMsg } = await request.json(); // Renamed error to avoid conflict
    if (!status || typeof status !== 'string') {
      return NextResponse.json({ message: 'Status is required and must be a string' }, { status: 400 });
    }
    // Optional: Validate errorMsg if present

    const jobDescription = await storage.updateJobDescriptionStatus(id, status, errorMsg);
    return NextResponse.json(jobDescription);
  } catch (error) {
    console.error('Error updating job description status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error updating job description status';
    return NextResponse.json({ message: errorMessage }, { status: 400 }); // Original used 400
  }
} 