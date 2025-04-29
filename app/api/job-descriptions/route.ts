import { NextResponse, NextRequest } from 'next/server';
import { storage } from '@/server/storage';
import { insertJobDescriptionSchema, ProcessedJobContent } from '@shared/schema';
import { ZodError } from 'zod';

// GET /api/job-descriptions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    const limit = limitParam ? parseInt(limitParam) : 100; // Default limit
    const offset = offsetParam ? parseInt(offsetParam) : 0; // Default offset

    if (isNaN(limit) || isNaN(offset)) {
        return NextResponse.json({ message: 'Invalid limit or offset parameter' }, { status: 400 });
    }

    const jobDescriptions = await storage.listJobDescriptions(limit, offset);
    return NextResponse.json(jobDescriptions);
  } catch (error) {
    console.error('Error fetching job descriptions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// POST /api/job-descriptions
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = insertJobDescriptionSchema.parse(body);
    const jobDescription = await storage.createJobDescription(validatedData);
    return NextResponse.json(jobDescription, { status: 201 });
  } catch (error) {
    console.error('Error creating job description:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ message: "Invalid job description data", errors: error.errors }, { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Invalid job description data';
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }
} 