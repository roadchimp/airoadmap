import React from 'react';
import { storage } from '@/server/storage';
import { Report, Assessment } from '@shared/schema';
import ReportsTable from './ReportsTable';

// Server-side data fetching function
async function getReportsAndAssessments(): Promise<{ reports: Report[], assessments: Assessment[] }> {
  try {
    const reports = await storage.listReports() || [];
    const assessments = await storage.listAssessments() || []; 
    
    // Sort reports by generatedAt timestamp (most recent first)
    const sortedReports = Array.isArray(reports) 
      ? [...reports].sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()) 
      : [];
    
    return {
      reports: sortedReports,
      assessments: Array.isArray(assessments) ? assessments : []
    };
  } catch (error) {
    console.error("Error fetching reports/assessments:", error);
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