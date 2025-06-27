import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/client/queryClient";
import { queryClient } from "@/lib/client/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ReportView from "@/components/report/ReportView";
import { Report, Assessment } from "@shared/schema";

const ReportDetails: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const reportId = parseInt(params.id || "");
  
  // Fetch report data
  const { 
    data: report, 
    isLoading: isLoadingReport,
    error: reportError
  } = useQuery<Report>({
    queryKey: [`/api/reports/${reportId}`],
    enabled: !isNaN(reportId),
  });
  
  // Fetch assessment data if report is available
  const { 
    data: assessment,
    isLoading: isLoadingAssessment
  } = useQuery<Assessment>({
    queryKey: [`/api/assessments/${report?.assessmentId}`],
    enabled: !!report?.assessmentId,
  });
  
  // Update commentary mutation
  const updateCommentary = useMutation({
    mutationFn: async ({ id, commentary }: { id: number, commentary: string }) => {
      const response = await apiRequest("PATCH", `/api/reports/${id}/commentary`, { commentary });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Commentary updated",
        description: "Your commentary has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/reports/${reportId}`] });
    },
    onError: (error) => {
      toast({
        title: "Error updating commentary",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle commentary update
  const handleUpdateCommentary = (commentary: string) => {
    if (report) {
      updateCommentary.mutateAsync({ id: report.id, commentary });
    }
  };
  
  // Loading state
  if (isLoadingReport || isLoadingAssessment) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card className="mb-8">
          <CardContent className="py-10 text-center">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading report...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Error state
  if (reportError || !report) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card className="mb-8">
          <CardContent className="py-10 text-center">
            <span className="material-icons text-4xl text-red-500 mb-2">error_outline</span>
            <h3 className="text-lg font-medium mb-2">Report Not Found</h3>
            <p className="text-neutral-500 mb-6">
              The report you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => navigate("/reports")}>Back to Reports</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Prepare report data for the ReportView component
  const reportData = {
    ...report,
    title: assessment?.title || `AI Transformation Report #${report.id}`,
    generatedAt: new Date(report.generatedAt),
    executiveSummary: report.executiveSummary || "",
    prioritizationData: report.prioritizationData as any,
    aiSuggestions: report.aiSuggestions as any,
    performanceImpact: report.performanceImpact as any,
    consultantCommentary: report.consultantCommentary || ""
  };
  
  return (
    <>
      <ReportView
        report={reportData}
        onUpdateCommentary={handleUpdateCommentary}
        isEditable={true}
      />
    </>
  );
};

export default ReportDetails;
