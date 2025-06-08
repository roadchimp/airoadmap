'use client';

import { useAssessmentScoring } from '@/hooks/useAssessmentScoring';
import { SCORE_WEIGHTS, validateScores } from '../../shared/scoring';
import { cn } from '@/lib/session/utils';
import { getRatingStyle } from '@/lib/client/scoring-ui';
import { ScoreValue } from '../../shared/schema';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';

interface ScoringFormProps {
  onScoresComplete?: (totalScore: number) => void;
  className?: string;
}

export function ScoringForm({ onScoresComplete, className }: ScoringFormProps) {
  const { scores, setScore, totalScore } = useAssessmentScoring({
    onScoreChange: (currentScores, currentTotalScore) => {
      if (validateScores(currentScores)) {
        onScoresComplete?.(currentTotalScore);
      }
    },
  });

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Assessment Scoring
          {totalScore !== null && (
            <Badge variant="outline" className="text-lg">
              Total Score: {totalScore.toFixed(1)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(SCORE_WEIGHTS).map(([criterion, weight]) => {
          const typedCriterion = criterion as keyof typeof SCORE_WEIGHTS;
          const currentScore = scores[typedCriterion];

          return (
            <div key={criterion} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  {criterion.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <Badge variant="secondary">Weight: {weight}</Badge>
              </div>
              <RadioGroup
                value={currentScore?.toString() || ''}
                onValueChange={(value) => setScore(typedCriterion, parseInt(value) as ScoreValue)}
                className="flex flex-wrap gap-4"
              >
                {[1, 2, 3, 4, 5].map((scoreValue) => {
                  const key = scoreValue.toString();
                  return (
                    <div
                      key={key}
                      className="flex items-center space-x-2 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <RadioGroupItem value={key} id={`${criterion}-${key}`} />
                      <Label
                        htmlFor={`${criterion}-${key}`}
                        className={cn(
                          'cursor-pointer font-medium'
                        )}
                      >
                        {key}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
} 