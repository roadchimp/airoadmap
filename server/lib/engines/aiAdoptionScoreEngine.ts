// This file will contain the logic for calculating the AI Adoption Score.
// It will include functions to process inputs, apply weights, and derive the overall score and ROI.

import type {
  AiAdoptionScoreInputComponents,
  OrganizationScoreWeights,
} from '../../../shared/schema';
import { storage } from "../../storage";

// Define the types that were previously imported but not exported in schema.ts
export interface CalculatedScoreComponent {
  input?: number;
  normalizedScore: number;
  weightedScore: number;
  details?: string;
}

export interface CalculatedAiAdoptionScore {
  overallScore: number;
  components: {
    adoptionRate: CalculatedScoreComponent;
    timeSavings: CalculatedScoreComponent;
    costEfficiency: CalculatedScoreComponent;
    performanceImprovement: CalculatedScoreComponent;
    toolSprawlReduction: CalculatedScoreComponent;
  };
  roiDetails: {
    calculatedRoiPercentage?: number;
    investmentAmount?: number;
    netBenefitAmount?: number;
    paybackPeriodMonths?: number;
    assumptions?: string;
  };
  summary?: string;
}

/**
 * AI Adoption Score Calculator
 * 
 * Implements the formula: AIAdoption Score = (α * U + β * I + γ * E + δ * S - ε * B) / IB
 * 
 * Where:
 * U = Usage Extent - Average score from questions on the degree of AI deployment across functions
 * I = Impact Realization - Weighted average of scores reflecting tangible benefits
 * E = Employee Interaction - Average score for user engagement with AI systems
 * S = Strategic Integration - Average score from responses on alignment with organizational strategy
 * B = Barriers and Limitations - Score inversely weighted based on severity of adoption barriers
 * IB = Industry Benchmarking Factor - Normalize against industry averages
 * 
 * α, β, γ, δ, ε = Configurable weights based on assessment focus
 */

// Default weights if none are specified
const DEFAULT_WEIGHTS = {
  adoptionRateWeight: 0.2, // α
  timeSavedWeight: 0.3, // β
  costEfficiencyWeight: 0.2, // γ
  performanceImprovementWeight: 0.3, // δ
  toolSprawlReductionWeight: 0.1, // ε
};

// Industry-specific default values for inputs
interface IndustryDefaults {
  adoptionRate: number;
  timeSaved: number;
  affectedUsers: number;
  costEfficiency: number;
  performanceGain: number;
  toolSprawlReduction: number;
  weights: {
    adoptionRateWeight: number;
    timeSavedWeight: number;
    costEfficiencyWeight: number;
    performanceImprovementWeight: number;
    toolSprawlReductionWeight: number;
  };
}

