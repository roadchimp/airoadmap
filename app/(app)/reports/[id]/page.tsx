'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import ReportView from '@/components/report/ReportView';
import { notFound } from 'next/navigation';

export default function ReportPage() {
  const params = useParams<{ id: string }>();
  const [report, setReport] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const reportId = parseInt(params.id, 10);

  React.useEffect(() => {
    if (isNaN(reportId)) {
      setIsLoading(false);
      return;
    }
    
    async function fetchData() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/reports/${reportId}`);
        if (!response.ok) throw new Error('Failed to fetch report');
        const data = await response.json();
        setReport(data.report);
      } catch (error) {
        console.error(error);
        setReport(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [reportId]);

  if (isNaN(reportId)) {
    return notFound();
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!report) {
    return notFound();
  }

  return <ReportView report={report} />;
}
