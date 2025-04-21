import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard: React.FC = () => {
  const { data: assessments, isLoading } = useQuery({
    queryKey: ["/api/assessments"],
  });
  
  const { data: reports, isLoading: isLoadingReports } = useQuery({
    queryKey: ["/api/reports"],
  });
  
  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to AI Prioritize</h1>
        <p className="text-neutral-600">
          Develop an AI transformation roadmap for your organization by analyzing pain points and prioritizing opportunities.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Assessments</CardTitle>
            <CardDescription>Create or continue an assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? "Loading..." : assessments?.length || 0}
            </div>
            <p className="text-sm text-neutral-500 mt-1">Total assessments</p>
          </CardContent>
          <CardFooter>
            <Link href="/assessment/new">
              <Button className="w-full">
                <span className="material-icons text-sm mr-1">add</span>
                New Assessment
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Generated Reports</CardTitle>
            <CardDescription>View your prioritization reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoadingReports ? "Loading..." : reports?.length || 0}
            </div>
            <p className="text-sm text-neutral-500 mt-1">Total reports</p>
          </CardContent>
          <CardFooter>
            <Link href="/reports">
              <Button variant="outline" className="w-full">
                <span className="material-icons text-sm mr-1">visibility</span>
                View Reports
              </Button>
            </Link>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Libraries</CardTitle>
            <CardDescription>Manage job roles and AI capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-600">
              Customize the role and AI capability libraries to better match your organization's needs.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/library">
              <Button variant="outline" className="w-full">
                <span className="material-icons text-sm mr-1">library_books</span>
                Browse Libraries
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
      
      {reports && reports.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Recent Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.slice(0, 4).map((report) => (
              <Card key={report.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Assessment Report #{report.id}</CardTitle>
                  <CardDescription>
                    Generated on {new Date(report.generatedAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-2">
                  <Link href={`/reports/${report.id}`}>
                    <Button variant="ghost" size="sm">
                      View Report
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      <div className="bg-primary-50 border border-primary-100 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-primary-800 mb-2">Getting Started Guide</h2>
        <p className="text-primary-700 mb-4">
          Follow these steps to create your first AI transformation roadmap:
        </p>
        <ol className="space-y-2 text-sm text-primary-700 list-decimal list-inside">
          <li>Start a new assessment using the wizard</li>
          <li>Input information about key roles and pain points</li>
          <li>Review and confirm your assessment</li>
          <li>Generate a prioritization report</li>
          <li>Share and implement the roadmap with your team</li>
        </ol>
      </div>
    </div>
  );
};

export default Dashboard;
