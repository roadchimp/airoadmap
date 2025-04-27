import { NextResponse } from 'next/server';
import { storage } from '../../../server/pg-storage';
import { calculateRoleScore } from '../../../shared/scoring';
import { AssessmentScoreData } from '../../../shared/schema';

export async function POST(req: Request) {
  try {
    const body = await req.json();
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
      return NextResponse.json(
        { error: 'Missing wizardStepId' },
        { status: 400 }
      );
    }

    // Calculate role scores using the scoring utility
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

    return NextResponse.json(score);
  } catch (error) {
    console.error('Error in assessment scoring:', error);
    return NextResponse.json(
      { error: 'Failed to process assessment score' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const wizardStepId = searchParams.get('wizardStepId');

    if (!wizardStepId) {
      return NextResponse.json(
        { error: 'Missing wizardStepId' },
        { status: 400 }
      );
    }

    const score = await storage.getAssessmentScore(wizardStepId);

    if (!score) {
      return NextResponse.json(
        { error: 'Assessment score not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(score);
  } catch (error) {
    console.error('Error fetching assessment score:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment score' },
      { status: 500 }
    );
  }
} 