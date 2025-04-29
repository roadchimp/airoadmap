import React from 'react';
import { notFound } from 'next/navigation';
import { storage } from '@/server/storage'; 
import { Report, Assessment, HeatmapData, PrioritizedItem, AISuggestion, PerformanceImpact, ValueLevel, EffortLevel, PriorityLevel } from '@shared/schema'; // Import Assessment type
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // No longer needed directly
// Import ReportView instead
import ReportView from '@/components/report/ReportView'; // Assuming @/components resolves correctly
// import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/layout/PageHeader'; // Removed - Component not found

interface ReportDetailPageProps {
  params: { id: string };
}

// Fetch Report and associated Assessment
async function getReportData(id: number): Promise<{ report: Report | null, assessment: Assessment | null }> {
  let report: Report | null = null;
  let assessment: Assessment | null = null;
  try {
    // Use correct storage method
    report = await storage.getReport(id) || null;
    if (report) {
      // Fetch assessment if report exists
      assessment = await storage.getAssessment(report.assessmentId) || null;
    }
  } catch (error) {
    console.error(`Error fetching report data for ${id}:`, error);
    // Don't nullify report/assessment if only one fetch failed, let caller handle
  }
  return { report, assessment };
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const reportId = parseInt(params.id, 10);
  if (isNaN(reportId)) {
    notFound(); 
  }

  const { report, assessment } = await getReportData(reportId);

  if (!report) {
    notFound(); // If report fetch failed or report not found
  }
  
  // TODO: Check user permissions for this report/assessment

  // Define default structures based on schema types
  // Needs refinement based on actual ValueLevel/EffortLevel/PriorityLevel types if possible
  // For now, create an empty matrix structure
  const defaultHeatmapMatrix = {} as HeatmapData['matrix']; // Simplified default
  const defaultHeatmap: HeatmapData = { matrix: defaultHeatmapMatrix };
  
  const defaultPrioritizationData: { heatmap: HeatmapData; prioritizedItems: PrioritizedItem[] } = { 
    heatmap: defaultHeatmap, 
    prioritizedItems: [] 
  };
  const defaultAISuggestions: AISuggestion[] = [];
  const defaultPerformanceImpact: PerformanceImpact = { roleImpacts: [], estimatedRoi: 0 };

  // Prepare props for ReportView, ensuring types match
  const reportViewProps = {
    title: assessment?.title || `Assessment ${report.assessmentId}`,
    generatedAt: report.generatedAt, 
    executiveSummary: report.executiveSummary || "",
    prioritizationData: (report.prioritizationData as { heatmap: HeatmapData; prioritizedItems: PrioritizedItem[] } | null) || defaultPrioritizationData,
    aiSuggestions: (report.aiSuggestions as AISuggestion[] | null) || defaultAISuggestions,
    performanceImpact: (report.performanceImpact as PerformanceImpact | null) || defaultPerformanceImpact, 
    consultantCommentary: report.consultantCommentary || "",
    isEditable: false, 
    onUpdateCommentary: undefined, 
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="mb-6">
         <h1 className="text-2xl font-bold">
           Report for {assessment?.title || `Assessment ${report.assessmentId}`}
          </h1>
          <p className="text-muted-foreground">
            Generated on {new Date(report.generatedAt).toLocaleString()}
          </p>
      </div>

      {/* TODO: Replace JSON previews with ReportView component */}
       {/* Executive Summary */}
      <ReportView {...reportViewProps} />

      {/* Prioritization Data (Basic Preview) */}
      <ReportView {...reportViewProps} />

       {/* AI Suggestions (Basic Preview) */}
       <ReportView {...reportViewProps} />

       {/* Performance Impact (Basic Preview) */}
       <ReportView {...reportViewProps} />

        {/* Consultant Commentary */}
        <ReportView {...reportViewProps} />

    </div>
  );
} 