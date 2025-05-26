'use server';

import { storage } from "@/server/storage";
import { assessments, type Assessment, type WizardStepData, industryMaturityEnum, companyStageEnum } from "@shared/schema";
// import { eq } from "drizzle-orm"; // Not needed if not accessing db directly
import { revalidatePath } from "next/cache";

// Placeholder for getReportData, to be implemented later if needed for server-side fetching
export async function getReportData(reportId: number) {
  // Simulating fetching report data, replace with actual logic
  console.log(`Server Action: Fetching report data for ${reportId}`);
  // const report = await storage.getReport(reportId);
  // const capabilities = await storage.listAICapabilities({ reportId }); // Assuming filter by reportId
  // return { report, capabilities };
  return null; 
}

export async function updateAssessmentTitle(
  assessmentId: number,
  newTitle: string,
  reportIdToRevalidate?: number // Optional reportId for more specific revalidation
): Promise<Assessment | null> {
  try {
    console.log(`Server Action: Updating title for assessment ${assessmentId} to "${newTitle}"`);
    
    const currentAssessment = await storage.getAssessment(assessmentId);
    if (!currentAssessment) {
      throw new Error("Assessment not found.");
    }

    const currentStepData = (currentAssessment.stepData || {}) as Partial<WizardStepData>;
    const currentBasicsFromStep = currentStepData.basics;

    // Construct the complete 'basics' object, providing defaults for all required fields
    const updatedBasicsPayload: WizardStepData['basics'] = {
      reportName: newTitle, // The field we are updating
      companyName: currentBasicsFromStep?.companyName || 'Unknown Company',
      industry: currentBasicsFromStep?.industry || 'Unknown Industry',
      size: currentBasicsFromStep?.size || 'Unknown Size',
      industryMaturity: currentBasicsFromStep?.industryMaturity || industryMaturityEnum.enumValues[0], // Default to first enum value
      companyStage: currentBasicsFromStep?.companyStage || companyStageEnum.enumValues[0], // Default to first enum value
      goals: currentBasicsFromStep?.goals || undefined,
      stakeholders: currentBasicsFromStep?.stakeholders || undefined,
    };
    
    const updatedAssessment = await storage.updateAssessmentStep(
      assessmentId, 
      {
        ...currentStepData, // Spread other existing step data
        basics: updatedBasicsPayload, // Provide the complete, updated basics object
      },
      currentAssessment.strategicFocus || undefined // Convert null to undefined
    );

    if (!updatedAssessment) {
      throw new Error("Failed to update assessment title in storage.");
    }

    // Revalidate paths
    if (reportIdToRevalidate) {
      revalidatePath(`/reports/${reportIdToRevalidate}`);
    }
    revalidatePath(`/assessments/${assessmentId}`);
    revalidatePath('/reports'); // Revalidate reports list page as titles might appear there

    return updatedAssessment;

  } catch (error) {
    console.error("Error in updateAssessmentTitle server action:", error);
    // throw error; // Re-throw to be caught by the calling client component for error handling
    return null; // Or return null to indicate failure
  }
}

export async function updateReportTitle(id: number, title: string) { return null; } 