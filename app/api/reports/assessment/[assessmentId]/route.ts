import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { calculatePrioritization } from '@/server/lib/prioritizationEngine';
import type { WizardStepData, AssessmentResponse } from '@shared/schema';

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
      consultantCommentary: "" // Default empty commentary
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