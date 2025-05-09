'use client';

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Assessment, AssessmentResponse, WizardStepData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// The wizard steps from the original wizard
const wizardSteps = [
  { id: "basics", title: "Organization Info", description: "Basic organization information" },
  { id: "roles", title: "Role Selection", description: "Select roles to evaluate" },
  { id: "painPoints", title: "Areas for Improvement", description: "Identify pain points and challenges" },
  { id: "workVolume", title: "Work Volume & Complexity", description: "Assess work patterns" },
  { id: "techStack", title: "Data & Systems", description: "Evaluate technical readiness" },
  { id: "adoption", title: "Readiness & Expectations", description: "Assess adoption readiness" },
];

interface AssessmentViewerProps {
  assessment: Assessment;
  responses: AssessmentResponse[];
}

export default function AssessmentViewer({ assessment, responses }: AssessmentViewerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("basics");
  
  // Type assertion for stepData to avoid TypeScript errors
  const typedStepData = assessment.stepData as Record<string, any> || {};

  // Get roles data safely with type assertion
  const roles = typedStepData.roles?.selectedRoles as Array<{id: number, title: string, department: string}> || [];

  // Debug output 
  useEffect(() => {
    console.log("Assessment loaded:", assessment);
    console.log("Responses loaded:", responses);
    console.log("Typed step data:", typedStepData);
  }, [assessment, responses, typedStepData]);

  // Function to go back to the assessments list
  const handleBackClick = () => {
    router.push("/assessment/current");
  };

  // Helper function to find role by ID more safely
  const findRoleById = (roleId: string | number): {id: number, title: string, department: string} | undefined => {
    const roleIdNum = typeof roleId === 'string' ? parseInt(roleId) : roleId;
    const role = roles.find(r => r.id === roleIdNum);
    return role;
  };

  // Organize responses by step
  const responsesByStep = responses.reduce((acc, response) => {
    const [stepId] = response.questionIdentifier.split('.');
    if (!acc[stepId]) {
      acc[stepId] = [];
    }
    acc[stepId].push(response);
    return acc;
  }, {} as Record<string, AssessmentResponse[]>);

  // Function to render responses based on step
  const renderStepResponses = (stepId: string) => {
    const stepResponses = responsesByStep[stepId] || [];
    const stepData = typedStepData[stepId] || {};
    
    // If no responses and no step data, show a message
    if (!stepResponses.length && Object.keys(stepData).length === 0) {
      return (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No data available for this step.</p>
          </CardContent>
        </Card>
      );
    }

    // Render based on step ID
    switch (stepId) {
      case "basics":
        return renderBasicsStep(stepData);
      case "roles":
        return renderRolesStep(stepData);
      case "painPoints":
        return renderPainPointsStep(stepData);
      case "workVolume":
        return renderWorkVolumeStep(stepData);
      case "techStack":
        return renderTechStackStep(stepData);
      case "adoption":
        return renderAdoptionStep(stepData);
      default:
        return (
          <Card>
            <CardContent className="pt-6">
              <pre className="text-sm overflow-auto bg-gray-50 p-4 rounded">
                {JSON.stringify(stepData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        );
    }
  };

  // Render functions for each step (simplified for now)
  const renderBasicsStep = (stepData: any) => {
    if (!stepData) return <p>No data available</p>;
    
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <h3 className="font-medium">Company Name</h3>
            <p>{stepData.companyName || "Not provided"}</p>
          </div>
          <div>
            <h3 className="font-medium">Assessment Name</h3>
            <p>{stepData.reportName || "Not provided"}</p>
          </div>
          <div>
            <h3 className="font-medium">Industry</h3>
            <p>{stepData.industry || "Not provided"}</p>
          </div>
          <div>
            <h3 className="font-medium">Size</h3>
            <p>{stepData.size || "Not provided"}</p>
          </div>
          <div>
            <h3 className="font-medium">Goals</h3>
            <p>{stepData.goals || "Not provided"}</p>
          </div>
          <div>
            <h3 className="font-medium">Stakeholders</h3>
            <ul className="list-disc pl-5">
              {(stepData.stakeholders || []).map((stakeholder: string, index: number) => (
                <li key={index}>{stakeholder}</li>
              ))}
            </ul>
            {!stepData.stakeholders?.length && <p>None specified</p>}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderRolesStep = (stepData: any) => {
    if (!stepData) return <p>No data available</p>;
    
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <h3 className="font-medium">Selected Departments</h3>
            <ul className="list-disc pl-5">
              {(stepData.selectedDepartments || []).map((dept: string, index: number) => (
                <li key={index}>{dept}</li>
              ))}
            </ul>
            {!stepData.selectedDepartments?.length && <p>None selected</p>}
          </div>
          <div>
            <h3 className="font-medium">Selected Roles</h3>
            <ul className="list-disc pl-5">
              {(stepData.selectedRoles || []).map((role: any, index: number) => (
                <li key={index}>{role.title} ({role.department})</li>
              ))}
            </ul>
            {!stepData.selectedRoles?.length && <p>None selected</p>}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPainPointsStep = (stepData: any) => {
    if (!stepData) return <p>No data available</p>;
    
    return (
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div>
            <h3 className="font-medium">General Pain Points</h3>
            <p className="mt-1">{stepData.generalPainPoints || "None provided"}</p>
          </div>
          
          {stepData.roleSpecificPainPoints && Object.keys(stepData.roleSpecificPainPoints).length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Role-Specific Pain Points</h3>
              {Object.entries(stepData.roleSpecificPainPoints).map(([roleId, painPoint]: [string, any]) => {
                const roleIdNum = parseInt(roleId);
                const role = findRoleById(roleIdNum);
                return (
                  <Card key={roleId} className="mb-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{role?.title || `Role ID: ${roleId}`}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <h4 className="text-sm font-medium">Description</h4>
                        <p className="text-sm">{painPoint.description || "Not provided"}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <h4 className="text-sm font-medium">Severity</h4>
                          <p className="text-sm">{painPoint.severity || "N/A"}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Frequency</h4>
                          <p className="text-sm">{painPoint.frequency || "N/A"}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Impact</h4>
                          <p className="text-sm">{painPoint.impact || "N/A"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Simplified implementation for other step renderers
  const renderWorkVolumeStep = (stepData: any) => {
    if (!stepData) return <p>No data available</p>;
    
    return (
      <Card>
        <CardContent className="pt-6">
          {stepData.roleWorkVolume && Object.keys(stepData.roleWorkVolume).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(stepData.roleWorkVolume).map(([roleId, volume]: [string, any]) => {
                const roleIdNum = parseInt(roleId);
                const role = findRoleById(roleIdNum);
                return (
                  <Card key={roleId} className="mb-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{role?.title || `Role ID: ${roleId}`}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <h4 className="text-sm font-medium">Volume</h4>
                          <p className="text-sm">{volume.volume || "N/A"}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Complexity</h4>
                          <p className="text-sm">{volume.complexity || "N/A"}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Repetitiveness</h4>
                          <p className="text-sm">{volume.repetitiveness || "N/A"}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Data Description</h4>
                        <p className="text-sm">{volume.dataDescription || "Not provided"}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p>No work volume data provided</p>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderTechStackStep = (stepData: any) => {
    if (!stepData) return <p>No data available</p>;
    
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <h3 className="font-medium">Data Accessibility</h3>
            <p>{stepData.dataAccessibility || "Not provided"}</p>
          </div>
          <div>
            <h3 className="font-medium">Data Quality</h3>
            <p>{stepData.dataQuality || "Not provided"}</p>
          </div>
          <div>
            <h3 className="font-medium">Systems Integration</h3>
            <p>{stepData.systemsIntegration || "Not provided"}</p>
          </div>
          <div>
            <h3 className="font-medium">Relevant Tools & Platforms</h3>
            <p>{stepData.relevantTools || "Not provided"}</p>
          </div>
          <div>
            <h3 className="font-medium">Notes</h3>
            <p>{stepData.notes || "Not provided"}</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAdoptionStep = (stepData: any) => {
    if (!stepData) return <p>No data available</p>;
    
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <h3 className="font-medium">Change Readiness</h3>
            <p>{stepData.changeReadiness || "Not provided"}</p>
          </div>
          <div>
            <h3 className="font-medium">Stakeholder Alignment</h3>
            <p>{stepData.stakeholderAlignment || "Not provided"}</p>
          </div>
          <div>
            <h3 className="font-medium">Training Needs</h3>
            <p>{stepData.trainingNeeds || "Not provided"}</p>
          </div>
          <div>
            <h3 className="font-medium">Expected Challenges</h3>
            <p>{stepData.expectedChallenges || "Not provided"}</p>
          </div>
          <div>
            <h3 className="font-medium">Success Metrics</h3>
            <p>{stepData.successMetrics || "Not provided"}</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="sm" onClick={handleBackClick}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assessments
        </Button>
        <h1 className="text-2xl font-semibold">{assessment.title}</h1>
      </div>

      <Tabs defaultValue="basics" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="mb-4">
          <select 
            className="w-full p-2 border rounded-md bg-white"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
          >
            {wizardSteps.map((step) => (
              <option key={step.id} value={step.id}>
                {step.title}
              </option>
            ))}
          </select>
        </div>

        {wizardSteps.map((step) => (
          <TabsContent key={step.id} value={step.id} className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">{step.title}</h2>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
            {renderStepResponses(step.id)}
          </TabsContent>
        ))}
      </Tabs>

      {/* Report Button */}
      {assessment.status === 'completed' && (
        <div className="mt-8 flex justify-end">
          <Button 
            onClick={async () => {
              try {
                // First try to find report by assessment ID
                const response = await fetch(`/api/reports?assessmentId=${assessment.id}`);
                
                if (!response.ok) {
                  throw new Error(`Error fetching report: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (data && data.reports && data.reports.length > 0) {
                  // Report found, navigate to it
                  router.push(`/reports/${data.reports[0].id}`);
                } else {
                  // No report found, show message
                  toast({
                    title: "No report found",
                    description: "The report for this assessment was not found. It may still be generating.",
                    variant: "destructive",
                  });
                }
              } catch (error) {
                console.error("Error finding report:", error);
                toast({
                  title: "Error finding report",
                  description: "There was an error finding the report for this assessment.",
                  variant: "destructive",
                });
              }
            }} 
            className="bg-green-600 hover:bg-green-700"
          >
            View Report
          </Button>
        </div>
      )}
    </div>
  );
} 