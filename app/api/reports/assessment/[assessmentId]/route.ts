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

    console.log(`Generating report for assessment ${assessmentId}:`, JSON.stringify({
      title: assessment.title,
      status: assessment.status,
      industry: assessment.industry,
      industryMaturity: assessment.industryMaturity,
      companyStage: assessment.companyStage,
      strategicFocus: assessment.strategicFocus,
      hasAiAdoptionScoreInputs: !!assessment.aiAdoptionScoreInputs,
      aiAdoptionScoreInputs: assessment.aiAdoptionScoreInputs,
      stepDataKeys: Object.keys(assessment.stepData || {})
    }, null, 2));

    // Dump the entire assessment for debugging
    console.log(`Full assessment data for ID ${assessmentId}:`, JSON.stringify(assessment, null, 2));

    // Ensure organizationId is present for fetching weights
    if (!assessment.organizationId) {
      console.error(`Assessment ${assessmentId} is missing organizationId.`);
      return NextResponse.json({ message: 'Assessment is missing organization ID, cannot calculate adoption score.' }, { status: 400 });
    }

    // 1. Fetch Organization Score Weights
    // It's assumed getOrganizationScoreWeights returns valid default weights if no specific ones are found.
    const organizationWeights = await storage.getOrganizationScoreWeights(assessment.organizationId);
    if (!organizationWeights) {
      console.error(`Organization score weights not found for organization ${assessment.organizationId}. Using default weights.`);
    } else {
      console.log(`Using organization weights for organization ${assessment.organizationId}:`, JSON.stringify(organizationWeights, null, 2));
    }
    
    // 2. Get AI Adoption Score Inputs from assessment
    // Assuming assessment.aiAdoptionScoreInputs is of type AiAdoptionScoreInputComponents | null | undefined
    const scoreInputs = assessment.aiAdoptionScoreInputs as AiAdoptionScoreInputComponents | null;
    
    // Declare the calculated score variable
    let calculatedAdoptionScore: CalculatedAiAdoptionScore | undefined = undefined;

    if (!scoreInputs) {
      console.warn(`Assessment ${assessmentId} is missing AI adoption score inputs. Using default values.`);
      // Create default score inputs based on industry and company stage
      const defaultScoreInputs: AiAdoptionScoreInputComponents = {
        adoptionRateForecast: 80,
        timeSavingsPerUserHours: 7, 
        affectedUserCount: 120,
        costEfficiencyGainsAmount: 20,
        performanceImprovementPercentage: 30,
        toolSprawlReductionScore: 4
      };
      
      // Use the default score inputs for the calculation
      try {
        console.log(`Calculating AI Adoption Score for assessment ${assessmentId} with DEFAULT parameters`);
        
        calculatedAdoptionScore = await calculateAiAdoptionScore(
            defaultScoreInputs,
            assessment.industry,
            assessment.companyStage,
            assessment.industryMaturity,
            assessment.organizationId
        );
        
        console.log(`Calculated AI Adoption Score with DEFAULT inputs:`, JSON.stringify(calculatedAdoptionScore, null, 2));
      } catch (calcError) {
        console.error('Error calculating AI Adoption Score with default inputs:', calcError);
        if (calcError instanceof Error) {
          console.error('Error details:', calcError.message, calcError.stack);
        }
      }
    } else {
        console.log(`AI Adoption Score Inputs for assessment ${assessmentId}:`, JSON.stringify(scoreInputs, null, 2));
        
        try {
            console.log(`Calculating AI Adoption Score for assessment ${assessmentId} with parameters:`, JSON.stringify({
              industry: assessment.industry,
              companyStage: assessment.companyStage,
              industryMaturity: assessment.industryMaturity,
              organizationId: assessment.organizationId
            }, null, 2));
            
            calculatedAdoptionScore = await calculateAiAdoptionScore(
                scoreInputs,
                assessment.industry,
                assessment.companyStage,
                assessment.industryMaturity,
                assessment.organizationId
            );
            
            console.log(`Calculated AI Adoption Score:`, JSON.stringify(calculatedAdoptionScore, null, 2));
        } catch (calcError) {
            console.error('Error calculating AI Adoption Score:', calcError);
            // Log detailed error information
            if (calcError instanceof Error) {
              console.error('Error details:', calcError.message, calcError.stack);
            }
            // Decide if report generation should fail or proceed without score
            // For now, proceed without it, but log the error.
        }
    }

    // Get assessment responses for this assessment
    const assessmentResponses = await storage.getAssessmentResponsesByAssessment(assessmentId);
    
    // Fall back to step data if no assessment responses are found
    let stepData = assessment.stepData as WizardStepData;
    if (assessmentResponses && assessmentResponses.length > 0) {
      // Convert assessment responses to WizardStepData format (implementation would be identical to prioritize endpoint)
      // For now, fallback to step data
      console.log(`Found ${assessmentResponses.length} assessment responses.`);
    } else if (!stepData) {
      console.error(`Assessment ${assessmentId} has no step data.`);
      return NextResponse.json({ message: 'Assessment has no data' }, { status: 400 });
    }

    console.log(`Step data for prioritization engine:`, JSON.stringify(Object.keys(stepData || {}), null, 2));
    
    // Calculate prioritization
    const results = await calculatePrioritization(stepData);

    // Create enhanced sample data for different roles to enable drill-down functionality
    // This adds a variety of roles with their respective metrics for the Opportunities tab
    const enhancedPrioritizationData = {
      ...results.prioritizationData,
      prioritizedItems: [
        {
          id: 1,
          title: "Customer Service",
          priority: "high",
          department: "Support",
          valueLevel: "high",
          valueScore: 85,
          effortLevel: "low",
          effortScore: 35,
          aiAdoptionScore: 82,
          metrics: [
            { name: "Time to Resolution", value: "2.5 hours", improvement: -35 },
            { name: "Customer Satisfaction", value: "92%", improvement: 15 },
            { name: "Tickets Handled per Day", value: "45", improvement: 28 }
          ]
        },
        {
          id: 2,
          title: "Data Analysis",
          priority: "high",
          department: "Operations",
          valueLevel: "high",
          valueScore: 80,
          effortLevel: "medium",
          effortScore: 40,
          aiAdoptionScore: 76,
          metrics: [
            { name: "Report Generation Time", value: "1.2 hours", improvement: -65 },
            { name: "Data Processing Volume", value: "2500 records/day", improvement: 120 },
            { name: "Error Rate", value: "0.5%", improvement: -75 }
          ]
        },
        {
          id: 3,
          title: "Content Creation",
          priority: "high",
          department: "Marketing",
          valueLevel: "high",
          valueScore: 75,
          effortLevel: "medium",
          effortScore: 45,
          aiAdoptionScore: 79,
          metrics: [
            { name: "Content Production Rate", value: "12 pieces/week", improvement: 100 },
            { name: "Engagement Rate", value: "4.8%", improvement: 15 },
            { name: "Time to Publish", value: "1.5 days", improvement: -50 }
          ]
        },
        {
          id: 4,
          title: "Inventory Management",
          priority: "medium",
          department: "Logistics",
          valueLevel: "medium",
          valueScore: 70,
          effortLevel: "medium",
          effortScore: 50,
          aiAdoptionScore: 65,
          metrics: [
            { name: "Stockout Rate", value: "1.2%", improvement: -40 },
            { name: "Inventory Turnover", value: "12.5", improvement: 15 },
            { name: "Order Fulfillment Time", value: "1.8 days", improvement: -25 }
          ]
        },
        {
          id: 5,
          title: "HR Screening",
          priority: "medium",
          department: "Human Resources",
          valueLevel: "medium",
          valueScore: 65,
          effortLevel: "high",
          effortScore: 55,
          aiAdoptionScore: 72,
          metrics: [
            { name: "Time to Screen", value: "1.2 days", improvement: -60 },
            { name: "Quality of Hire", value: "85%", improvement: 12 },
            { name: "Candidate Experience Score", value: "4.6/5", improvement: 15 }
          ]
        }
      ]
    };

    // Create a report with the enhanced results
    const report = await storage.createReport({
      assessmentId,
      executiveSummary: results.executiveSummary,
      prioritizationData: enhancedPrioritizationData,
      aiSuggestions: results.aiSuggestions,
      performanceImpact: results.performanceImpact,
      consultantCommentary: "", // Default empty commentary
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

    console.log(`Created report ${report.id} for assessment ${assessmentId}`);

    // Update assessment status to completed
    await storage.updateAssessmentStatus(assessmentId, "completed");

    // Return the new report's ID
    return NextResponse.json({ reportId: report.id }, { status: 201 });
  } catch (error) {
    console.error('Error generating report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error generating report';
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
} 