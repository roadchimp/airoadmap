import { storage } from '@/server/storage';
import { calculatePrioritization } from '@/server/lib/engines/prioritizationEngine';
import type { WizardStepData, AssessmentResponse } from '@shared/schema';

/**
 * Converts raw assessment responses into the structured WizardStepData format.
 * This function is a placeholder and may need to be adapted based on the actual
 * structure of assessment responses.
 */
function convertResponsesToStepData(
  responses: AssessmentResponse[],
  existingStepData: WizardStepData = {}
): WizardStepData {
  const stepData: WizardStepData = { ...existingStepData };
  
  for (const response of responses) {
    const identifier = response.questionIdentifier;
    const pathParts = identifier.split('.');
    const stepId = pathParts[0] as keyof WizardStepData;
    
    if (!stepData[stepId]) {
        // A more robust implementation would initialize step data based on schema
        (stepData[stepId] as any) = {};
    }
    
    let value: any = undefined;
    if (response.responseText !== null) value = response.responseText;
    else if (response.responseNumeric !== null) value = response.responseNumeric;
    else if (response.responseBoolean !== null) value = response.responseBoolean;
    else if (response.responseJson !== null) value = response.responseJson;
    
    if (value !== undefined) {
      setNestedValue(stepData[stepId], pathParts.slice(1), value);
    }
  }
  
  return stepData;
}

/**
 * Helper to set a value at a nested path within an object.
 */
function setNestedValue(obj: any, path: string[], value: any): void {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const part = path[i];
    if (current[part] === undefined) {
      current[part] = {};
    }
    current = current[part];
  }
  current[path[path.length - 1]] = value;
}


/**
 * Generates a full report for a given assessment ID.
 * This is the core logic that was previously in the /api/prioritize route.
 * @param assessmentId The ID of the assessment to generate a report for.
 * @returns The newly created report object.
 */
export async function generateReportForAssessment(assessmentId: number, options: { regenerate?: boolean } = {}) {
  try {
    console.log(`[ReportService] Starting report generation for assessment ID: ${assessmentId}`);

    console.log(`[ReportService] Fetching assessment data...`);
    
    // Enhanced connection resilience: multiple shorter attempts instead of one long timeout
    // This addresses Neon HTTP driver connection establishment delays, not query performance
    let assessment: any = null;
    let attempts = 0;
    const maxAttempts = 3;
    const attemptTimeout = 45000; // 45s per attempt (total: 135s max)
    
    while (!assessment && attempts < maxAttempts) {
      attempts++;
      console.log(`[ReportService] Assessment fetch attempt ${attempts}/${maxAttempts}`);
      
      try {
        const assessmentPromise = storage.getAssessment(assessmentId);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Assessment fetch attempt ${attempts} timed out after 45s`)), attemptTimeout)
        );
        
        assessment = await Promise.race([assessmentPromise, timeoutPromise]);
        
        if (assessment) {
          console.log(`[ReportService] Assessment fetched successfully on attempt ${attempts}:`, { id: assessment?.id, title: assessment?.title });
          break;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`[ReportService] Assessment fetch attempt ${attempts} failed: ${errorMessage}`);
        
        // If this was the last attempt, throw the error
        if (attempts === maxAttempts) {
          console.error(`[ReportService] All ${maxAttempts} assessment fetch attempts failed for assessment ID: ${assessmentId}`);
          throw new Error(`Failed to fetch assessment after ${maxAttempts} attempts. Last error: ${errorMessage}`);
        }
        
        // Wait 2 seconds before retry to allow connection recovery
        console.log(`[ReportService] Waiting 2s before retry attempt ${attempts + 1}...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    console.log(`[ReportService] Assessment fetched:`, { id: assessment?.id, title: assessment?.title });
  if (!assessment) {
    console.error(`[ReportService] Assessment not found for ID: ${assessmentId}`);
    throw new Error('Assessment not found');
  }

  console.log(`[ReportService] Fetching assessment responses...`);
  const assessmentResponses = await storage.getAssessmentResponsesByAssessment(assessmentId);
  console.log(`[ReportService] Assessment responses fetched:`, { count: assessmentResponses?.length || 0 });
  
  console.log(`[ReportService] Processing step data...`);
  let stepData = (assessment as any).stepData as WizardStepData;
  if (assessmentResponses && assessmentResponses.length > 0) {
    stepData = convertResponsesToStepData(assessmentResponses, stepData || {});
  } else if (!stepData) {
    console.error(`[ReportService] No data available for assessment ID: ${assessmentId}`);
    throw new Error('Assessment has no data');
  }

  console.log(`[ReportService] Calculating prioritization for assessment ID: ${assessmentId}`);
  console.log(`[ReportService] Step data summary:`, {
    hasBasics: !!stepData.basics,
    hasRoles: !!stepData.roles,
    selectedRolesCount: stepData.roles?.selectedRoles?.length || 0,
    painPointsCount: Object.keys(stepData.painPoints?.roleSpecificPainPoints || {}).length
  });
  
  let results;
  try {
    results = await calculatePrioritization(assessmentId, stepData, { noCache: options.regenerate });
    console.log(`[ReportService] Prioritization calculation completed for assessment ID: ${assessmentId}`);
  } catch (error) {
    console.error(`[ReportService] Error during prioritization calculation for assessment ID: ${assessmentId}:`, error);
    throw error;
  }

  console.log(`[ReportService] Creating report in database for assessment ID: ${assessmentId}`);
  const report = await storage.createReport({
    assessmentId,
    executiveSummary: results.executiveSummary,
    prioritizationData: results.prioritizationData,
    aiSuggestions: results.aiSuggestions,
    performanceImpact: results.performanceImpact,
    consultantCommentary: "", // Default empty commentary
    aiAdoptionScoreDetails: results.aiAdoptionScoreDetails,
  });

  await storage.updateAssessmentStatus(assessmentId, "completed");
  console.log(`[ReportService] Report generation complete for assessment ID: ${assessmentId}. Report ID: ${report.id}`);
  
  return report;
  } catch (error) {
    console.error(`[ReportService] Fatal error in report generation for assessment ID: ${assessmentId}:`, error);
    console.error(`[ReportService] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
} 