import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { insertAssessmentSchema } from '@shared/schema';
import { ZodError } from 'zod';

// GET /api/assessments
export async function GET() {
  try {
    const assessments = await storage.listAssessments();
    return NextResponse.json(assessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// POST /api/assessments
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = insertAssessmentSchema.parse(body);
    const assessment = await storage.createAssessment(validatedData);
    return NextResponse.json(assessment, { status: 201 });
  } catch (error) {
    console.error('Error creating assessment:', error);
    if (error instanceof ZodError) {
      return NextResponse.json({ message: "Invalid assessment data", errors: error.errors }, { status: 400 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Invalid assessment data';
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }
} 