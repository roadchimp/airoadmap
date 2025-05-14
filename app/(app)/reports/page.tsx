import React from 'react';
import { Report, Assessment } from '@shared/schema';
import ReportsTable from './ReportsTable';

// Server-side data fetching function
async function getReportsAndAssessments(): Promise<{ reports: Report[], assessments: Assessment[] }> {
  // Initialize with empty arrays
  let reports: Report[] = [];
  let assessments: Assessment[] = [];
  
  try {
    // Fetch reports from public API endpoint
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/public/reports`);
      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.status} ${response.statusText}`);
      }
      const fetchedReports = await response.json();
      
      if (Array.isArray(fetchedReports)) {
        reports = fetchedReports;
      } else {
        console.error("Reports API did not return an array:", fetchedReports);
      }
    } catch (reportsError) {
      console.error("Error fetching reports:", reportsError);
    }
    
    // Fetch assessments from public API endpoint
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/public/assessments`);
      if (!response.ok) {
        throw new Error(`Failed to fetch assessments: ${response.status} ${response.statusText}`);
      }
      const fetchedAssessments = await response.json();
      
      if (Array.isArray(fetchedAssessments)) {
        assessments = fetchedAssessments;
      } else {
        console.error("Assessments API did not return an array:", fetchedAssessments);
      }
    } catch (assessmentsError) {
      console.error("Error fetching assessments:", assessmentsError);
    }
    
    // Sort reports by generatedAt timestamp (most recent first)
    const sortedReports = [...reports].sort((a, b) => 
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
    
    return {
      reports: sortedReports,
      assessments: assessments
    };
  } catch (error) {
    console.error("Error in getReportsAndAssessments:", error);
    return { reports: [], assessments: [] };
  }
}

// Server Component that fetches data and passes it to the Client Component
export default async function ReportsPage() {
  const { reports, assessments } = await getReportsAndAssessments();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-2">Assessment Reports</h1>
      <p className="text-muted-foreground mb-6">View your generated AI transformation assessment reports.</p>
      
      <ReportsTable 
        reports={reports} 
        assessments={assessments} 
      />
    </div>
  );
} 