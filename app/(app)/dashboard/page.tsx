import React from "react";
import { storage } from "@/server/storage";
import type { Assessment } from "@shared/schema";
import DashboardContent from "./DashboardContent";

// Server Component that fetches data
export default async function DashboardPage() {
  // Fetch dynamic data directly in the Server Component
  let assessmentCountInProgress = 0;
  let assessmentCountCompleted = 0;
  let reportCount = 0;
  let fetchError = null;

  try {
    const [assessments, reports] = await Promise.all([
      storage.listAssessments(),
      storage.listReports()
    ]);

    assessments.forEach((assessment: Assessment) => {
      if (assessment.status === 'completed') {
        assessmentCountCompleted++;
      } else {
        // Assuming any status other than completed is "in progress" for this display
        assessmentCountInProgress++;
      }
    });

    reportCount = reports.length;

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    fetchError = error instanceof Error ? error.message : "Failed to load dashboard data";
  }

  // Handle potential fetch error
  if (fetchError) {
    return (
      <div className="container mx-auto p-6 text-center text-red-600">
        <p>Error loading dashboard: {fetchError}</p>
      </div>
    );
  }

  return (
    <DashboardContent
      assessmentCountInProgress={assessmentCountInProgress}
      assessmentCountCompleted={assessmentCountCompleted}
      reportCount={reportCount}
    />
  );
} 