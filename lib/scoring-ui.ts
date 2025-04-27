import { type QualitativeRating } from '@/shared/scoring';

export const RATING_COLORS = {
  excellent: 'text-green-600 dark:text-green-400',
  good: 'text-blue-600 dark:text-blue-400',
  average: 'text-yellow-600 dark:text-yellow-400',
  belowAverage: 'text-orange-600 dark:text-orange-400',
  poor: 'text-red-600 dark:text-red-400',
} as const;

export const RATING_LABELS: Record<QualitativeRating, string> = {
  excellent: 'Excellent',
  good: 'Good',
  average: 'Average',
  belowAverage: 'Below Average',
  poor: 'Poor',
} as const;

export const RATING_DESCRIPTIONS: Record<QualitativeRating, string> = {
  excellent: 'Exceptional performance across all criteria',
  good: 'Strong performance with minor areas for improvement',
  average: 'Meets basic requirements with room for enhancement',
  belowAverage: 'Several areas need significant improvement',
  poor: 'Major improvements required across most areas',
} as const;

export function getRatingStyle(rating: QualitativeRating) {
  return {
    color: RATING_COLORS[rating],
    label: RATING_LABELS[rating],
    description: RATING_DESCRIPTIONS[rating],
  };
} 