import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { withAuthAndSecurity } from '../../../middleware/AuthMiddleware';
import { z } from 'zod';
import { calculatePrioritization } from '@/server/lib/engines/prioritizationEngine';
import { calculateAiAdoptionScore, type CalculatedAiAdoptionScore } from '@/server/lib/engines/aiAdoptionScoreEngine';
import type { 
  WizardStepData, 
  OrganizationScoreWeights,
  AiAdoptionScoreInputComponents
} from '@shared/schema';

interface Params {
  assessmentId: string;
}

// GET /api/reports/assessment/[assessmentId]
async function getReportByAssessment(
  request: Request,
  { params }: { params: { assessmentId: string } }
) {
  try {
    const assessmentId = parseInt(params.assessmentId);
    if (isNaN(assessmentId)) {
      return NextResponse.json(
        { error: 'Invalid assessment ID' },
        { status: 400 }
      );
    }

    const report = await storage.getReportByAssessment(assessmentId);
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error('Error fetching report by assessment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}

// POST /api/reports/assessment/[assessmentId]
async function createReportForAssessment(
  request: Request,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  try {
    const { assessmentId } = await params;
    const parsedAssessmentId = parseInt(assessmentId);
    if (isNaN(parsedAssessmentId)) {
      return NextResponse.json(
        { error: 'Invalid assessment ID' },
        { status: 400 }
      );
    }

    // Get the assessment data to generate the report from
    const assessment = await storage.getAssessment(parsedAssessmentId);
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    console.log(`Generating report for assessment ${parsedAssessmentId}:`, JSON.stringify(assessment, null, 2));

    // Generate report content automatically from assessment data
    const stepData = assessment.stepData as WizardStepData;
    const reportContent = await calculatePrioritization(parsedAssessmentId, stepData);
    
    // Calculate AI Adoption Score if we have the inputs
    let aiAdoptionScoreDetails = undefined;
    let roiDetails = undefined;
    
    if (assessment.aiAdoptionScoreInputs) {
      try {
        const aiAdoptionScore = await calculateAiAdoptionScore(
          assessment.aiAdoptionScoreInputs,
          assessment.industry || 'Other',
          assessment.companyStage || 'Startup',
          assessment.industryMaturity || 'Immature',
          assessment.organizationId
        );
        
        aiAdoptionScoreDetails = aiAdoptionScore;
        roiDetails = {
          inputs: assessment.aiAdoptionScoreInputs,
          calculatedScore: aiAdoptionScore.overallScore,
          breakdown: aiAdoptionScore
        };
        
        console.log(`AI Adoption Score calculated: ${aiAdoptionScore.overallScore}`);
      } catch (error) {
        console.error('Error calculating AI Adoption Score:', error);
        // Continue without AI adoption score if calculation fails
      }
    }

    const report = await storage.createReport({
      assessmentId: parsedAssessmentId,
      executiveSummary: reportContent.executiveSummary,
      prioritizationData: reportContent.prioritizationData,
      aiSuggestions: reportContent.aiSuggestions,
      performanceImpact: reportContent.performanceImpact,
      aiAdoptionScoreDetails,
      roiDetails
    });

    // Update assessment status to completed
    await storage.updateAssessmentStatus(parsedAssessmentId, "completed");

    return NextResponse.json({ success: true, data: report, reportId: report.id });
  } catch (error) {
    console.error('Error creating report for assessment:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid report data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}

// Export the handlers wrapped with auth and security middleware
export const GET = withAuthAndSecurity(getReportByAssessment);
export const POST = withAuthAndSecurity(createReportForAssessment); 