const INDUSTRY_DEFAULTS: Record<string, IndustryDefaults> = {
  "Software & Technology": {
    adoptionRate: 50, // 50%
    timeSaved: 7, // 7 hours/week
    affectedUsers: 100,
    costEfficiency: 15, // 15%
    performanceGain: 30, // 30%
    toolSprawlReduction: 4, // 4/5
    weights: {
      adoptionRateWeight: 0.25,
      timeSavedWeight: 0.20,
      costEfficiencyWeight: 0.15, 
      performanceImprovementWeight: 0.25,
      toolSprawlReductionWeight: 0.05,
    }
  },
  "Finance & Banking": {
    adoptionRate: 40,
    timeSaved: 4,
    affectedUsers: 100,
    costEfficiency: 10,
    performanceGain: 15,
    toolSprawlReduction: 3,
    weights: {
      adoptionRateWeight: 0.15,
      timeSavedWeight: 0.15,
      costEfficiencyWeight: 0.30,
      performanceImprovementWeight: 0.25,
      toolSprawlReductionWeight: 0.15,
    }
  },
  "Healthcare": {
    adoptionRate: 30,
    timeSaved: 3,
    affectedUsers: 30,
    costEfficiency: 10,
    performanceGain: 15,
    toolSprawlReduction: 2,
    weights: {
      adoptionRateWeight: 0.20,
      timeSavedWeight: 0.15,
      costEfficiencyWeight: 0.20,
      performanceImprovementWeight: 0.30,
      toolSprawlReductionWeight: 0.15,
    }
  },
  "Retail & E-commerce": {
    adoptionRate: 20,
    timeSaved: 3,
    affectedUsers: 150,
    costEfficiency: 8,
    performanceGain: 20,
    toolSprawlReduction: 3,
    weights: {
      adoptionRateWeight: 0.15,
      timeSavedWeight: 0.15,
      costEfficiencyWeight: 0.25,
      performanceImprovementWeight: 0.25,
      toolSprawlReductionWeight: 0.20,
    }
  },
  "Manufacturing": {
    adoptionRate: 30,
    timeSaved: 4,
    affectedUsers: 300,
    costEfficiency: 15,
    performanceGain: 15,
    toolSprawlReduction: 3,
    weights: {
      adoptionRateWeight: 0.15,
      timeSavedWeight: 0.15,
      costEfficiencyWeight: 0.30,
      performanceImprovementWeight: 0.25,
      toolSprawlReductionWeight: 0.15,
    }
  },
  "Education": {
    adoptionRate: 10,
    timeSaved: 2,
    affectedUsers: 20,
    costEfficiency: 8,
    performanceGain: 8,
    toolSprawlReduction: 2,
    weights: {
      adoptionRateWeight: 0.20,
      timeSavedWeight: 0.30,
      costEfficiencyWeight: 0.15,
      performanceImprovementWeight: 0.20,
      toolSprawlReductionWeight: 0.15,
    }
  },
  "Professional Services": {
    adoptionRate: 30,
    timeSaved: 5,
    affectedUsers: 100,
    costEfficiency: 8,
    performanceGain: 25,
    toolSprawlReduction: 3,
    weights: {
      adoptionRateWeight: 0.15,
      timeSavedWeight: 0.30,
      costEfficiencyWeight: 0.20,
      performanceImprovementWeight: 0.25,
      toolSprawlReductionWeight: 0.10,
    }
  },
  "Media & Entertainment": {
    adoptionRate: 40,
    timeSaved: 4,
    affectedUsers: 50,
    costEfficiency: 10,
    performanceGain: 20,
    toolSprawlReduction: 4,
    weights: {
      adoptionRateWeight: 0.20,
      timeSavedWeight: 0.20,
      costEfficiencyWeight: 0.10,
      performanceImprovementWeight: 0.30,
      toolSprawlReductionWeight: 0.20,
    }
  },
  // Default case for "Other" industry
  "Other": {
    adoptionRate: 30,
    timeSaved: 4,
    affectedUsers: 100,
    costEfficiency: 10,
    performanceGain: 15,
    toolSprawlReduction: 3,
    weights: DEFAULT_WEIGHTS
  }
};

// Company Stage weight profiles
const COMPANY_STAGE_WEIGHTS = {
  "Startup": {
    adoptionRateWeight: 0.20,
    timeSavedWeight: 0.30,
    costEfficiencyWeight: 0.10,
    performanceImprovementWeight: 0.20,
    toolSprawlReductionWeight: 0.10,
  },
  "Early Growth": {
    adoptionRateWeight: 0.20,
    timeSavedWeight: 0.25,
    costEfficiencyWeight: 0.10,
    performanceImprovementWeight: 0.20,
    toolSprawlReductionWeight: 0.10,
  },
  "Scaling": {
    adoptionRateWeight: 0.15,
    timeSavedWeight: 0.20,
    costEfficiencyWeight: 0.20,
    performanceImprovementWeight: 0.15,
    toolSprawlReductionWeight: 0.10,
  },
  "Mature": {
    adoptionRateWeight: 0.10,
    timeSavedWeight: 0.15,
    costEfficiencyWeight: 0.30,
    performanceImprovementWeight: 0.10,
    toolSprawlReductionWeight: 0.15,
  }
};

