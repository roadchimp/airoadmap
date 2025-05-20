import { NextResponse } from 'next/server';
import { storage } from '@/../../server/pg-storage';
import { insertAssessmentSchema, wizardStepDataSchema } from '@shared/schema';
import { ZodError } from 'zod';
import { getAuthUser, requireAuth, withAuth } from '../middleware';

// GET /api/assessments
async function getAssessmentsHandler(request: Request, authId: string) {
  try {
    // Get user profile to determine organization
    const profile = await storage.getUserProfileByAuthId(authId);
    
    // Pass auth ID to storage so RLS policies are applied
    if (profile) {
      const assessments = await storage.listAssessments();
      return NextResponse.json(assessments);
    }
    
    return NextResponse.json({ error: "User profile not found" }, { status: 404 });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// Use withAuth middleware to handle authentication and set auth context
export const GET = withAuth(getAssessmentsHandler);

// POST /api/assessments
async function createAssessmentHandler(request: Request, authId: string) {
  try {
    const body = await request.json();
    console.log("Received assessment data:", JSON.stringify(body, null, 2));

    const validatedBasics = wizardStepDataSchema.shape.basics.parse(body.basics);

    if (!validatedBasics) {
      return NextResponse.json({ error: "Basic assessment information is required." }, { status: 400 });
    }

    // Get user profile to determine organization
    const profile = await storage.getUserProfileByAuthId(authId);
    
    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // Get organizationId from user profile
    const organizationId = profile.organization_id || body.organizationId || 1;

    // Clone the stepData to ensure we're not modifying the original
    const fullStepData = JSON.parse(JSON.stringify(body.stepData || {}));
    
    // Ensure aiAdoptionScoreInputs is included in stepData
    if (body.aiAdoptionScoreInputs) {
      fullStepData.aiAdoptionScoreInputs = body.aiAdoptionScoreInputs;
    }

    const assessmentPayload: typeof insertAssessmentSchema._input = {
      title: validatedBasics.reportName || `Assessment for ${validatedBasics.companyName}`,
      organizationId,
      userId: parseInt(authId), // Use the authenticated user's ID
      status: 'draft',
      
      industry: body.industry || validatedBasics.industry || "",
      industryMaturity: body.industryMaturity || validatedBasics.industryMaturity,
      companyStage: body.companyStage || validatedBasics.companyStage,
      
      strategicFocus: body.strategicFocus || [],

      stepData: fullStepData,
      aiAdoptionScoreInputs: body.aiAdoptionScoreInputs,
    };

    console.log("Creating assessment with payload:", JSON.stringify(assessmentPayload, null, 2));
    const newAssessment = await storage.createAssessment(assessmentPayload);
    return NextResponse.json(newAssessment, { status: 201 });
  } catch (error) {
    console.error("Failed to create assessment:", error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create assessment" }, { status: 500 });
  }
}

// Use withAuth middleware to handle authentication and set auth context
export const POST = withAuth(createAssessmentHandler); 