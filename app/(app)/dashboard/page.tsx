'use client';

import React, { useEffect, useState } from "react";
import DashboardContent from "./DashboardContent";
import { useAuth } from '../../../hooks/UseAuth';
import { apiClient } from '../../../utils/api-client';
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DashboardData {
  assessmentCountInProgress: number;
  assessmentCountCompleted: number;
  reportCount: number;
}

export default function DashboardPage() {
  const { user, isAuthenticated, csrfToken, isLoading: csrfLoading } = useAuth();
  const [data, setData] = useState<DashboardData>({
    assessmentCountInProgress: 0,
    assessmentCountCompleted: 0,
    reportCount: 0
  });
  const [error, setError] = useState<string | null>(null);

  // Set CSRF token on apiClient when it becomes available
  useEffect(() => {
    if (csrfToken) {
      apiClient.setCsrfToken(csrfToken);
    }
  }, [csrfToken]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Temporarily use the simple endpoint that works
        const response = await apiClient.get<DashboardData>('/api/dashboard-simple');
        setData(response);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard data fetch error:', err);
      }
    };

    // Only fetch data when authenticated (don't need CSRF for simple endpoint)
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-6 pt-16">
        <div className="flex flex-col items-center space-y-4">
          <p className="text-lg text-gray-600">Please log in to access the dashboard.</p>
          <Link href="/login">
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (csrfLoading) {
    return <div>Loading security tokens...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-6 text-center text-red-600">{error}</div>;
  }

  return (
    <DashboardContent
      assessmentCountInProgress={data.assessmentCountInProgress}
      assessmentCountCompleted={data.assessmentCountCompleted}
      reportCount={data.reportCount}
    />
  );
} 