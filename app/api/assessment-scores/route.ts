import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { calculateRoleScore } from '@/server/lib/engines/roleScoreEngine';

// POST /api/assessment-scores
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      wizardStepId,
      timeSavings,
      qualityImpact,
      strategicAlignment,
      dataReadiness,
      technicalFeasibility,
      adoptionRisk,
    } = body;

    if (!wizardStepId) {
      return NextResponse.json({ message: 'wizardStepId is required' }, { status: 400 });
    }
    // Add further validation for other fields if necessary

    // Calculate scores
    const roleScore = calculateRoleScore({
      timeSavings,
      qualityImpact,
      strategicAlignment,
      dataReadiness,
      technicalFeasibility,
      adoptionRisk,
    });

    // Create or update assessment score
    const score = await storage.upsertAssessmentScore({
      wizardStepId,
      timeSavings,
      qualityImpact,
      strategicAlignment,
      dataReadiness,
      technicalFeasibility,
      adoptionRisk,
      valuePotentialTotal: roleScore.valuePotential.total,
      easeOfImplementationTotal: roleScore.easeOfImplementation.total,
      totalScore: roleScore.totalScore,
    });

    return NextResponse.json(score, { status: 201 }); // Assuming 201 for upsert success
  } catch (error) {
    console.error('Error creating/updating assessment score:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error creating/updating assessment score';
    return NextResponse.json({ message: errorMessage }, { status: 400 }); // Original used 400
  }
} 