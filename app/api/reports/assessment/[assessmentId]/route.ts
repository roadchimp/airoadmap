import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { calculatePrioritization } from '@/server/lib/prioritizationEngine';
import { calculateAiAdoptionScore, type CalculatedAiAdoptionScore } from '@/server/lib/aiAdoptionScoreEngine';
import { withAuthGet, withAuthPost } from '@/app/api/middleware';
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
export const GET = withAuthGet(async (request: Request, authId: string, { params }: { params: Params }) => {
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
});

// POST /api/reports/assessment/:assessmentId
// Generate a new report for the given assessment
export const POST = withAuthPost(async (request: Request, authId: string, { params }: { params: Params }) => {
  try {
    console.log(`Authenticated POST request for report generation from user: ${authId}`);
    
    // Special bypass for e2e tests - check for test auth bypass parameter
    const url = new URL(request.url);
    const isTestBypass = url.searchParams.has('test_auth_bypass');
    
    if (isTestBypass) {
      console.log('E2E TEST BYPASS: Skipping authentication check for test');
    }

    // Enhanced session debugging for production issues
    console.log(`Report generation request details:`, {
      url: request.url,
      method: request.method,
      authId: authId,
      userAgent: request.headers.get('User-Agent'),
      origin: request.headers.get('Origin'),
      referer: request.headers.get('Referer')
    });

    // Runtime environment variable check
    console.log(`[Report API] Runtime environment check:`);
    console.log(`[Report API] - NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`[Report API] - VERCEL_ENV: ${process.env.VERCEL_ENV}`);
    console.log(`[Report API] - OpenAI API Key available: ${!!process.env.OPENAI_API_KEY}`);
    console.log(`[Report API] - OpenAI API Key length: ${process.env.OPENAI_API_KEY?.length || 0}`);
    console.log(`[Report API] - OpenAI API Key first 10 chars: ${process.env.OPENAI_API_KEY?.substring(0, 10) || 'undefined'}`);
    
    const assessmentId = parseInt(params.assessmentId);
    if (isNaN(assessmentId)) {
      return NextResponse.json({ message: 'Invalid assessment ID' }, { status: 400 });
    }

    const assessment = await storage.getAssessment(assessmentId);
    if (!assessment) {
      return NextResponse.json({ message: 'Assessment not found' }, { status: 404 });
    }

    // Log basic assessment info for debugging
    console.log(`Starting report generation for assessment ${assessmentId}:`, JSON.stringify({
      title: assessment.title,
      status: assessment.status,
      industry: assessment.industry,
      industryMaturity: assessment.industryMaturity,
      companyStage: assessment.companyStage,
    }, null, 2));

    // OPTIMIZATION 1: Create a minimal initial report immediately
    // This allows us to return a reportId quickly, and the client can redirect immediately
    const initialReport = await storage.createReport({
      assessmentId,
      executiveSummary: `Generating report for ${assessment.title || 'assessment'}...`,
      prioritizationData: {
        heatmap: { matrix: {} },
        prioritizedItems: []
      },
      aiSuggestions: [],
      performanceImpact: {
        roleImpacts: [],
        estimatedRoi: 0
      },
      consultantCommentary: "",
      aiAdoptionScoreDetails: null,
      roiDetails: null,
    });

    console.log(`Created initial report ${initialReport.id} for assessment ${assessmentId}`);

    // OPTIMIZATION 2: Process the rest in the background
    // Don't await this - it will continue running after we send the response
    processReportInBackground(assessment, initialReport.id, authId);

    // Return the new report's ID immediately so frontend can redirect
    return NextResponse.json({ reportId: initialReport.id }, { status: 201 });
  } catch (error) {
    console.error('Error generating report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error generating report';
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
});

// Background processing function - not awaited by the main request handler
async function processReportInBackground(assessment: any, reportId: number, authId: string) {
  try {
    console.log(`Processing report ${reportId} in background for assessment ${assessment.id} (user: ${authId})`);
    
    // Set auth context for storage operations
    await storage.setAuthContext(authId);
    
    // Perform all the expensive calculations
    // 1. Fetch Organization Score Weights
    const organizationWeights = await storage.getOrganizationScoreWeights(assessment.organizationId);
    if (!organizationWeights) {
      console.error(`Organization score weights not found for organization ${assessment.organizationId}. Using default weights.`);
    }
    
    // 2. Get AI Adoption Score Inputs from assessment
    const scoreInputs = assessment.aiAdoptionScoreInputs as AiAdoptionScoreInputComponents | null;
    
    // Calculate AI Adoption Score if inputs are available
    let calculatedAdoptionScore: CalculatedAiAdoptionScore | undefined = undefined;

    if (scoreInputs) {
      try {
        console.log(`Calculating AI Adoption Score for assessment ${assessment.id}`);
        
        calculatedAdoptionScore = await calculateAiAdoptionScore(
            scoreInputs,
            assessment.industry,
            assessment.companyStage,
            assessment.industryMaturity,
            assessment.organizationId
        );
        
        console.log(`Calculated AI Adoption Score successfully`);
      } catch (calcError) {
        console.error('Error calculating AI Adoption Score:', calcError);
      }
    } else {
      // Use default values for calculation if no inputs provided
      try {
        const defaultScoreInputs: AiAdoptionScoreInputComponents = {
          adoptionRateForecast: 80,
          timeSavingsPerUserHours: 7, 
          affectedUserCount: 120,
          costEfficiencyGainsAmount: 25000,
          performanceImprovementPercentage: 30,
          toolSprawlReductionScore: 4
        };
        
        calculatedAdoptionScore = await calculateAiAdoptionScore(
            defaultScoreInputs,
            assessment.industry,
            assessment.companyStage,
            assessment.industryMaturity,
            assessment.organizationId
        );
      } catch (calcError) {
        console.error('Error calculating AI Adoption Score with default inputs:', calcError);
      }
    }

    // Get assessment responses or step data
    const stepData = assessment.stepData as WizardStepData;
    if (!stepData) {
      console.error(`Assessment ${assessment.id} has no step data.`);
      throw new Error('Assessment has no data');
    }

    // Calculate prioritization
    const results = await calculatePrioritization(assessment.id, stepData);
    
    // Update the report with the calculated results
    await storage.updateReport(reportId, {
      executiveSummary: results.executiveSummary,
      prioritizationData: results.prioritizationData,
      aiSuggestions: results.aiSuggestions,
      performanceImpact: results.performanceImpact,
      // Add the new fields from AI Adoption Score calculation
      aiAdoptionScoreDetails: calculatedAdoptionScore ? {
        score: Math.round(calculatedAdoptionScore.overallScore),
        components: {
          adoptionRate: Math.round(calculatedAdoptionScore.components.adoptionRate.normalizedScore * 100),
          timeSaved: Math.round(calculatedAdoptionScore.components.timeSavings.normalizedScore * 100),
          costEfficiency: Math.round(calculatedAdoptionScore.components.costEfficiency.normalizedScore * 100),
          performanceImprovement: Math.round(calculatedAdoptionScore.components.performanceImprovement.normalizedScore * 100),
          toolSprawl: Math.round(calculatedAdoptionScore.components.toolSprawlReduction.normalizedScore * 4) - 2
        }
      } : null,
      // Format ROI details to match expected component structure
      roiDetails: calculatedAdoptionScore ? {
        annualRoi: Math.round(calculatedAdoptionScore.roiDetails.netBenefitAmount || 0),
        costSavings: Math.round((calculatedAdoptionScore.roiDetails.netBenefitAmount || 0) * 0.6), // Simplification: 60% of net benefit
        additionalRevenue: Math.round((calculatedAdoptionScore.roiDetails.netBenefitAmount || 0) * 0.4), // Simplification: 40% of net benefit
        aiInvestment: Math.round(calculatedAdoptionScore.roiDetails.investmentAmount || 0),
        roiRatio: calculatedAdoptionScore.roiDetails.calculatedRoiPercentage ? 
                  (calculatedAdoptionScore.roiDetails.calculatedRoiPercentage / 100) : 1.5 // Convert percentage to ratio
      } : null,
    });

    console.log(`Updated report ${reportId} with full results for assessment ${assessment.id}`);

    // Update assessment status to completed
    await storage.updateAssessmentStatus(assessment.id, "completed");
    
    console.log(`Background processing completed for report ${reportId}`);
  } catch (error) {
    console.error(`Error in background processing for report ${reportId}:`, error);
    // We're in the background, so we can't return an error response
    // Just log it and continue
  }
} 