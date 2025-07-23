import { WizardStepData, JobRole, PrioritizedItem, HeatmapData, EffortLevel, ValueLevel, AISuggestion, PerformanceImpact } from "@shared/schema";

/**
 * Client-side helper functions for prioritization calculations
 * Note: The actual prioritization is done on the server, but these
 * functions can help with client-side calculations and visualizations
 */

/**
 * Calculate color for heatmap cells based on priority level
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'bg-red-100';
    case 'medium':
      return 'bg-orange-100';
    case 'low':
      return 'bg-yellow-100';
    case 'not_recommended':
      return 'bg-green-100';
    default:
      return 'bg-neutral-100';
  }
}

/**
 * Get text label for priority level
 */
export function getPriorityLabel(priority: string): string {
  switch (priority) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
    case 'not_recommended':
      return 'Not Recommended';
    default:
      return 'Unknown';
  }
}

/**
 * Get text color for priority badges
 */
export function getPriorityTextColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'text-red-800';
    case 'medium':
      return 'text-orange-800';
    case 'low':
      return 'text-yellow-800';
    case 'not_recommended':
      return 'text-green-800';
    default:
      return 'text-neutral-800';
  }
}

/**
 * Format ROI value as a dollar amount
 */
export function formatROI(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Calculate estimated score based on role data
 * This is a simple client-side calculation for preview purposes
 */
export function calculateEstimatedScore(
  painPoint: { severity?: number; frequency?: number; impact?: number },
  dataQuality: number
): { valueScore: number; effortScore: number } {
  // Default values if not provided
  const severity = painPoint.severity || 3;
  const frequency = painPoint.frequency || 3;
  const impact = painPoint.impact || 3;
  const dataQualityScore = dataQuality || 3;
  
  // Value score increases with severity, frequency and impact
  const valueScore = ((severity + frequency + impact) / 3) * 1.67; // Scale to roughly 1-5
  
  // Effort score decreases with better data quality
  const effortScore = 6 - dataQualityScore;
  
  return {
    valueScore: Math.min(5, Math.max(1, Math.round(valueScore * 10) / 10)),
    effortScore: Math.min(5, Math.max(1, Math.round(effortScore * 10) / 10))
  };
}

/**
 * Determine priority level based on value and effort scores
 */
export function determinePriority(valueLevel: ValueLevel, effortLevel: EffortLevel): string {
  // High value, low effort = high priority
  if (valueLevel === 'high' && effortLevel === 'low') return 'high';
  if (valueLevel === 'high' && effortLevel === 'medium') return 'high';
  if (valueLevel === 'medium' && effortLevel === 'low') return 'high';
  
  // Medium priority combinations
  if (valueLevel === 'high' && effortLevel === 'high') return 'medium';
  if (valueLevel === 'medium' && effortLevel === 'medium') return 'medium';
  
  // Low priority combinations
  if (valueLevel === 'medium' && effortLevel === 'high') return 'low';
  if (valueLevel === 'low' && effortLevel === 'low') return 'low';
  if (valueLevel === 'low' && effortLevel === 'medium') return 'low';
  
  // Not recommended
  if (valueLevel === 'low' && effortLevel === 'high') return 'not_recommended';
  
  // Default case
  return 'medium';
}

/**
 * Determine effort level based on score
 */
export function getEffortLevel(score: number): EffortLevel {
  if (score <= 2.5) return 'low';
  if (score <= 3.8) return 'medium';
  return 'high';
}

/**
 * Determine value level based on score
 */
export function getValueLevel(score: number): ValueLevel {
  if (score >= 4.0) return 'high';
  if (score >= 3.0) return 'medium';
  return 'low';
}

/**
 * Generate preliminary assessment preview
 * This is used to show an estimate before the final server calculation
 */
export function generatePreviewAssessment(stepData: Partial<WizardStepData>, roles: JobRole[]): {
  prioritizedItems: PrioritizedItem[];
} {
  const prioritizedItems: PrioritizedItem[] = [];
  
  // Get selected role IDs (now stored as numbers, not objects)
  const selectedRoleIds = stepData.roles?.selectedRoles || [];
  
  // Get pain points data
  const painPoints = stepData.painPoints?.roleSpecificPainPoints || {};
  
  // Get data quality rating
  const dataQuality = stepData.techStack?.dataQuality || 3;
  
  // Process each selected role ID
  selectedRoleIds.forEach(roleId => {
    // Check if we have a valid role ID
    if (typeof roleId !== 'number') return;
    
    // Find the full JobRole using the ID
    const role = roles.find(r => r.id === roleId);
    if (!role) return;
    
    // Use the role id (number) to access pain points
    const painPoint = painPoints[role.id] || {};
    
    // Ensure dataQuality is treated as a number
    const numericDataQuality = typeof dataQuality === 'string' ? parseFloat(dataQuality) : dataQuality;
    
    const { valueScore, effortScore } = calculateEstimatedScore(painPoint, numericDataQuality);
    
    const valueLevel = getValueLevel(valueScore);
    const effortLevel = getEffortLevel(effortScore);
    const priority = determinePriority(valueLevel, effortLevel);
    
    prioritizedItems.push({
      id: role.id.toString(),
      name: role.title,
      department: `Department ${role.departmentId}`, 
      valueScore,
      effortScore,
      priority: priority as any,
      valueLevel,
      effortLevel,
      aiAdoptionScore: 0
    });
  });
  
  // Sort by value score descending, then effort score ascending
  prioritizedItems.sort((a, b) => {
    if (a.valueScore !== b.valueScore) {
      return b.valueScore - a.valueScore; // Higher value first
    }
    return a.effortScore - b.effortScore; // Lower effort first
  });
  
  return { prioritizedItems };
}
