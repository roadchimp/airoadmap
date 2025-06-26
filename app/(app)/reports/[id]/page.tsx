import React from 'react';
import { storage } from '@/server/storage';
import ReportView from '@/components/report/ReportView';
import { notFound } from 'next/navigation';

export default async function ReportPage({ params }: { params: { id: string } }) {
  const reportId = parseInt(params.id, 10);

  if (isNaN(reportId)) {
    notFound();
  }

  const report = await storage.getReport(reportId);

  if (!report) {
    notFound();
  }

  return <ReportView report={report} />;
} 