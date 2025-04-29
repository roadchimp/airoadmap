import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { calculatePrioritization } from '@/server/lib/prioritizationEngine';
import type { WizardStepData } from '@shared/schema';

// POST /api/prioritize
export async function POST(request: Request) {
  try {
    const { assessmentId } = await request.json();

    if (!assessmentId || typeof assessmentId !== 'number') {
      return NextResponse.json({ message: 'Valid assessment ID is required and must be a number' }, { status: 400 });
    }

    const assessment = await storage.getAssessment(assessmentId);
    if (!assessment) {
      return NextResponse.json({ message: 'Assessment not found' }, { status: 404 });
    }

    const stepData = assessment.stepData as WizardStepData; // Assuming type assertion is okay based on original
    if (!stepData) {
      return NextResponse.json({ message: 'Assessment has no step data' }, { status: 400 });
    }

    // Calculate prioritization (now async with AI integration)
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

    return NextResponse.json(report, { status: 201 });

  } catch (error) {
    console.error('Error generating prioritization results:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error generating prioritization results';
    return NextResponse.json({ message: errorMessage }, { status: 500 }); // Original used 500
  }
} 