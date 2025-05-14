import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { insertAssessmentSchema, wizardStepDataSchema } from '@shared/schema';
import { ZodError } from 'zod';
import { PgStorage } from '@/server/pg-storage';

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
  const storage = new PgStorage();
  try {
    await (storage as any).ensureInitialized();

    const body = await request.json();
    console.log("Received assessment data:", JSON.stringify(body, null, 2));

    const validatedBasics = wizardStepDataSchema.shape.basics.parse(body.basics);

    if (!validatedBasics) {
      return NextResponse.json({ error: "Basic assessment information is required." }, { status: 400 });
    }

    const organizationId = body.organizationId || 1;

    // Clone the stepData to ensure we're not modifying the original
    const fullStepData = JSON.parse(JSON.stringify(body.stepData || {}));
    
    // Ensure aiAdoptionScoreInputs is included in stepData
    if (body.aiAdoptionScoreInputs) {
      fullStepData.aiAdoptionScoreInputs = body.aiAdoptionScoreInputs;
    }

    const assessmentPayload: typeof insertAssessmentSchema._input = {
      title: validatedBasics.reportName || `Assessment for ${validatedBasics.companyName}`,
      organizationId: organizationId,
      userId: body.userId || 1,
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
  } finally {
    await storage.disconnect();
  }
} 