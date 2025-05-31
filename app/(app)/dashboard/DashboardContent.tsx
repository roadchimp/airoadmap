'use client';

import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '../../../hooks/UseAuth';
import { apiClient } from '../../../utils/api-client';

interface DashboardContentProps {
  assessmentCountInProgress: number;
  assessmentCountCompleted: number;
  reportCount: number;
}

export default function DashboardContent({
  assessmentCountInProgress,
  assessmentCountCompleted,
  reportCount
}: DashboardContentProps) {
  const { user, isAuthenticated } = useAuth();
  const { csrfToken, isLoading: csrfLoading } = useAuth();

  useEffect(() => {
    if (csrfToken) {
      apiClient.setCsrfToken(csrfToken);
    }
  }, [csrfToken]);

  if (!isAuthenticated) {
    return <div>Please log in to access the dashboard.</div>;
  }

  if (csrfLoading) {
    return <div>Loading security tokens...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6 bg-gray-50">
      <h1 className="text-3xl font-bold text-foreground">Assessment Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Getting Started Guide Card - Smaller and positioned in the third column */}
        <div className="col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Getting Started Guide</CardTitle>
              <CardDescription>
                How to create your AI transformation roadmap:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">1. Start a new assessment</p>
                <p className="text-sm text-muted-foreground">2. Answer questions about your organization</p>
                <p className="text-sm text-muted-foreground">3. Identify key opportunities</p>
                <p className="text-sm text-muted-foreground">4. Review AI-generated recommendations</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assessments Card */}
        <div className="col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Assessments</CardTitle>
              <CardDescription>
                Create or continue an assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
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
                <Link href="/assessment/new">
                  <Button className="w-full bg-[#e84c2b] hover:bg-[#d13c1c]">
                    <span className="mr-2">+</span> New Assessment
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generated Reports Card */}
        <div className="col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
              <CardDescription>
                View your prioritization reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-5xl font-bold">{reportCount}</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Total reports
                  </div>
                </div>
                <Link href="/reports">
                  <Button variant="outline" className="w-full">
                    <span className="mr-2">👁️</span> View Reports
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Libraries Card */}
        <div className="col-span-3">
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
                <Link href="/library">
                  <Button variant="outline" className="w-full md:w-auto">
                    <span className="mr-2">📚</span> Browse Libraries
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 