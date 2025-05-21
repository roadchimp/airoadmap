import { WizardStepData, HeatmapData, PrioritizedItem, EffortLevel, ValueLevel, AISuggestion, PerformanceImpact, JobRole, Department, InsertAICapability } from "@shared/schema";
import { generateEnhancedExecutiveSummary, generateAICapabilityRecommendations, generatePerformanceImpact } from "./aiService";
import { storage } from '@/server/storage';

/**
 * Calculates the prioritization results based on wizard step data
 */
export async function calculatePrioritization(assessmentId: number, stepData: WizardStepData) {
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
    const roleRankingItem = roleRankings[i] as { id?: number, title?: string, department?: string }; // Type assertion
    
    // Ensure roleId has a fallback if id is somehow missing, though it shouldn't be
    const roleId = roleRankingItem.id || (typeof roleRankingItem === 'number' ? roleRankingItem : i + 1);
    
    // Use actual role data from roleRankingItem if available, otherwise placeholder
    const roleTitle = roleRankingItem.title || `Role ${roleId}`;
    const roleDepartment = roleRankingItem.department || "General";
    
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
      title: roleTitle,
      department: roleDepartment,
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
      title: roleTitle,
      department: roleDepartment
    });
  }
  
  // Sort prioritized items by value score descending, then effort score ascending
  prioritizedItems.sort((a, b) => {
    if (a.valueScore !== b.valueScore) {
      return b.valueScore - a.valueScore; // Descending value
    }
    return a.effortScore - b.effortScore; // Ascending effort (easier first)
  });
  
  // OPTIMIZATION: Run all AI API calls in parallel
  // Create an array of promises for all OpenAI API calls
  const promises = [];

  // Generate AI-enhanced executive summary using Anthropic
  const executiveSummaryPromise = generateEnhancedExecutiveSummary(
    stepData,
    prioritizedItems
  );
  promises.push(executiveSummaryPromise);
  
  // Generate AI suggestions for top roles using OpenAI (in parallel)
  const topRoles = prioritizedItems.slice(0, 3);
  const aiSuggestionsPromises = topRoles.map(item => {
    // Create role and department objects
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
    return generateAICapabilityRecommendations(role, department, rolePainPoints);
  });
  promises.push(...aiSuggestionsPromises);
  
  // Generate performance impact estimates (in parallel)
  const performanceImpactPromises = topRoles.map(item => {
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
    return generatePerformanceImpact(role, department);
  });
  promises.push(...performanceImpactPromises);
  
  // Wait for all promises to resolve
  const results = await Promise.all(promises);
  
  // Extract results
  const executiveSummary = results[0] as string;
  const numOtherPromisesBeforeAICapabilities = 1;
  const rawAiCapabilityRecommendations = results.slice(
    numOtherPromisesBeforeAICapabilities, 
    numOtherPromisesBeforeAICapabilities + aiSuggestionsPromises.length
  ) as Array<Array<Omit<InsertAICapability, 'assessmentId' | 'id' | 'createdAt' | 'updatedAt'>>>;

  const performanceResults = results.slice(
    numOtherPromisesBeforeAICapabilities + aiSuggestionsPromises.length
  ) as any[];
  
  // Save AI Capabilities to the database
  const allSavedCapabilities: AISuggestion[] = [];

  for (let i = 0; i < topRoles.length; i++) {
    const roleRecommendations = rawAiCapabilityRecommendations[i];
    const roleAISuggestions: { name: string; description: string; }[] = [];

    if (Array.isArray(roleRecommendations)) {
      for (const rec of roleRecommendations) {
        // Construct the object to insert, ensuring all required fields for InsertAICapability are present
        // and that scores are numbers.
        const capabilityToSave: InsertAICapability = {
          id: Date.now() + Math.floor(Math.random() * 1000), // TEMPORARY: Placeholder ID - NOT PRODUCTION SAFE
          name: rec.name,
          category: rec.category || "Uncategorized",
          description: rec.description || "",
          valueScore: rec.valueScore !== undefined && rec.valueScore !== null ? String(rec.valueScore) : null,
          feasibilityScore: rec.feasibilityScore !== undefined && rec.feasibilityScore !== null ? String(rec.feasibilityScore) : null,
          impactScore: rec.impactScore !== undefined && rec.impactScore !== null ? String(rec.impactScore) : null,
          priority: rec.priority || 'Medium',
          rank: typeof rec.rank === 'string' ? parseInt(rec.rank) : rec.rank,
          assessmentId: assessmentId,
          implementationEffort: rec.implementationEffort || "Medium",
          businessValue: rec.businessValue || "Medium",
          easeScore: rec.easeScore !== undefined && rec.easeScore !== null ? String(rec.easeScore) : null,
        };
        try {
          await storage.createAICapability(capabilityToSave);
          roleAISuggestions.push({ name: capabilityToSave.name, description: capabilityToSave.description || "" });
        } catch (error) {
          console.error(`Error saving AI capability recommendation: ${rec.name}`, error);
          roleAISuggestions.push({ name: rec.name, description: (rec.description || "") + " (Error saving details)" });
        }
      }
    }
     allSavedCapabilities.push({
      roleId: topRoles[i].id,
      roleTitle: topRoles[i].title,
      capabilities: roleAISuggestions
    });
  }
  
  // Format AI suggestions for the report (now uses what was successfully processed/saved)
  const aiSuggestions: AISuggestion[] = allSavedCapabilities;
  
  // Format performance impact
  const roleImpacts = topRoles.map((item, index) => ({
    roleTitle: item.title,
    metrics: performanceResults[index].metrics
  }));
  
  const totalRoi = performanceResults.reduce((sum, result) => sum + (result.estimatedAnnualRoi || 0), 0);
  
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
