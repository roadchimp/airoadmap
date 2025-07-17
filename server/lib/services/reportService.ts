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
  console.log(`[ReportService] Starting report generation for assessment ID: ${assessmentId}`);

  const assessment = await storage.getAssessment(assessmentId);
  if (!assessment) {
    console.error(`[ReportService] Assessment not found for ID: ${assessmentId}`);
    throw new Error('Assessment not found');
  }

  const assessmentResponses = await storage.getAssessmentResponsesByAssessment(assessmentId);
  
  let stepData = assessment.stepData as WizardStepData;
  if (assessmentResponses && assessmentResponses.length > 0) {
    stepData = convertResponsesToStepData(assessmentResponses, stepData || {});
  } else if (!stepData) {
    console.error(`[ReportService] No data available for assessment ID: ${assessmentId}`);
    throw new Error('Assessment has no data');
  }

  console.log(`[ReportService] Calculating prioritization for assessment ID: ${assessmentId}`);
  const results = await calculatePrioritization(assessmentId, stepData, { noCache: options.regenerate });

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
} 