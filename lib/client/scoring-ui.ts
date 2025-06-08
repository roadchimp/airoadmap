import { type QualitativeRating } from '../../shared/scoring';

export const RATING_COLORS: Record<QualitativeRating, string> = {
  Excellent: 'text-green-600 dark:text-green-400',
  Good: 'text-blue-600 dark:text-blue-400',
  Fair: 'text-yellow-600 dark:text-yellow-400',
  Poor: 'text-red-600 dark:text-red-400',
  ['Very Poor']: 'text-fuchsia-600 dark:text-fuchsia-400',
} as const;

export const RATING_LABELS: Record<QualitativeRating, string> = {
  Excellent: 'Excellent',
  Good: 'Good',
  Fair: 'Average',
  Poor: 'Poor',
  ['Very Poor']: 'Very Poor',
} as const;

export const RATING_DESCRIPTIONS: Record<QualitativeRating, string> = {
  Excellent: 'Exceptional performance across all criteria',
  Good: 'Strong performance with minor areas for improvement',
  Fair: 'Meets basic requirements with room for enhancement',
  Poor: 'Several areas need significant improvement',
  ['Very Poor']: 'Major improvements required across most areas',
} as const;

export function getRatingStyle(rating: QualitativeRating) {
  return {
    color: RATING_COLORS[rating],
    label: RATING_LABELS[rating],
    description: RATING_DESCRIPTIONS[rating],
  };
} 