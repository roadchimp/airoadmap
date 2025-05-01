import { useState, useCallback } from 'react';
import { AssessmentScoreData, ScoreValue } from '../shared/schema';
import { SCORE_WEIGHTS, calculateTotalScore, validateScores } from '../shared/scoring';

type ScoringState = Pick<AssessmentScoreData, keyof typeof SCORE_WEIGHTS>;

interface UseAssessmentScoringProps {
  initialScores?: Partial<ScoringState>;
  onScoreChange?: (scores: ScoringState, totalScore: number) => void;
}

interface UseAssessmentScoringReturn {
  scores: Partial<ScoringState>;
  totalScore: number | null;
  setScore: (criterion: keyof typeof SCORE_WEIGHTS, value: ScoreValue) => void;
  isComplete: boolean;
  resetScores: () => void;
}

export function useAssessmentScoring({
  initialScores = {},
  onScoreChange,
}: UseAssessmentScoringProps = {}): UseAssessmentScoringReturn {
  const [scores, setScores] = useState<Partial<ScoringState>>(initialScores);

  const setScore = useCallback((criterion: keyof typeof SCORE_WEIGHTS, value: ScoreValue) => {
    setScores(prev => {
      const newScores = { ...prev, [criterion]: value };
      
      if (validateScores(newScores)) {
        const totalScore = calculateTotalScore(newScores as ScoringState);
        onScoreChange?.(newScores as ScoringState, totalScore);
      }
      
      return newScores;
    });
  }, [onScoreChange]);

  const resetScores = useCallback(() => {
    setScores({});
  }, []);

  const isComplete = validateScores(scores);
  const totalScore = isComplete ? calculateTotalScore(scores as ScoringState) : null;

  return {
    scores,
    totalScore,
    setScore,
    isComplete,
    resetScores,
  };
} 