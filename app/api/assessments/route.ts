import { storage } from '@/server/storage';
import { insertAssessmentSchema, wizardStepDataSchema, type UserProfile } from '@shared/schema';
import { ZodError } from 'zod';
import { createClient } from '@/../../utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuthAndSecurity } from '../middleware/AuthMiddleware';
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
async function createAssessment(request: Request, context: any) {
  try {
    const body = await request.json();
    console.log('Received assessment payload:', JSON.stringify(body, null, 2));
    
    // Get user from context (added by withAuth middleware)
    const user = context.user;
    if (!user) {
      return NextResponse.json(
        { error: 'User not found in request context' },
        { status: 500 }
      );
    }
    
    // Look up the user profile to get the integer user ID
    let userProfile = await storage.getUserProfileByAuthId(user.id);
    
    // If no user profile exists, create one automatically
    if (!userProfile) {
      console.log(`Creating user profile for auth ID: ${user.id}`);
      userProfile = await storage.createUserProfile({
        auth_id: user.id,
        full_name: user.email?.split('@')[0] || 'User', // Basic name from email
        // organization_id will be null initially
      });
      console.log(`Created user profile with ID: ${userProfile.id}`);
    }
    
    // Add userId to the payload before validation
    const payloadWithUserId = {
      ...body,
      userId: userProfile.id
    };
    
    console.log('Payload with userId:', JSON.stringify(payloadWithUserId, null, 2));
    
    const validatedData = assessmentCreateSchema.parse(payloadWithUserId);
    console.log('Validated assessment data:', JSON.stringify(validatedData, null, 2));
    
    const assessment = await storage.createAssessment(validatedData);
    return NextResponse.json({ success: true, data: assessment });
  } catch (error) {
    console.error('Error creating assessment:', error);
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
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
