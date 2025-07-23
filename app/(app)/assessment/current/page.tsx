import React from 'react';
import { createClient } from '@/../../utils/supabase/server';
import CurrentAssessmentsTable, { AssessmentWithReportId } from '@/components/assessment/CurrentAssessmentsTable';
import { storage } from '@/server/storage';
import { UserProfile } from '@shared/schema';

// Force dynamic rendering - this page requires server-side data fetching
export const dynamic = 'force-dynamic';

// This is a server component, so we can fetch data directly
export default async function CurrentAssessmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let assessments: AssessmentWithReportId[] = [];

  if (user) {
    try {
      const userProfile: UserProfile | undefined = await storage.getUserProfileByAuthId(user.id);
      if (userProfile) {
        const userAssessments = await storage.listAssessmentsForUser(userProfile);
        
        // Fetch reports to map report IDs
        const reports = await storage.listReports();
        const assessmentToReportMap = new Map<number, number>();
        reports.forEach(report => {
          if (report.assessmentId) {
            assessmentToReportMap.set(report.assessmentId, report.id);
          }
        });

        assessments = userAssessments.map(assessment => ({
          ...assessment,
          reportId: assessmentToReportMap.get(assessment.id) || null,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch assessments:", error);
      // Let the client component handle the empty state
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Current Assessments</h1>
      <p className="text-muted-foreground mb-6">
        View, edit, or delete your ongoing and submitted assessments.
      </p>
      
      {/* Pass the fetched data to the client component */}
      <CurrentAssessmentsTable initialAssessments={assessments} />
    </div>
  );
}

