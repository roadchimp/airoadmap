import { ScoreValue } from '../../shared/schema';

interface RoleScoreInput {
  timeSavings: ScoreValue;
  qualityImpact: ScoreValue;
  strategicAlignment: ScoreValue;
  dataReadiness: ScoreValue;
  technicalFeasibility: ScoreValue;
  adoptionRisk: ScoreValue;
}

interface RoleScoreOutput {
  valuePotential: {
    timeSavings: ScoreValue;
    qualityImpact: ScoreValue;
    strategicAlignment: ScoreValue;
    total: number;
  };
  easeOfImplementation: {
    dataReadiness: ScoreValue;
    technicalFeasibility: ScoreValue;
    adoptionRisk: ScoreValue;
    total: number;
  };
  totalScore: number;
}

export function calculateRoleScore(input: RoleScoreInput): RoleScoreOutput {
  // Calculate value potential total (average of time savings, quality impact, and strategic alignment)
  const valuePotentialTotal = (input.timeSavings + input.qualityImpact + input.strategicAlignment) / 3;

  // Calculate ease of implementation total (average of data readiness, technical feasibility, and adoption risk)
  const easeOfImplementationTotal = (input.dataReadiness + input.technicalFeasibility + input.adoptionRisk) / 3;

  // Calculate overall total score (average of value potential and ease of implementation)
  const totalScore = (valuePotentialTotal + easeOfImplementationTotal) / 2;

  return {
    valuePotential: {
      timeSavings: input.timeSavings,
      qualityImpact: input.qualityImpact,
      strategicAlignment: input.strategicAlignment,
      total: valuePotentialTotal,
    },
    easeOfImplementation: {
      dataReadiness: input.dataReadiness,
      technicalFeasibility: input.technicalFeasibility,
      adoptionRisk: input.adoptionRisk,
      total: easeOfImplementationTotal,
    },
    totalScore,
  };
} 