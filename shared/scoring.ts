import { RoleScore, ScoreValue, scoringCriteria, AssessmentScoreData } from './schema';

const WEIGHT_VALUE_POTENTIAL = 0.6;
const WEIGHT_EASE_OF_IMPLEMENTATION = 0.4;

/**
 * Weights for different scoring criteria
 */
export const SCORE_WEIGHTS = {
  timeSavings: 0.2,
  qualityImpact: 0.2,
  strategicAlignment: 0.2,
  dataReadiness: 0.15,
  technicalFeasibility: 0.15,
  adoptionRisk: 0.1,
} as const;

export const calculateRoleScore = (scores: {
  timeSavings: ScoreValue;
  qualityImpact: ScoreValue;
  strategicAlignment: ScoreValue;
  dataReadiness: ScoreValue;
  technicalFeasibility: ScoreValue;
  adoptionRisk: ScoreValue;
}): RoleScore => {
  // Calculate Value Potential total (average of its components)
  const valuePotentialTotal = (
    scores.timeSavings +
    scores.qualityImpact +
    scores.strategicAlignment
  ) / 3;

  // Calculate Ease of Implementation total (average of its components)
  const easeOfImplementationTotal = (
    scores.dataReadiness +
    scores.technicalFeasibility +
    scores.adoptionRisk
  ) / 3;

  // Calculate weighted total score
  const totalScore = (
    valuePotentialTotal * WEIGHT_VALUE_POTENTIAL +
    easeOfImplementationTotal * WEIGHT_EASE_OF_IMPLEMENTATION
  );

  return {
    valuePotential: {
      timeSavings: scores.timeSavings,
      qualityImpact: scores.qualityImpact,
      strategicAlignment: scores.strategicAlignment,
      total: valuePotentialTotal,
    },
    easeOfImplementation: {
      dataReadiness: scores.dataReadiness,
      technicalFeasibility: scores.technicalFeasibility,
      adoptionRisk: scores.adoptionRisk,
      total: easeOfImplementationTotal,
    },
    totalScore,
  };
};

export const getScoreDescription = (score: number): string => {
  if (score >= 4.5) return "Exceptional candidate for AI transformation";
  if (score >= 4.0) return "Strong candidate for AI transformation";
  if (score >= 3.5) return "Good candidate for AI transformation";
  if (score >= 3.0) return "Moderate candidate for AI transformation";
  if (score >= 2.5) return "Consider for future AI transformation";
  if (score >= 2.0) return "Limited potential for AI transformation";
  return "Not recommended for AI transformation at this time";
};

export const getScoreGuidance = (criterion: keyof typeof scoringCriteria.valuePotential | keyof typeof scoringCriteria.easeOfImplementation): string => {
  const guidance = {
    timeSavings: "Rate 0-5 based on potential time savings: 5 = >40% time savings, 4 = 30-40%, 3 = 20-30%, 2 = 10-20%, 1 = <10%, 0 = negligible",
    qualityImpact: "Rate 0-5 based on quality improvement potential: 5 = transformative, 4 = significant, 3 = moderate, 2 = minor, 1 = minimal, 0 = none",
    strategicAlignment: "Rate 0-5 based on alignment with strategic goals: 5 = perfect alignment, 4 = strong, 3 = moderate, 2 = weak, 1 = minimal, 0 = none",
    dataReadiness: "Rate 0-5 based on data availability and quality: 5 = perfect, 4 = good, 3 = adequate, 2 = poor, 1 = very poor, 0 = no data",
    technicalFeasibility: "Rate 0-5 based on technical complexity: 5 = very easy, 4 = straightforward, 3 = moderate, 2 = complex, 1 = very complex, 0 = infeasible",
    adoptionRisk: "Rate 0-5 based on likelihood of successful adoption: 5 = very high, 4 = high, 3 = moderate, 2 = low, 1 = very low, 0 = unlikely",
  };
  
  return guidance[criterion] || "Rate from 0 (lowest) to 5 (highest)";
};

/**
 * Calculates the weighted total score for an assessment
 * @param scores Object containing individual criterion scores
 * @returns Weighted total score between 1 and 5
 */
export function calculateTotalScore(scores: Pick<AssessmentScoreData, keyof typeof SCORE_WEIGHTS>): number {
  const weightedSum = Object.entries(SCORE_WEIGHTS).reduce((sum, [criterion, weight]) => {
    const score = scores[criterion as keyof typeof SCORE_WEIGHTS] as ScoreValue;
    return sum + (score * weight);
  }, 0);

  // Round to 2 decimal places
  return Math.round(weightedSum * 100) / 100;
}

/**
 * Validates if a score value is within the allowed range
 * @param score The score to validate
 * @returns True if the score is valid
 */
export function isValidScore(score: number): score is ScoreValue {
  return Number.isInteger(score) && score >= 1 && score <= 5;
}

/**
 * Validates all scores in an assessment
 * @param scores Object containing individual criterion scores
 * @returns True if all scores are valid
 */
export function validateScores(scores: Partial<Pick<AssessmentScoreData, keyof typeof SCORE_WEIGHTS>>): boolean {
  return Object.keys(SCORE_WEIGHTS).every(criterion => {
    const score = scores[criterion as keyof typeof SCORE_WEIGHTS];
    return score !== undefined && isValidScore(score);
  });
}

// Define the possible qualitative ratings
export const QUALITATIVE_RATINGS = ['Excellent', 'Good', 'Fair', 'Poor', 'Very Poor'] as const;
export type QualitativeRating = typeof QUALITATIVE_RATINGS[number];

/**
 * Gets a qualitative rating based on the total score
 * @param totalScore The total weighted score
 * @returns A string representing the qualitative rating
 */
export function getQualitativeRating(totalScore: number): string {
  if (totalScore >= 4.5) return 'Excellent';
  if (totalScore >= 3.5) return 'Good';
  if (totalScore >= 2.5) return 'Fair';
  if (totalScore >= 1.5) return 'Poor';
  return 'Very Poor';
} 