import { useState } from 'react';
import { AssessmentScore, ScoreValue } from '../shared/schema';
import { getScoreDescription, getScoreGuidance } from '../shared/scoring';

interface UseAssessmentScoringProps {
  wizardStepId: string;
  
}

interface AssessmentScoreInput {
  timeSavings: ScoreValue;
  qualityImpact: ScoreValue;
  strategicAlignment: ScoreValue;
  dataReadiness: ScoreValue;
  technicalFeasibility: ScoreValue;
  adoptionRisk: ScoreValue;
}

export function useAssessmentScoring({ wizardStepId }: UseAssessmentScoringProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessmentScore, setAssessmentScore] = useState<AssessmentScore | null>(null);

  const calculateScore = async (input: AssessmentScoreInput) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/assessment/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wizardStepId,
          ...input,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to calculate assessment score');
      }

      const data = await response.json();
      setAssessmentScore(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchScore = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/assessment/score?wizardStepId=${wizardStepId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setAssessmentScore(null);
          return null;
        }
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch assessment score');
      }

      const data = await response.json();
      setAssessmentScore(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getDescription = () => {
    if (!assessmentScore) return '';
    return getScoreDescription(parseFloat(assessmentScore.totalScore));
  };

  const getGuidance = (criteriaType: keyof AssessmentScoreInput) => {
    return getScoreGuidance(criteriaType);
  };

  return {
    calculateScore,
    fetchScore,
    getDescription,
    getGuidance,
    assessmentScore,
    isLoading,
    error,
  };
} 