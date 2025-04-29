import React from "react";
import Link from "next/link"; // Use Next.js Link
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { storage } from "@/server/storage"; // Import storage layer
import type { Assessment, Report } from "@shared/schema"; // Import types

// This page should be a Server Component by default
export default async function DashboardPage() {
  // Fetch dynamic data directly in the Server Component
  let assessmentCountInProgress = 0;
  let assessmentCountCompleted = 0;
  let reportCount = 0;
  let fetchError = null;

  try {
    const [assessments, reports] = await Promise.all([
      storage.listAssessments(), // Fetch all assessments
      storage.listReports()      // Fetch all reports
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
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Welcome to AI Prioritize</h1>
      
      {/* Getting Started Guide Card - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started Guide</CardTitle>
          <CardDescription>
            Follow these steps to create your first AI transformation roadmap:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold">
                1
              </div>
              <p className="text-lg">Click "New Assessment" to start a new evaluation</p>
            </div>
            {/* ... other steps ... */}
             <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold">
                2
              </div>
              <p className="text-lg">Answer questions about your organization's current state</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold">
                3
              </div>
              <p className="text-lg">Identify key pain points and opportunities</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-semibold">
                4
              </div>
              <p className="text-lg">Review the AI-generated recommendations</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Three Cards in One Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Assessments Card */}
        <Card>
          <CardHeader>
            <CardTitle>Assessments</CardTitle>
            <CardDescription>
              Create or continue an assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                {/* Display dynamic counts */}
                <div className="text-5xl font-bold">{assessmentCountInProgress + assessmentCountCompleted}</div>
                <div className="flex flex-col text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                    {assessmentCountInProgress} in progress
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                    {assessmentCountCompleted} completed
                  </span>
                </div>
              </div>
              {/* Updated Link component */}
              <Link href="/assessment/new">
                <Button className="w-full bg-red-600 hover:bg-red-700">
                  <span className="mr-2">+</span> New Assessment
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Generated Reports Card */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Reports</CardTitle>
            <CardDescription>
              View your prioritization reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                 {/* Display dynamic counts */}
                <div className="text-5xl font-bold">{reportCount}</div>
                <div className="text-sm text-muted-foreground mt-2">
                  Total reports
                </div>
              </div>
               {/* Updated Link component */}
              <Link href="/reports">
                <Button variant="outline" className="w-full">
                  <span className="mr-2">👁️</span> View Reports
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Libraries Card */}
        <Card>
          <CardHeader>
            <CardTitle>Libraries</CardTitle>
            <CardDescription>
              Manage job roles and AI capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Customize the role and AI capability libraries to better match your organization's needs.
              </p>
               {/* Updated Link component */}
              <Link href="/library">
                <Button variant="outline" className="w-full">
                  <span className="mr-2">📚</span> Browse Libraries
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 