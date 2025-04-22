import { WizardStepData, HeatmapData, PrioritizedItem, EffortLevel, ValueLevel, AISuggestion, PerformanceImpact, JobRole, Department } from "@shared/schema";
import { generateEnhancedExecutiveSummary, generateAICapabilityRecommendations, generatePerformanceImpact } from "./aiService";

/**
 * Calculates the prioritization results based on wizard step data
 */
export async function calculatePrioritization(stepData: WizardStepData) {
  // Prioritized items list
  const prioritizedItems: PrioritizedItem[] = [];
  
  // Empty heatmap structure
  const heatmapData: HeatmapData = {
    matrix: {
      high: {
        low: { priority: "high", items: [] },
        medium: { priority: "high", items: [] },
        high: { priority: "medium", items: [] }
      },
      medium: {
        low: { priority: "high", items: [] },
        medium: { priority: "medium", items: [] },
        high: { priority: "low", items: [] }
      },
      low: {
        low: { priority: "low", items: [] },
        medium: { priority: "low", items: [] },
        high: { priority: "not_recommended", items: [] }
      }
    }
  };
  
  // Get roles data
  const selectedRoleIds = stepData.roles?.selectedRoles || [];
  const roleRankings = stepData.roles?.prioritizedRoles || selectedRoleIds;
  const painPoints = stepData.painPoints?.roleSpecificPainPoints || {};
  
  // Calculate data quality score based on available data sources
  // Default to medium (3) if not specified
  let dataQuality = 3;
  if (stepData.techStack?.dataAvailability) {
    const dataAvailability = stepData.techStack.dataAvailability;
    let availableSources = 0;
    
    // Convert array to object for type safety
    const dataTypes = dataAvailability.reduce((acc, type) => {
      acc[type] = true;
      return acc;
    }, {} as Record<string, boolean>);

    if (dataTypes['structuredData']) availableSources++;
    if (dataTypes['unstructuredText']) availableSources++;
    if (dataTypes['historicalRecords']) availableSources++;
    if (dataTypes['realTimeInputs']) availableSources++;
    if (dataTypes['apiAccess']) availableSources++;
    
    dataQuality = Math.max(1, Math.min(5, availableSources + 1));
  }
  
  // Process each selected role in priority order
  for (let i = 0; i < roleRankings.length; i++) {
    const roleRanking = roleRankings[i];
    const roleId = typeof roleRanking === 'number' ? roleRanking : 
                  'id' in roleRanking ? roleRanking.id || i + 1 : i + 1;
    // Use actual role data or create placeholder
    const role: { 
      id: number, 
      title: string, 
      department: string, 
      departmentId: number
    } = {
      id: roleId,
      title: `Role ${roleId}`,
      department: "General",
      departmentId: 1
    };
    
    // Get pain point data for this role
    const rolePainPoints = painPoints[roleId.toString()] || {};
    
    // Calculate value score based on pain points (out of 5)
    const severity = rolePainPoints.severity || 3;
    const frequency = rolePainPoints.frequency || 3;
    const impact = rolePainPoints.impact || 3;
    
    // Value increases with severity, frequency and impact
    const valueScore = ((severity + frequency + impact) / 3) * 1.67;
    
    // Effort score influenced by data quality (lower is better)
    const effortScore = 6 - dataQuality;
    
    // Determine value level
    let valueLevel: ValueLevel;
    if (valueScore >= 4) valueLevel = "high";
    else if (valueScore >= 3) valueLevel = "medium";
    else valueLevel = "low";
    
    // Determine effort level
    let effortLevel: EffortLevel;
    if (effortScore <= 2.5) effortLevel = "low";
    else if (effortScore <= 3.5) effortLevel = "medium";
    else effortLevel = "high";
    
    // Determine priority
    let priority = heatmapData.matrix[valueLevel][effortLevel].priority;
    
    // Create prioritized item
    const prioritizedItem: PrioritizedItem = {
      id: roleId,
      title: role.title,
      department: role.department,
      valueScore: Math.round(valueScore * 10) / 10,
      effortScore: Math.round(effortScore * 10) / 10,
      priority,
      valueLevel,
      effortLevel
    };
    
    // Add to prioritized items list
    prioritizedItems.push(prioritizedItem);
    
    // Add to heatmap
    heatmapData.matrix[valueLevel][effortLevel].items.push({
      id: roleId,
      title: role.title,
      department: role.department
    });
  }
  
  // Sort prioritized items by value score descending, then effort score ascending
  prioritizedItems.sort((a, b) => {
    if (a.valueScore !== b.valueScore) {
      return b.valueScore - a.valueScore; // Descending value
    }
    return a.effortScore - b.effortScore; // Ascending effort (easier first)
  });
  
  // Generate AI-enhanced executive summary using Anthropic
  const executiveSummary = await generateEnhancedExecutiveSummary(
    stepData,
    prioritizedItems
  );
  
  // Generate AI suggestions for top roles using OpenAI
  const aiSuggestions: AISuggestion[] = [];
  
  for (const item of prioritizedItems.slice(0, 3)) {
    // For this demo, we'll use fallback AI capabilities from aiService
    // In a full implementation, we would retrieve the actual role and department data
    // and pass them to generateAICapabilityRecommendations
    const role: JobRole = {
      id: item.id,
      title: item.title,
      departmentId: 1,
      description: '',
      keyResponsibilities: [],
      aiPotential: 'Medium'
    };
    
    const department: Department = {
      id: 1,
      name: item.department,
      description: ''
    };
    
    const rolePainPoints = painPoints[item.id.toString()] || {};
    
    // Call AI service for capability recommendations
    const capabilities = await generateAICapabilityRecommendations(
      role,
      department,
      rolePainPoints
    );
    
    aiSuggestions.push({
      roleId: item.id,
      roleTitle: item.title,
      capabilities
    });
  }
  
  // Generate performance impact estimates
  const roleImpacts = [];
  let totalRoi = 0;
  
  for (const item of prioritizedItems.slice(0, 3)) {
    const role: JobRole = {
      id: item.id,
      title: item.title,
      departmentId: 1,
      description: '',
      keyResponsibilities: [],
      aiPotential: 'Medium'
    };
    
    const department: Department = {
      id: 1,
      name: item.department,
      description: ''
    };
    
    // Call AI service for performance impact predictions
    const impactResult = await generatePerformanceImpact(role, department);
    
    roleImpacts.push({
      roleTitle: item.title,
      metrics: impactResult.metrics
    });
    
    totalRoi += impactResult.estimatedAnnualRoi;
  }
  
  const performanceImpact: PerformanceImpact = {
    roleImpacts,
    estimatedRoi: totalRoi
  };
  
  return {
    executiveSummary,
    prioritizationData: {
      heatmap: heatmapData,
      prioritizedItems
    },
    aiSuggestions,
    performanceImpact
  };
}
