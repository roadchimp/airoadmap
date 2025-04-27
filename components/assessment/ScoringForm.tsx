'use client';

import { useAssessmentScoring } from '@/hooks/useAssessmentScoring';
import { SCORE_WEIGHTS } from '@/shared/scoring';
import { cn } from '@/lib/utils';
import { getRatingStyle } from '@/lib/scoring-ui';

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
    onComplete: onScoresComplete,
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
          const currentScore = scores[criterion];
          const rating = currentScore ? getRatingStyle(currentScore) : null;

          return (
            <div key={criterion} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  {criterion.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <Badge variant="secondary">Weight: {weight}</Badge>
              </div>
              <RadioGroup
                value={currentScore || ''}
                onValueChange={(value) => setScore(criterion, value)}
                className="flex flex-wrap gap-4"
              >
                {Object.entries(getRatingStyle('excellent')).map(([key]) => {
                  const style = getRatingStyle(key as any);
                  return (
                    <div
                      key={key}
                      className="flex items-center space-x-2 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <RadioGroupItem value={key} id={`${criterion}-${key}`} />
                      <Label
                        htmlFor={`${criterion}-${key}`}
                        className={cn(
                          'cursor-pointer font-medium',
                          style.color
                        )}
                      >
                        {style.label}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
              {rating && (
                <p className={cn('text-sm italic', rating.color)}>
                  {rating.description}
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
} 