// Industry maturity adjustment factors
const INDUSTRY_MATURITY_ADJUSTMENT = {
  "Mature": 1.0, // No adjustment
  "Immature": 1.2, // 20% higher score for immature industries where AI might have more impact
};

/**
 * Calculate the AI Adoption Score based on assessment inputs and organization weights
 */
export async function calculateAiAdoptionScore(
  inputs: AiAdoptionScoreInputComponents,
  industry: string,
  companyStage: string,
  industryMaturity: string,
  organizationId?: number
): Promise<CalculatedAiAdoptionScore> {
  // 1. Get organization-specific weights if available, otherwise use defaults based on industry and company stage
  let weights = DEFAULT_WEIGHTS;
  
  if (organizationId) {
    try {
      const orgWeights = await storage.getOrganizationScoreWeights(organizationId);
      if (orgWeights) {
        weights = {
          adoptionRateWeight: Number(orgWeights.adoptionRateWeight),
          timeSavedWeight: Number(orgWeights.timeSavedWeight),
          costEfficiencyWeight: Number(orgWeights.costEfficiencyWeight),
          performanceImprovementWeight: Number(orgWeights.performanceImprovementWeight),
          toolSprawlReductionWeight: Number(orgWeights.toolSprawlReductionWeight),
        };
      }
    } catch (error) {
      console.error("Error fetching organization weights:", error);
      // Fallback to profile-based weights
    }
  }
  
  // If no org-specific weights, blend industry and company stage weights
  if (!organizationId) {
    const industryDefaults = INDUSTRY_DEFAULTS[industry] || INDUSTRY_DEFAULTS["Other"];
    const stageWeights = COMPANY_STAGE_WEIGHTS[companyStage as keyof typeof COMPANY_STAGE_WEIGHTS] || COMPANY_STAGE_WEIGHTS["Mature"];
    
    // Blend weights: 60% industry, 40% company stage
    weights = {
      adoptionRateWeight: industryDefaults.weights.adoptionRateWeight * 0.6 + stageWeights.adoptionRateWeight * 0.4,
      timeSavedWeight: industryDefaults.weights.timeSavedWeight * 0.6 + stageWeights.timeSavedWeight * 0.4,
      costEfficiencyWeight: industryDefaults.weights.costEfficiencyWeight * 0.6 + stageWeights.costEfficiencyWeight * 0.4,
      performanceImprovementWeight: industryDefaults.weights.performanceImprovementWeight * 0.6 + stageWeights.performanceImprovementWeight * 0.4,
      toolSprawlReductionWeight: industryDefaults.weights.toolSprawlReductionWeight * 0.6 + stageWeights.toolSprawlReductionWeight * 0.4,
    };
  }
  
  // 2. Calculate individual components with industry defaults for missing inputs
  const industryDefaults = INDUSTRY_DEFAULTS[industry] || INDUSTRY_DEFAULTS["Other"];
  
  // Calculate Usage Extent (U) - Adoption Rate
  const adoptionComponent = calculateScoreComponent(
    inputs.adoptionRateForecast ?? industryDefaults.adoptionRate,
    weights.adoptionRateWeight,
    0, 100, // Min/max range
    "Adoption rate represents the percentage of target users expected to actively use AI tools"
  );
  
  // Calculate Impact Realization (I) - Time Savings
  const timeSavingsComponent = calculateScoreComponent(
    inputs.timeSavingsPerUserHours ?? industryDefaults.timeSaved,
    weights.timeSavedWeight,
    0, 10, // Min/max range
    "Time savings represents hours saved per user per week through AI automation"
  );
  
  // Calculate Employee Interaction (E) - Cost Efficiency
  const costEfficiencyComponent = calculateScoreComponent(
    inputs.costEfficiencyGainsAmount ?? industryDefaults.costEfficiency,
    weights.costEfficiencyWeight,
    0, 30, // Min/max range
    "Cost efficiency represents direct percentage cost reduction from AI implementation"
  );
  
  // Calculate Strategic Integration (S) - Performance Improvement
  const performanceComponent = calculateScoreComponent(
    inputs.performanceImprovementPercentage ?? industryDefaults.performanceGain,
    weights.performanceImprovementWeight,
    0, 50, // Min/max range
    "Performance improvement represents percentage gains in key performance metrics"
  );
  
  // Calculate Barriers and Limitations (B) - Tool Sprawl Reduction (inverted)
  // Note: this is a benefit, so we don't subtract it in the final formula
  const toolSprawlComponent = calculateScoreComponent(
    inputs.toolSprawlReductionScore ?? industryDefaults.toolSprawlReduction,
    weights.toolSprawlReductionWeight,
    1, 5, // Min/max range
    "Tool sprawl reduction represents the consolidation benefit from implementing AI platforms"
  );
  
  // 3. Calculate industry benchmarking factor
  const industryMaturityFactor = INDUSTRY_MATURITY_ADJUSTMENT[industryMaturity as keyof typeof INDUSTRY_MATURITY_ADJUSTMENT] || 1.0;
  
  // 4. Calculate final score using the formula
  // AIAdoption Score = (α * U + β * I + γ * E + δ * S - ε * B) / IB
  const numerator = 
    adoptionComponent.weightedScore + 
    timeSavingsComponent.weightedScore + 
    costEfficiencyComponent.weightedScore + 
    performanceComponent.weightedScore + 
    toolSprawlComponent.weightedScore;
  
  const denominatorIB = 1; // In this implementation, we use an adjustment factor on the result instead
  
  // Scale to a 0-100 range and apply maturity adjustment
  const rawScore = numerator / denominatorIB;
  // Fix scaling: weights sum to ~1.0, so rawScore is already 0-1. Just multiply by 100 for percentage
  const scaledScore = Math.min(100, Math.max(0, rawScore * 100));
  const finalScore = scaledScore * industryMaturityFactor;
  
  // 5. Calculate ROI details (if inputs support it)
  let roiPercentage: number | undefined;
  let paybackPeriodMonths: number | undefined;
  let investmentAmount: number | undefined;
  let netBenefitAmount: number | undefined;
  
  if (inputs.costEfficiencyGainsAmount && inputs.affectedUserCount && inputs.timeSavingsPerUserHours) {
    // Estimate annual value from time savings (assuming $50/hour average fully loaded cost)
    const annualTimeSavingsValue = inputs.timeSavingsPerUserHours * inputs.affectedUserCount * 50 * 48; // 48 work weeks/year
    
    // Estimate cost efficiency gains ($)
    const costSavings = inputs.costEfficiencyGainsAmount;
    
    // Estimate implementation cost (simplistic)
    investmentAmount = inputs.affectedUserCount * 2000; // Assume $2000 per affected user
    
    // Calculate net benefit
    netBenefitAmount = annualTimeSavingsValue + costSavings - investmentAmount;
    
    // Calculate ROI percentage
    roiPercentage = (netBenefitAmount / investmentAmount) * 100;
    
    // Calculate payback period in months
    paybackPeriodMonths = (investmentAmount / (annualTimeSavingsValue + costSavings)) * 12;
  }
  
  // 6. Return the calculated score with components
  return {
    overallScore: Math.round(finalScore * 10) / 10, // Round to 1 decimal place
    components: {
      adoptionRate: adoptionComponent,
      timeSavings: timeSavingsComponent,
      costEfficiency: costEfficiencyComponent,
      performanceImprovement: performanceComponent,
      toolSprawlReduction: toolSprawlComponent,
    },
    roiDetails: {
      calculatedRoiPercentage: roiPercentage,
      investmentAmount: investmentAmount,
      netBenefitAmount: netBenefitAmount,
      paybackPeriodMonths: paybackPeriodMonths,
      assumptions: `Calculations assume $50/hour fully loaded labor cost, 48 work weeks per year, and implementation cost of $2000 per affected user. Industry: ${industry}, Company Stage: ${companyStage}, Industry Maturity: ${industryMaturity}.`
    },
    summary: generateScoreSummary(finalScore, industry, companyStage)
  };
}

