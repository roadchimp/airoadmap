import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import type { ProcessedJobContent } from '@shared/schema';

interface Params {
  id: string;
}

// GET /api/job-descriptions/:id
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid job description ID' }, { status: 400 });
    }
    
    const jobDescription = await storage.getJobDescription(id);
    if (!jobDescription) {
      return NextResponse.json({ message: 'Job description not found' }, { status: 404 });
    }
    
    return NextResponse.json(jobDescription);
  } catch (error) {
    console.error('Error fetching job description by ID:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// PATCH /api/job-descriptions/:id/process
// Note: This assumes the process route is nested under [id]
export async function PATCH(request: Request, { params }: { params: Params }) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ message: 'Invalid job description ID' }, { status: 400 });
  }

  try {
    const processedContent = await request.json() as ProcessedJobContent; // Type assertion based on original
    // Consider adding validation for processedContent here
    const jobDescription = await storage.updateJobDescriptionProcessedContent(id, processedContent);
    return NextResponse.json(jobDescription);
  } catch (error) {
    console.error('Error updating job description processed content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error updating job description processed content';
    return NextResponse.json({ message: errorMessage }, { status: 400 }); // Original used 400
  }
} 