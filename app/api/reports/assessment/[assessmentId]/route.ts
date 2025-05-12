import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { calculatePrioritization } from '@/server/lib/prioritizationEngine';
import { calculateAiAdoptionScore, type CalculatedAiAdoptionScore } from '@/server/lib/aiAdoptionScoreEngine';
import type { 
  WizardStepData, 
  AssessmentResponse, 
  AiAdoptionScoreInputComponents,
  OrganizationScoreWeights
} from '@shared/schema';

interface Params {
  assessmentId: string;
}

// GET /api/reports/assessment/:assessmentId
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const assessmentId = parseInt(params.assessmentId);
    if (isNaN(assessmentId)) {
      return NextResponse.json({ message: 'Invalid assessment ID' }, { status: 400 });
    }
    
    const report = await storage.getReportByAssessment(assessmentId);
    if (!report) {
      // Changed to 404 to match original logic more closely
      return NextResponse.json({ message: 'Report not found for this assessment' }, { status: 404 });
    }
    
    return NextResponse.json(report);
  } catch (error) {
    console.error('Error fetching report by assessment ID:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// POST /api/reports/assessment/:assessmentId
// Generate a new report for the given assessment
export async function POST(request: Request, { params }: { params: Params }) {
  try {
    const assessmentId = parseInt(params.assessmentId);
    if (isNaN(assessmentId)) {
      return NextResponse.json({ message: 'Invalid assessment ID' }, { status: 400 });
    }

    const assessment = await storage.getAssessment(assessmentId);
    if (!assessment) {
      return NextResponse.json({ message: 'Assessment not found' }, { status: 404 });
    }

    // Ensure organizationId is present for fetching weights
    if (!assessment.organizationId) {
      console.error(`Assessment ${assessmentId} is missing organizationId.`);
      return NextResponse.json({ message: 'Assessment is missing organization ID, cannot calculate adoption score.' }, { status: 400 });
    }

    // 1. Fetch Organization Score Weights
    // It's assumed getOrganizationScoreWeights returns valid default weights if no specific ones are found.
    const organizationWeights = await storage.getOrganizationScoreWeights(assessment.organizationId);
    if (!organizationWeights) {
      // This case should ideally be handled by getOrganizationScoreWeights returning defaults.
      // If it can truly be undefined, we might need to log and use hardcoded emergency defaults or fail.
      console.error(`Organization score weights not found for organization ${assessment.organizationId}. Report generation might be inaccurate.`);
      // For now, let's allow proceeding but this is a point of concern if it happens.
      // A more robust solution might be to throw an error or use a globally defined default set of weights.
      // return NextResponse.json({ message: `Organization score weights not found for organization ${assessment.organizationId}.` }, { status: 500 });
    }
    
    // 2. Get AI Adoption Score Inputs from assessment
    // Assuming assessment.aiAdoptionScoreInputs is of type AiAdoptionScoreInputComponents | null | undefined
    const scoreInputs = assessment.aiAdoptionScoreInputs as AiAdoptionScoreInputComponents | null;

    if (!scoreInputs) {
      console.warn(`Assessment ${assessmentId} is missing AI adoption score inputs. Score will not be calculated.`);
      // Proceed without adoption score if inputs are missing, or return an error
      // return NextResponse.json({ message: 'Assessment is missing AI adoption score inputs.' }, { status: 400 });
    }
    
    let calculatedAdoptionScore: CalculatedAiAdoptionScore | undefined = undefined;
    if (scoreInputs && assessment.industry && assessment.companyStage && assessment.industryMaturity) {
        try {
            calculatedAdoptionScore = await calculateAiAdoptionScore(
                scoreInputs,
                assessment.industry,
                assessment.companyStage,
                assessment.industryMaturity,
                assessment.organizationId
            );
        } catch (calcError) {
            console.error('Error calculating AI Adoption Score:', calcError);
            // Decide if report generation should fail or proceed without score
            // For now, proceed without it, but log the error.
        }
    } else {
        console.warn(`Cannot calculate AI Adoption Score due to missing required fields: ${!scoreInputs ? 'scoreInputs' : ''} ${!assessment.industry ? 'industry' : ''} ${!assessment.companyStage ? 'companyStage' : ''} ${!assessment.industryMaturity ? 'industryMaturity' : ''}`);
    }

    // Get assessment responses for this assessment
    const assessmentResponses = await storage.getAssessmentResponsesByAssessment(assessmentId);
    
    // Fall back to step data if no assessment responses are found
    let stepData = assessment.stepData as WizardStepData;
    if (assessmentResponses && assessmentResponses.length > 0) {
      // Convert assessment responses to WizardStepData format (implementation would be identical to prioritize endpoint)
      // For now, fallback to step data
    } else if (!stepData) {
      return NextResponse.json({ message: 'Assessment has no data' }, { status: 400 });
    }

    // Calculate prioritization
    const results = await calculatePrioritization(stepData);

    // Create a report with the results
    const report = await storage.createReport({
      assessmentId,
      executiveSummary: results.executiveSummary,
      prioritizationData: results.prioritizationData,
      aiSuggestions: results.aiSuggestions,
      performanceImpact: results.performanceImpact,
      consultantCommentary: "", // Default empty commentary
      // Add the new fields from AI Adoption Score calculation
      aiAdoptionScoreDetails: calculatedAdoptionScore ? calculatedAdoptionScore : null, // Store the full score object or null
      roiDetails: calculatedAdoptionScore ? calculatedAdoptionScore.roiDetails : null, // Store ROI details or null
    });

    // Update assessment status to completed
    await storage.updateAssessmentStatus(assessmentId, "completed");

    // Return the new report's ID
    return NextResponse.json({ reportId: report.id }, { status: 201 });
  } catch (error) {
    console.error('Error generating report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error generating report';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
} 