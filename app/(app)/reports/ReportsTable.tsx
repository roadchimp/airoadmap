'use client';

import React from 'react';
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
  const getAssessmentTitle = (assessmentId: number) => {
    const assessment = assessments.find(a => a.id === assessmentId);
    return assessment?.title || `Assessment ID: ${assessmentId}`;
  };

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
  );
} 