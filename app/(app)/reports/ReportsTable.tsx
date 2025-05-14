'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Report, Assessment } from '@shared/schema';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';

interface ReportsTableProps {
  reports: Report[];
  assessments: Assessment[];
}

export default function ReportsTable({ reports, assessments }: ReportsTableProps) {
  const [reportsData, setReportsData] = useState<Report[]>(reports);
  const [assessmentsData, setAssessmentsData] = useState<Assessment[]>(assessments);
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    reports.length > 0 || assessments.length > 0 ? "success" : "loading"
  );

  // If no reports or assessments were provided, try to fetch them from the public API
  useEffect(() => {
    if (reports.length === 0 && assessments.length === 0) {
      const fetchData = async () => {
        setStatus("loading");
        try {
          // Try to fetch both reports and assessments from the public endpoints
          const [reportsResponse, assessmentsResponse] = await Promise.all([
            fetch('/api/public/reports'),
            fetch('/api/public/assessments')
          ]);
          
          let reportResults: Report[] = [];
          let assessmentResults: Assessment[] = [];
          
          if (reportsResponse.ok) {
            const reportsData = await reportsResponse.json();
            if (Array.isArray(reportsData)) {
              reportResults = reportsData;
            }
          }
          
          if (assessmentsResponse.ok) {
            const assessmentsData = await assessmentsResponse.json();
            if (Array.isArray(assessmentsData)) {
              assessmentResults = assessmentsData;
            }
          }
          
          // Sort reports by generatedAt (most recent first)
          const sortedReports = [...reportResults].sort(
            (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
          );
          
          setReportsData(sortedReports);
          setAssessmentsData(assessmentResults);
          setStatus("success");
        } catch (error) {
          console.error("Error fetching data:", error);
          setStatus("error");
        }
      };
      
      fetchData();
    }
  }, [reports, assessments]);

  const getAssessmentTitle = (assessmentId: number) => {
    const assessment = assessmentsData.find(a => a.id === assessmentId);
    return assessment?.title || `Assessment ID: ${assessmentId}`;
  };

  // Show loading state
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-muted-foreground">Loading reports...</p>
      </div>
    );
  }

  return (
    <Table>
      <TableCaption>A list of your assessment reports.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">ID</TableHead>
          <TableHead>Assessment Title</TableHead>
          <TableHead>Generated At</TableHead>
          {/* TODO: Add Priority Items column based on legacy */}
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reportsData.length > 0 ? (
          reportsData.map((report) => (
            <TableRow key={report.id}>
              <TableCell className="font-medium">{report.id}</TableCell>
              <TableCell>{getAssessmentTitle(report.assessmentId)}</TableCell> 
              <TableCell>{new Date(report.generatedAt).toLocaleString()}</TableCell>
              {/* TODO: Render priority items count */}
              <TableCell className="text-right">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/reports/${report.id}`}>View Report</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="text-center">
              No reports found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
} 