import { storage } from '@/server/storage';
import { insertAssessmentSchema, wizardStepDataSchema, type UserProfile } from '@shared/schema';
import { ZodError } from 'zod';
import { createClient } from '@/../../utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuthAndSecurity } from '../middleware';
import { unstable_noStore } from 'next/cache';

// Input validation schema
const assessmentCreateSchema = insertAssessmentSchema.extend({
  strategicFocus: z.array(z.string()).default([])
});

// GET /api/assessments
async function getAssessments(request: Request) {
  try {
    const assessments = await storage.listAssessments();
    return NextResponse.json({ success: true, data: assessments });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}

// POST /api/assessments
async function createAssessment(request: Request) {
  try {
    const body = await request.json();
    const validatedData = assessmentCreateSchema.parse(body);
    
    // Get user from request (added by withAuth middleware)
    const user = (request as any).user;
    if (!user) {
      return NextResponse.json(
        { error: 'User not found in request context' },
        { status: 500 }
      );
    }
    
    const assessment = await storage.createAssessment({
      ...validatedData,
      userId: user.id
    });
    return NextResponse.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error creating assessment:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid assessment data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    );
  }
}

// Export the handlers wrapped with auth and security middleware
export const GET = withAuthAndSecurity(getAssessments);
export const POST = withAuthAndSecurity(createAssessment);
