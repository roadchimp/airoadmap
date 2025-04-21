import { WizardStepData, HeatmapData, PrioritizedItem, EffortLevel, ValueLevel, AISuggestion, PerformanceImpact } from "@shared/schema";

/**
 * Calculates the prioritization results based on wizard step data
 */
export function calculatePrioritization(stepData: WizardStepData) {
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
  
  // Get roles from step data
  const roles = stepData.roles?.selectedRoles || [];
  
  // Process each role
  roles.forEach((role, index) => {
    // Calculate value score (out of 5)
    // For this prototype, we'll generate some scores for demonstration
    const valueScore = 5 - (index * 0.3);
    
    // Calculate effort score (out of 5, where lower is easier to implement)
    // For this prototype, we'll generate some scores based on role position
    const effortScore = 2 + (index * 0.4);
    
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
      id: role.id || index + 1,
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
      id: role.id || index + 1,
      title: role.title,
      department: role.department
    });
  });
  
  // Sort prioritized items by value score descending, then effort score ascending
  prioritizedItems.sort((a, b) => {
    if (a.valueScore !== b.valueScore) {
      return b.valueScore - a.valueScore; // Descending value
    }
    return a.effortScore - b.effortScore; // Ascending effort (easier first)
  });
  
  // Generate AI suggestions for top 3 roles
  const aiSuggestions: AISuggestion[] = prioritizedItems.slice(0, 3).map(item => {
    // Simple mapping of AI capabilities to role titles
    const capabilities = [];
    
    if (item.title.toLowerCase().includes("customer support")) {
      capabilities.push(
        { name: "Natural Language Understanding", description: "For ticket categorization and automatic routing" },
        { name: "Response Generation", description: "For template-based replies to common questions" },
        { name: "Knowledge Base Integration", description: "To quickly pull relevant documentation" }
      );
    } else if (item.title.toLowerCase().includes("sales")) {
      capabilities.push(
        { name: "RFP Response Automation", description: "For extracting key questions and generating draft responses" },
        { name: "Sales Data Analysis", description: "For identifying trends and opportunities" }
      );
    } else if (item.title.toLowerCase().includes("marketing") || item.title.toLowerCase().includes("content")) {
      capabilities.push(
        { name: "Content Generation", description: "For creating draft marketing materials" },
        { name: "Social Media Analysis", description: "For tracking campaign performance" }
      );
    } else {
      capabilities.push(
        { name: "Workflow Automation", description: "For streamlining repetitive tasks" },
        { name: "Document Processing", description: "For extracting and organizing information" }
      );
    }
    
    return {
      roleId: item.id,
      roleTitle: item.title,
      capabilities
    };
  });
  
  // Generate performance impact estimates
  const performanceImpact: PerformanceImpact = {
    roleImpacts: prioritizedItems.slice(0, 3).map(item => {
      // Generate impact metrics based on role
      const metrics = [];
      
      if (item.title.toLowerCase().includes("customer support")) {
        metrics.push(
          { name: "Time per ticket", improvement: 45 },
          { name: "Customer satisfaction", improvement: 20 },
          { name: "Agent capacity", improvement: 35 }
        );
      } else if (item.title.toLowerCase().includes("sales")) {
        metrics.push(
          { name: "RFP response time", improvement: 30 },
          { name: "Proposal quality", improvement: 25 },
          { name: "Deal analysis time", improvement: 40 }
        );
      } else if (item.title.toLowerCase().includes("marketing") || item.title.toLowerCase().includes("content")) {
        metrics.push(
          { name: "Content creation time", improvement: 35 },
          { name: "Campaign analysis", improvement: 30 }
        );
      } else {
        metrics.push(
          { name: "Process efficiency", improvement: 30 },
          { name: "Error reduction", improvement: 25 }
        );
      }
      
      return {
        roleTitle: item.title,
        metrics
      };
    }),
    estimatedRoi: 320000 // Fixed ROI for prototype
  };
  
  // Generate executive summary
  const executiveSummary = generateExecutiveSummary(prioritizedItems, stepData);
  
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

/**
 * Generates an executive summary based on prioritization results
 */
function generateExecutiveSummary(prioritizedItems: PrioritizedItem[], stepData: WizardStepData): string {
  // Get top departments
  const topRoles = prioritizedItems.slice(0, 2);
  const departments = [...new Set(topRoles.map(item => item.department))];
  
  // Create summary
  return `Based on our analysis of your current processes and roles, we've identified significant opportunities for AI transformation that could lead to efficiency gains and cost savings.

The assessment reveals that ${departments.join(" and ")} functions have the highest potential for immediate AI impact with relatively low implementation barriers. We estimate potential time savings of 15-20 hours per week per agent in ${topRoles[0].title} through AI-assisted processes and automation.

Our recommended approach is a phased implementation starting with these high-impact, low-effort areas to demonstrate quick wins and build organizational momentum for broader AI adoption.`;
}