/**
 * Calculate a score component with normalization
 */
function calculateScoreComponent(
  inputValue: number,
  weight: number,
  minValue: number,
  maxValue: number,
  details?: string
): CalculatedScoreComponent {
  // Normalize to 0-1 scale
  const normalizedValue = Math.min(1, Math.max(0, (inputValue - minValue) / (maxValue - minValue)));
  
  // Apply weight
  const weightedScore = normalizedValue * weight;
  
  return {
    input: inputValue,
    normalizedScore: normalizedValue,
    weightedScore: weightedScore,
    details: details
  };
}

/**
 * Generate a summary description of the AI Adoption Score
 */
function generateScoreSummary(score: number, industry: string, companyStage: string): string {
  if (score >= 80) {
    return `Your organization shows excellent AI adoption potential (${score.toFixed(1)}/100). For a ${companyStage.toLowerCase()} company in the ${industry.toLowerCase()} industry, this indicates strong readiness for advanced AI initiatives with potential for significant competitive advantage.`;
  } else if (score >= 60) {
    return `Your organization shows good AI adoption potential (${score.toFixed(1)}/100). For a ${companyStage.toLowerCase()} company in the ${industry.toLowerCase()} industry, this suggests readiness for targeted AI initiatives with proper planning and change management.`;
  } else if (score >= 40) {
    return `Your organization shows moderate AI adoption potential (${score.toFixed(1)}/100). For a ${companyStage.toLowerCase()} company in the ${industry.toLowerCase()} industry, this suggests focusing on foundational AI capabilities first, with gradual expansion.`;
  } else {
    return `Your organization shows cautious AI adoption potential (${score.toFixed(1)}/100). For a ${companyStage.toLowerCase()} company in the ${industry.toLowerCase()} industry, this suggests starting with small pilot programs and addressing organizational readiness factors.`;
  }
}

