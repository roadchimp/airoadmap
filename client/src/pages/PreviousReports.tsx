import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Report, Assessment } from "@shared/schema";

const PreviousReports: React.FC = () => {
  // Fetch reports and assessments
  const { data: reports = [], isLoading: isLoadingReports } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });
  
  const { data: assessments = [], isLoading: isLoadingAssessments } = useQuery<Assessment[]>({
    queryKey: ["/api/assessments"],
  });
  
  // Get assessment titles for the reports
  const getAssessmentTitle = (assessmentId: number) => {
    const assessment = assessments.find(a => a.id === assessmentId);
    return assessment?.title || `Assessment #${assessmentId}`;
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };
  
  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Previous Reports</h1>
          <p className="text-neutral-600">
            View and manage your AI transformation roadmap reports
          </p>
        </div>
        <Link to="/assessment/new">
          <Button>
            <span className="material-icons text-sm mr-1">add</span>
            New Assessment
          </Button>
        </Link>
      </div>
      
      {/* Loading state */}
      {(isLoadingReports || isLoadingAssessments) && (
        <Card className="mb-8">
          <CardContent className="py-10 text-center">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading your reports...</p>
          </CardContent>
        </Card>
      )}
      
      {/* Empty state */}
      {!isLoadingReports && !isLoadingAssessments && reports.length === 0 && (
        <Card className="mb-8">
          <CardContent className="py-10 text-center">
            <span className="material-icons text-4xl text-neutral-400 mb-2">description</span>
            <h3 className="text-lg font-medium mb-2">No Reports Yet</h3>
            <p className="text-neutral-500 mb-6">
              Complete an assessment to generate your first AI transformation roadmap.
            </p>
            <Link to="/assessment/new">
              <Button>Start New Assessment</Button>
            </Link>
          </CardContent>
        </Card>
      )}
      
      {/* Reports table */}
      {!isLoadingReports && !isLoadingAssessments && reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI Transformation Reports</CardTitle>
            <CardDescription>
              View and manage your generated AI transformation roadmaps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report ID</TableHead>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Generated Date</TableHead>
                  <TableHead>Priority Items</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  // Get the number of high priority items
                  const prioritizationData = report.prioritizationData as any;
                  const highPriorityCount = prioritizationData?.prioritizedItems?.filter(
                    (item: any) => item.priority === "high"
                  ).length || 0;
                  
                  return (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">#{report.id}</TableCell>
                      <TableCell>{getAssessmentTitle(report.assessmentId)}</TableCell>
                      <TableCell>{formatDate(report.generatedAt.toString())}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full mr-2">
                            {highPriorityCount} High Priority
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/reports/${report.id}`}>
                          <Button variant="outline" size="sm">
                            <span className="material-icons text-sm mr-1">visibility</span>
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PreviousReports;
