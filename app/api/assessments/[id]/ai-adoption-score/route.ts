import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/server/storage";
import { calculateAiAdoptionScore } from "@/server/lib/aiAdoptionScoreEngine";
import { AiAdoptionScoreInputComponents } from "@shared/schema";

// GET handler retrieves the AI Adoption Score for an assessment
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assessmentId = parseInt(params.id, 10);
    if (isNaN(assessmentId)) {
      return NextResponse.json({ error: "Invalid assessment ID" }, { status: 400 });
    }

    // Get the assessment
    const assessment = await storage.getAssessment(assessmentId);
    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Get the organization
    const organization = assessment.organizationId 
      ? await storage.getOrganization(assessment.organizationId)
      : undefined;

    if (!assessment.industry || !assessment.industryMaturity || !assessment.companyStage) {
      return NextResponse.json(
        { error: "Assessment missing required fields: industry, industryMaturity, or companyStage" },
        { status: 400 }
      );
    }

    // Get AI adoption score inputs from assessment
    const inputs = assessment.aiAdoptionScoreInputs as AiAdoptionScoreInputComponents || {};

    // Calculate the score
    const aiAdoptionScore = await calculateAiAdoptionScore(
      inputs,
      assessment.industry,
      assessment.companyStage,
      assessment.industryMaturity,
      assessment.organizationId
    );

    return NextResponse.json({ aiAdoptionScore });
  } catch (error) {
    console.error("Error calculating AI Adoption Score:", error);
    return NextResponse.json(
      { error: "Failed to calculate AI Adoption Score" },
      { status: 500 }
    );
  }
}

// POST handler updates the AI Adoption Score inputs for an assessment
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assessmentId = parseInt(params.id, 10);
    if (isNaN(assessmentId)) {
      return NextResponse.json({ error: "Invalid assessment ID" }, { status: 400 });
    }

    // Get the assessment
    const assessment = await storage.getAssessment(assessmentId);
    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Parse the inputs from the request body
    const inputs = await req.json() as AiAdoptionScoreInputComponents;
    
    // Custom update mechanism - pass aiAdoptionScoreInputs as an additional field to updateAssessmentStep
    const response = await fetch(`/api/assessments/${assessmentId}/step`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aiAdoptionScoreInputs: inputs }) 
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update assessment: ${await response.text()}`);
    }

    // Calculate the new score
    if (!assessment.industry || !assessment.industryMaturity || !assessment.companyStage) {
      return NextResponse.json(
        { error: "Assessment missing required fields: industry, industryMaturity, or companyStage" },
        { status: 400 }
      );
    }

    const aiAdoptionScore = await calculateAiAdoptionScore(
      inputs,
      assessment.industry,
      assessment.companyStage,
      assessment.industryMaturity,
      assessment.organizationId
    );

    return NextResponse.json({ 
      success: true,
      aiAdoptionScore 
    });
  } catch (error) {
    console.error("Error updating AI Adoption Score inputs:", error);
    return NextResponse.json(
      { error: "Failed to update AI Adoption Score inputs" },
      { status: 500 }
    );
  }
} 