// Helper function to get organization score weights with default fallback
export async function getOrganizationScoreWeights(organizationId: number, industry: string, companyStage: string) {
  try {
    const orgWeights = await storage.getOrganizationScoreWeights(organizationId);
    if (orgWeights) {
      return {
        adoptionRateWeight: Number(orgWeights.adoptionRateWeight),
        timeSavedWeight: Number(orgWeights.timeSavedWeight),
        costEfficiencyWeight: Number(orgWeights.costEfficiencyWeight),
        performanceImprovementWeight: Number(orgWeights.performanceImprovementWeight),
        toolSprawlReductionWeight: Number(orgWeights.toolSprawlReductionWeight),
      };
    }
    
    // If no organization weights exist, create default ones
    const industryDefaults = INDUSTRY_DEFAULTS[industry] || INDUSTRY_DEFAULTS["Other"];
    const stageWeights = COMPANY_STAGE_WEIGHTS[companyStage as keyof typeof COMPANY_STAGE_WEIGHTS] || COMPANY_STAGE_WEIGHTS["Mature"];
    
    // Blend weights: 60% industry, 40% company stage
    const defaultWeights = {
      organizationId,
      adoptionRateWeight: industryDefaults.weights.adoptionRateWeight * 0.6 + stageWeights.adoptionRateWeight * 0.4,
      timeSavedWeight: industryDefaults.weights.timeSavedWeight * 0.6 + stageWeights.timeSavedWeight * 0.4,
      costEfficiencyWeight: industryDefaults.weights.costEfficiencyWeight * 0.6 + stageWeights.costEfficiencyWeight * 0.4,
      performanceImprovementWeight: industryDefaults.weights.performanceImprovementWeight * 0.6 + stageWeights.performanceImprovementWeight * 0.4,
      toolSprawlReductionWeight: industryDefaults.weights.toolSprawlReductionWeight * 0.6 + stageWeights.toolSprawlReductionWeight * 0.4,
    };
    
    // Store defaults in database
    await storage.upsertOrganizationScoreWeights(defaultWeights);
    
    return defaultWeights;
  } catch (error) {
    console.error("Error getting organization score weights:", error);
    return DEFAULT_WEIGHTS;
  }
}

export {}; // Placeholder to make it a module 