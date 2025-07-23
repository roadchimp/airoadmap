import { WizardStepData, HeatmapData, PrioritizedItem, EffortLevel, ValueLevel, AISuggestion, PerformanceImpact, JobRole, Department, InsertAICapability, InsertAssessmentAICapability, AiAdoptionScoreInputComponents } from "@shared/schema";
import { generateEnhancedExecutiveSummary, generateAICapabilityRecommendations, generatePerformanceImpact } from "../../../server/lib/services/aiService";
import { storage } from '@/server/storage';
import { calculateAiAdoptionScore, CalculatedAiAdoptionScore } from "./aiAdoptionScoreEngine";

/**
 * Calculates the prioritization results based on wizard step data
 */
export async function calculatePrioritization(
  assessmentId: number, 
  stepData: WizardStepData,
  options: { noCache?: boolean } = {}
) {
  console.log(`[PrioritizationEngine] Starting calculation for assessment ID: ${assessmentId}`);
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
  
  // Get roles data - selectedRoles and prioritizedRoles are arrays of IDs (numbers)
  // Note: Despite the schema type, these are stored as number arrays after submission
  const selectedRoleIds = (stepData.roles?.selectedRoles as unknown as number[]) || [];
  const roleRankings = (stepData.roles?.prioritizedRoles as unknown as number[]) || [];
  const painPoints = stepData.painPoints?.roleSpecificPainPoints || {};
  
  // Fetch all role data from the database to build the role map
  const allRoles = await storage.listJobRoles();
  
  // Create a map of role IDs to role objects for easy lookup
  const roleMap = new Map<number, { id: number; title: string; department: string }>();
  
  // Build role map using the fetched role data
  selectedRoleIds.forEach(roleId => {
    if (typeof roleId === 'number') {
      const roleData = allRoles.find(r => r.id === roleId);
      if (roleData) {
        roleMap.set(roleId, {
          id: roleData.id,
          title: roleData.title,
          department: roleData.departmentName || `Department ${roleData.departmentId}`,
        });
      }
    }
  });

  // If roleRankings is empty, populate it with all selected role IDs
  const finalRoleRankings = roleRankings.length > 0 ? roleRankings : selectedRoleIds.filter(id => typeof id === 'number');
  
  // selectedRoleIds is already an array of numbers
  const assessmentRoleIds: number[] = selectedRoleIds.filter((id): id is number => typeof id === 'number');
  
  console.log(`Assessment has ${assessmentRoleIds.length} selected roles for capability mapping:`, 
    assessmentRoleIds.map(roleId => {
      const roleData = roleMap.get(roleId);
      return `${roleData?.title || 'Unknown'} (ID: ${roleId})`;
    }));
  
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
  for (let i = 0; i < finalRoleRankings.length; i++) {
    const roleId = finalRoleRankings[i] as number;
    const roleData = roleMap.get(roleId);

    if (!roleData) {
      console.warn(`Could not find role data for prioritized role ID: ${roleId}. Skipping.`);
      continue;
    }
    
    // Use actual role data from the map
    const roleTitle = roleData.title;
    const roleDepartment = roleData.department;
    
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
    const priority = heatmapData.matrix[valueLevel][effortLevel].priority;
    
    // Create prioritized item
    const prioritizedItem: PrioritizedItem = {
      id: roleId.toString(),
      name: roleTitle,
      department: roleDepartment,
      valueScore: Math.round(valueScore * 10) / 10,
      effortScore: Math.round(effortScore * 10) / 10,
      priority,
      valueLevel,
      effortLevel,
      aiAdoptionScore: 0
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
  
  console.log(`[PrioritizationEngine] Completed role prioritization. Found ${prioritizedItems.length} prioritized items`);
  console.log(`[PrioritizationEngine] Top 3 roles:`, prioritizedItems.slice(0, 3).map(item => ({ name: item.name, valueScore: item.valueScore, effortScore: item.effortScore })));

  // OPTIMIZATION: Run all AI API calls in parallel
  // Create an array of promises for all OpenAI API calls
  const promises = [];

  // Generate AI-enhanced executive summary using Anthropic
  console.log(`[PrioritizationEngine] Requesting executive summary for assessment: ${assessmentId}`);
  const executiveSummaryPromise = generateEnhancedExecutiveSummary(
    assessmentId,
    stepData,
    prioritizedItems,
    options
  ).then(result => {
    console.log(`[PrioritizationEngine] Received executive summary for assessment: ${assessmentId}`);
    return result;
  });
  promises.push(executiveSummaryPromise);
  
  // Generate AI suggestions for top roles using OpenAI (in parallel)
  const topRoles = prioritizedItems.slice(0, 3);
  const aiSuggestionsPromises = topRoles.map(item => {
    // Create role and department objects
    const role: JobRole = {
      id: parseInt(item.id),
      title: item.name,
      departmentId: 1,
      description: '',
      keyResponsibilities: [],
      aiPotential: 'Medium',
      level: null,
      skills: [],
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const department: Department = {
      id: 1,
      name: item.department,
      description: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const rolePainPoints = painPoints[item.id.toString()] || {};
    
    // Call AI service for capability recommendations
    console.log(`[PrioritizationEngine] Requesting AI recommendations for role: ${role.title}`);
    return generateAICapabilityRecommendations(role, department, rolePainPoints)
      .then(result => {
        console.log(`[PrioritizationEngine] Received AI recommendations for role: ${role.title}`);
        return result;
      });
  });
  promises.push(...aiSuggestionsPromises);
  
  // Generate performance impact estimates (in parallel)
  const performanceImpactPromises = topRoles.map(item => {
    const role: JobRole = {
      id: parseInt(item.id),
      title: item.name,
      departmentId: 1,
      description: '',
      keyResponsibilities: [],
      aiPotential: 'Medium',
      level: null,
      skills: [],
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const department: Department = {
      id: 1,
      name: item.department,
      description: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Call AI service for performance impact
    console.log(`[PrioritizationEngine] Requesting performance impact for role: ${role.title}`);
    return generatePerformanceImpact(role, department)
      .then(result => {
        console.log(`[PrioritizationEngine] Received performance impact for role: ${role.title}`);
        return result;
      });
  });
  promises.push(...performanceImpactPromises);
  
  // Wait for all promises to resolve
  console.log(`[PrioritizationEngine] Starting ${promises.length} parallel AI API calls...`);
  const results = await Promise.all(promises);
  console.log(`[PrioritizationEngine] Completed all ${promises.length} AI API calls`);
  
  // Extract results
  const executiveSummary = results[0] as string;
  const numOtherPromisesBeforeAICapabilities = 1;
  const rawAiCapabilityRecommendations = results.slice(
    numOtherPromisesBeforeAICapabilities, 
    numOtherPromisesBeforeAICapabilities + aiSuggestionsPromises.length
  ) as Array<Array<Partial<InsertAssessmentAICapability & { 
    capabilityName: string; 
    capabilityCategory: string; 
    capabilityDescription?: string; 
    default_business_value?: string | null;
    default_implementation_effort?: string | null;
    default_ease_score?: string | null;
    default_value_score?: string | null;
    default_feasibility_score?: string | null;
    default_impact_score?: string | null;
    tags?: string[] | null;
  }>>>;

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
        try {
          console.log(`[DEBUG] About to find/create capability: ${rec.capabilityName}`);
          // Step 1: Find or create the global AI capability
          const globalCapability = await storage.findOrCreateGlobalAICapability(
            rec.capabilityName || `Unknown Capability ${i}`, // Required with fallback
            rec.capabilityCategory || "Uncategorized", // Required with fallback
            rec.capabilityDescription, // Optional
            {
              // Optional defaults for the global capability
              default_business_value: rec.default_business_value,
              default_implementation_effort: rec.default_implementation_effort,
              default_ease_score: rec.default_ease_score,
              default_value_score: rec.default_value_score,
              default_feasibility_score: rec.default_feasibility_score,
              default_impact_score: rec.default_impact_score,
              tags: rec.tags || []
            }
          );
          console.log(`[DEBUG] Global capability result:`, globalCapability);

          if (!globalCapability || !globalCapability.id) {
            console.error(`[ERROR] Failed to create global capability for: ${rec.capabilityName}`);
            continue; // Skip this capability
          }
          
          // Step 1.5: Map this capability to all selected roles from the assessment
          // This creates the missing relationship data that enables role-based filtering
          for (const roleId of assessmentRoleIds) {
            try {
              // Get the impact score from the recommendation, default to a reasonable value
              const impactScore = typeof rec.impactScore === 'number' ? rec.impactScore : 
                                (typeof rec.impactScore === 'string' ? parseFloat(rec.impactScore) || 50 : 50); // Default to medium impact (50/100)
              
              // Use the enhanced mapping method that stores both the relationship and impact score
              await storage.mapCapabilityToJobRoleWithImpact(globalCapability.id, roleId, impactScore);
              console.log(`Mapped capability "${globalCapability.name}" (ID: ${globalCapability.id}) to role ID ${roleId} with impact score ${impactScore}`);
            } catch (mappingError) {
              console.warn(`Failed to map capability ${globalCapability.id} to role ${roleId}:`, mappingError);
              // Continue with other mappings even if one fails
            }
          }
          
          // Step 2: Create the assessment-specific capability link
          const assessmentCapability: InsertAssessmentAICapability = {
            assessmentId: assessmentId,
            aiCapabilityId: globalCapability.id,
            valueScore: rec.valueScore,
            feasibilityScore: rec.feasibilityScore,
            impactScore: rec.impactScore,
            easeScore: rec.easeScore,
            priority: rec.priority || 'Medium',
            rank: rec.rank,
            implementationEffort: rec.implementationEffort || "Medium",
            businessValue: rec.businessValue || "Medium",
            assessmentNotes: rec.assessmentNotes
          };
          
          await storage.createAssessmentAICapability(assessmentCapability);
          
          // Add to the list of suggestions for the report
          roleAISuggestions.push({ 
            name: globalCapability.name, 
            description: globalCapability.description || "" 
          });
        } catch (error) {
          console.error(`Error saving AI capability recommendation: ${String(rec.capabilityName || "Unknown")}`, error);
          roleAISuggestions.push({ 
            name: String(rec.capabilityName || "Unknown Capability"), 
            description: String(rec.capabilityDescription || "") + " (Error saving details)" 
          });
        }
      }
    }
     allSavedCapabilities.push({
      roleId: parseInt(topRoles[i].id),
      roleTitle: topRoles[i].name,
      capabilities: roleAISuggestions
    });
  }
  
  // Format AI suggestions for the report (now uses what was successfully processed/saved)
  const aiSuggestions: AISuggestion[] = allSavedCapabilities;
  
  // Format performance impact
  const roleImpacts = topRoles.map((item, index) => ({
    roleTitle: item.name,
    metrics: performanceResults[index].metrics
  }));
  
  const totalRoi = performanceResults.reduce((sum, result) => sum + (result.estimatedAnnualRoi || 0), 0);
  
  const performanceImpact: PerformanceImpact = {
    roleImpacts,
    estimatedRoi: totalRoi
  };
  
  // Calculate AI Adoption Score
  const assessmentRecord = await storage.getAssessment(assessmentId);
  const aiAdoptionScoreInputs = stepData.aiAdoptionScoreInputs || {} as AiAdoptionScoreInputComponents;

  const aiAdoptionScore: CalculatedAiAdoptionScore = await calculateAiAdoptionScore(
    aiAdoptionScoreInputs,
    assessmentRecord?.industry || 'Other',
    assessmentRecord?.companyStage || 'Startup',
    assessmentRecord?.industryMaturity || 'Immature',
    assessmentRecord?.organizationId
  );
  
  return {
    executiveSummary,
    prioritizationData: {
      heatmap: heatmapData,
      prioritizedItems
    },
    aiSuggestions,
    performanceImpact,
    aiAdoptionScoreDetails: aiAdoptionScore
  };
}
