import React from 'react';
import { storage } from '@/server/storage';
import { Assessment, Report } from '@shared/schema'; // Import Report type
import CurrentAssessmentsTable from '@components/assessment/CurrentAssessmentsTable';

// Define the combined type here or import if moved to a shared location
type AssessmentWithReportId = Assessment & {
  reportId?: number | null; // Add optional reportId
};

// Fetch assessments and associated report IDs
async function getAssessmentsData() {
  try {
    // 1. Fetch assessments for the user
    const userId = 1; // Hardcoded temporary value - Replace with actual user ID later
    const assessments = await storage.listAssessmentsByUser?.(userId) || [];

    if (!Array.isArray(assessments)) {
        console.error("listAssessmentsByUser did not return an array:", assessments);
        return { assessmentsWithReports: [] };
    }

    // 2. Fetch the corresponding report for each assessment
    const assessmentsWithReports = await Promise.all(
      assessments.map(async (assessment): Promise<AssessmentWithReportId> => {
        let reportId: number | null = null;
        try {
            // Only fetch report if assessment is not in 'draft' status potentially
            // (or always fetch and let the UI decide based on status + reportId presence)
            const report = await storage.getReportByAssessment(assessment.id);
            if (report) {
            reportId = report.id;
            }
        } catch (reportError) {
            console.error(`Error fetching report for assessment ${assessment.id}:`, reportError);
            // Continue without reportId if report fetch fails
        }
        return {
          ...assessment,
          reportId: reportId, // Add the fetched reportId (will be null if no report found)
        };
      })
    );

    // 3. Return the combined data, sorted by update date descending
    return {
      assessmentsWithReports: assessmentsWithReports.sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    };

  } catch (error) {
    console.error("Error fetching assessments data:", error);
    return { assessmentsWithReports: [] };
  }
}

export default async function CurrentAssessmentsPage() {
  // Use the updated function name in the return object
  const { assessmentsWithReports } = await getAssessmentsData();

  return (
    <div className="container mx-auto py-8">
       <div className="mb-6">
         <h1 className="text-2xl font-bold">Current Assessments</h1>
         <p className="text-muted-foreground">View, edit, or delete your ongoing and submitted assessments.</p>
       </div>

      {/* Pass the combined data to the client component table */}
      <CurrentAssessmentsTable initialAssessments={assessmentsWithReports} />
    </div>
  );
}

