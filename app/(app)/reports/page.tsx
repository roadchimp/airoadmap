import React from 'react';
import Link from 'next/link';
import { storage } from '@/server/storage';
import { Report, Assessment } from '@shared/schema'; // Import Assessment type too
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

// TODO: Integrate authentication to fetch reports for the current user/org
// TODO: Modify to fetch associated assessment data if needed for title
async function getReportsAndAssessments(): Promise<{ reports: Report[], assessments: Assessment[] }> {
  try {
    // Fetch reports using the correct method
    const reports = await storage.listReports() || [];
    // Fetch all assessments to map titles (inefficient, ideally fetch only related)
    // TODO: Optimize this - fetch only assessments related to the reports
    const assessments = await storage.listAssessments() || []; 
    return {
      reports: Array.isArray(reports) ? reports : [],
      assessments: Array.isArray(assessments) ? assessments : []
    };
  } catch (error) {
    console.error("Error fetching reports/assessments:", error);
    return { reports: [], assessments: [] }; // Return empty on error
  }
}

export default async function ReportsPage() {
  const { reports, assessments } = await getReportsAndAssessments();

  const getAssessmentTitle = (assessmentId: number) => {
    const assessment = assessments.find(a => a.id === assessmentId);
    return assessment?.title || `Assessment ID: ${assessmentId}`;
  };

  return (
    <div className="container mx-auto py-8">
       <h1 className="text-2xl font-bold mb-2">Assessment Reports</h1>
       <p className="text-muted-foreground mb-6">View your generated AI transformation assessment reports.</p>

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
          {reports.length > 0 ? (
            reports.map((report) => (
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
    </div>
  );
} 