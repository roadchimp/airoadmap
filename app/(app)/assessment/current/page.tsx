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

    // 2. Fetch all reports to find matches for assessments
    const reports = await storage.listReports();
    
    // Create a map of assessment IDs to report IDs for faster lookup
    const assessmentToReportMap = new Map();
    if (Array.isArray(reports)) {
      reports.forEach(report => {
        if (report.assessmentId) {
          assessmentToReportMap.set(report.assessmentId, report.id);
        }
      });
    }

    // 3. Combine assessments with their report IDs
    const assessmentsWithReports = assessments.map((assessment): AssessmentWithReportId => {
      // Look up the report ID from our map
      const reportId = assessmentToReportMap.get(assessment.id) || null;
      
      return {
        ...assessment,
        reportId: reportId, // Add the fetched reportId (will be null if no report found)
      };
    });

    // 4. Return the combined data, sorted by update date descending
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

