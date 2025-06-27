import React from 'react';
import { storage } from '@/server/storage';
import { Report, Assessment, UserProfile } from '@shared/schema';
import ReportsTable from './ReportsTable';
import { unstable_noStore } from 'next/cache';
import { createClient } from '@/../../utils/supabase/server';

// Server-side data fetching function
async function getReportsAndAssessmentsForUser(): Promise<{ reports: Report[], assessments: Assessment[] }> {
  // Disable caching to ensure fresh data on each request
  unstable_noStore();
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.warn("No user found, returning empty reports and assessments.");
    return { reports: [], assessments: [] };
  }
  
  try {
    const userProfile: UserProfile | undefined = await storage.getUserProfileByAuthId(user.id);

    if (!userProfile) {
      console.warn(`No user profile found for auth id ${user.id}`);
      return { reports: [], assessments: [] };
    }

    // Try to fetch reports for the user
    const reports = await storage.listReportsForUser(userProfile);
    
    // Try to fetch assessments for the user
    const assessments = await storage.listAssessmentsForUser(userProfile);
    
    // Sort reports by generatedAt timestamp (most recent first)
    const sortedReports = [...reports].sort((a, b) => 
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
    
    return {
      reports: sortedReports,
      assessments: assessments
    };
  } catch (error) {
    console.error("Error in getReportsAndAssessmentsForUser:", error);
    return { reports: [], assessments: [] };
  }
}

// Server Component that fetches data and passes it to the Client Component
export default async function ReportsPage() {
  const { reports, assessments } = await getReportsAndAssessmentsForUser();

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