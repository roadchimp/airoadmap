"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BuildingIcon,
  UsersIcon,
  TargetIcon,
  BarChart3Icon,
  DatabaseIcon,
  CheckCircleIcon,
  DollarSignIcon,
  FileTextIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Assessment, WizardStepData, JobRole, Department } from "@shared/schema"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import type {
  FullAICapability,
  ReportWithMetricsAndRules,
  ToolWithMappedCapabilities,
} from "@/server/storage"

interface AssessmentViewClientProps {
  assessment: any // Replace with a more specific type if available
  report: ReportWithMetricsAndRules | null
  capabilities: FullAICapability[]
  tools: ToolWithMappedCapabilities[]
}

// Properly type the roles data structure
type RolesData = {
  selectedDepartments?: Department[];
  selectedRoles?: JobRole[];
  prioritizedRoles?: number[];
}

type WorkVolumeItem = {
  roleId: number | string;
  volume: string;
  complexity: string;
  repetitiveness: number;
  dataDescription: string;
}

type CurrentSystem = {
  name: string;
}

// Helper to parse consolidated text fields
const parseConsolidatedText = (text: string | undefined, key: string): string => {
  if (!text) return 'N/A';
  const match = text.match(new RegExp(`${key}: (.*?)(?:\n|$)`));
  return match ? match[1].trim() : 'N/A';
};

// Reusable UI components for displaying info
const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => {
  // Safely convert value to string, handling objects
  const safeStringValue = React.useMemo(() => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
      return value.map(item => {
        if (typeof item === 'object' && item !== null && 'name' in item && typeof item.name === 'string') {
          return item.name;
        }
        return String(item);
      }).join(', ');
    }
    if (typeof value === 'object' && value !== null && 'name' in value && typeof (value as any).name === 'string') {
      return (value as any).name;
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }, [value]);

  return (
    <div>
      <h4 className="font-medium text-gray-800 mb-1">{label}</h4>
      <p className="text-gray-600 break-words">{safeStringValue}</p>
    </div>
  );
};

const InfoList = ({ label, items }: { label: string; items: any[] }) => {
  const safeItems = React.useMemo(() => {
    if (!items || !Array.isArray(items)) return ['N/A'];
    return items.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null && 'name' in item && typeof item.name === 'string') return item.name;
      return String(item);
    }).filter(Boolean);
  }, [items]);

  return (
    <div>
      <h4 className="font-medium text-gray-800 mb-2">{label}</h4>
      <ul className="list-disc list-inside text-gray-600 space-y-1">
        {safeItems.length > 0 ? safeItems.map((item, index) => (
          <li key={`${label}-${index}-${item}`}>{item}</li>
        )) : <li>N/A</li>}
      </ul>
    </div>
  );
};

// Local helper functions as they are not exported from scoring-ui
const getPriorityColor = (valueScore: number) => {
  if (valueScore > 75) return "bg-[#e84c2b]"
  if (valueScore > 50) return "bg-[#f8a97a]"
  return "bg-gray-500"
}

const getPriorityLabel = (valueScore: number) => {
  if (valueScore > 75) return "High"
  if (valueScore > 50) return "Medium"
  return "Low"
}

export default function AssessmentViewClient({
  assessment,
  report,
  capabilities,
  tools,
}: AssessmentViewClientProps) {
  const [openSections, setOpenSections] = useState<string[]>([
    "organization",
    "roles",
    "improvements",
    "workVolume",
    "dataSystems",
    "readiness",
    "roi",
  ])

  const toggleSection = (section: string) => {
    setOpenSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }
  
  const handlePrint = () => {
    window.print();
  }

  const handleRegenerate = async () => {
    if (!assessment?.id) {
      console.error("No assessment ID available to regenerate.");
      alert("Error: Missing assessment ID.");
      return;
    }

    try {
      const response = await fetch(`/api/assessment/${assessment.id}/regenerate`, {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        alert("Report regeneration started successfully. Please check the logs for progress.");
      } else {
        console.error("Failed to start report regeneration:", result);
        alert(`Error: ${result.error || 'An unknown error occurred.'}`);
      }
    } catch (error) {
      console.error("Error calling regenerate endpoint:", error);
      alert("An unexpected error occurred while trying to regenerate the report.");
    }
  };

  const stepData = assessment.stepData as WizardStepData;

  // Properly typed roles data - check multiple possible locations
  const rolesData = (stepData.roles || (stepData as any).roleSelection) as RolesData | undefined;
  
  // Debug logging to understand data structure
  console.log('Assessment stepData:', stepData);
  console.log('Roles data:', rolesData);
  console.log('Selected roles:', rolesData?.selectedRoles);
  console.log('Roles detailed:', assessment.rolesDetailed);
  console.log('Full assessment object:', assessment);

  const getRoleName = (roleId: number | string | undefined): string => {
    if (roleId === undefined || roleId === null) {
      return 'Unknown Role';
    }
    const roleIdNum = typeof roleId === 'string' ? parseInt(roleId, 10) : roleId;
    // Handle NaN case
    if (isNaN(roleIdNum)) {
      return `Invalid Role: ${roleId}`;
    }

    // Try to find the role in selectedRoles first
    let role = rolesData?.selectedRoles?.find((r: JobRole) => r.id === roleIdNum);
    if (role?.title) {
      return role.title;
    }
    
    // Fallback to rolesDetailed from the assessment
    role = assessment.rolesDetailed?.find((r: JobRole) => r.id === roleIdNum);
    if (role?.title) {
      return role.title;
    }
    
    // If we still can't find the role name, return a generic label
    return `Role ${roleIdNum}`;
  };

  // Helper function to safely render arrays with proper keys
  const renderArray = <T,>(
    items: T[] | T | undefined,
    renderItem: (item: T, index: number) => React.ReactNode,
    getKey: (item: T, index: number) => string | number,
    fallbackKey?: string,
    isListContext: boolean = true
  ): React.ReactNode => {
    if (!items) return isListContext ? <li>N/A</li> : null;
    
    // Ensure we're working with an array
    const itemsArray = Array.isArray(items) ? items : [items];
    
    // Filter out any invalid items
    const validItems = itemsArray.filter(item => 
      item !== null && item !== undefined
    );
    
    if (validItems.length === 0) {
      return isListContext ? <li>N/A</li> : null;
    }
    
    return validItems.map((item, index) => {
      // Generate a more robust key
      let key = getKey(item, index);
      
      // Handle undefined/null keys
      if (key === undefined || key === null || key === '') {
        key = `${fallbackKey || 'item'}-${index}`;
      }
      
      // Ensure key is always a string
      const finalKey = String(key);
      
      return (
        <React.Fragment key={finalKey}>
          {renderItem(item, index)}
        </React.Fragment>
      );
    });
  };

  const sections = [
    {
      id: "organization",
      title: "Organization Info",
      description: "Basic organization information",
      icon: BuildingIcon,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Company Name</h4>
              <p className="text-gray-600">{stepData.basics?.companyName}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Assessment Name</h4>
              <p className="text-gray-600">{assessment.title}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Industry</h4>
              <p className="text-gray-600">{stepData.basics?.industry}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Size</h4>
              <p className="text-gray-600">{stepData.basics?.size}</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Goals</h4>
            <p className="text-gray-600">{stepData.basics?.goals}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Stakeholders</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              {renderArray(
                stepData.basics?.stakeholders,
                (stakeholder: any) => (
                  <li>{typeof stakeholder === 'string' ? stakeholder : (stakeholder && typeof stakeholder === 'object' && 'name' in stakeholder ? stakeholder.name : JSON.stringify(stakeholder))}</li>
                ),
                (stakeholder: any, index: number) => `stakeholder-${index}-${typeof stakeholder === 'string' ? stakeholder : (stakeholder && typeof stakeholder === 'object' && 'name' in stakeholder ? stakeholder.name : index)}`,
                'single-stakeholder'
              )}
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "roles",
      title: "Role Selection",
      description: "Select roles to evaluate",
      icon: UsersIcon,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Selected Departments</h4>
            <div className="flex flex-wrap gap-2">
              {renderArray(
                rolesData?.selectedDepartments,
                (dept: Department) => (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {dept.name}
                  </span>
                ),
                (dept: Department, index: number) => dept.id ? `dept-${dept.id}` : `dept-fallback-${index}`,
                'single-department',
                false
              )}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Selected Roles</h4>
            <div className="space-y-3">
              {renderArray(
                rolesData?.selectedRoles,
                (role: JobRole) => (
                  <div className="p-3 border border-gray-200 rounded-lg">
                    <h5 className="font-medium text-gray-800">{role.title}</h5>
                    <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                  </div>
                ),
                (role: JobRole, index: number) => role.id ? `role-${role.id}` : `role-fallback-${index}`,
                'single-role',
                false
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "improvements",
      title: "Areas for Improvement",
      description: "Identify pain points and challenges",
      icon: TargetIcon,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">General Pain Points</h4>
            <p className="text-gray-600">{stepData.painPoints?.generalPainPoints}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-3">Role-Specific Pain Points</h4>
            <div className="space-y-4">
              {stepData.painPoints?.roleSpecificPainPoints && 
                Object.entries(stepData.painPoints.roleSpecificPainPoints).map(([roleId, painPoint], index) => {
                  const roleName = getRoleName(roleId);
                  return (
                    <div key={roleName ? `pain-point-${roleName.replace(/\s+/g, '-').toLowerCase()}` : `pain-point-fallback-${index}`} className="p-4 border border-gray-200 rounded-lg">
                      <h5 className="font-medium text-gray-800 mb-2">{roleName}</h5>
                      <p className="text-gray-600 mb-3">{painPoint.description}</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <h6 className="font-medium text-gray-500">Severity</h6>
                          <p className="text-gray-800 font-semibold">{painPoint.severity}</p>
                        </div>
                        <div>
                          <h6 className="font-medium text-gray-500">Frequency</h6>
                          <p className="text-gray-800 font-semibold">{painPoint.frequency}</p>
                        </div>
                        <div>
                          <h6 className="font-medium text-gray-500">Impact</h6>
                          <p className="text-gray-800 font-semibold">{painPoint.impact}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "workVolume",
      title: "Work Volume & Complexity",
      description: "Assess work patterns",
      icon: BarChart3Icon,
      content: (
        <div className="space-y-4">
          {stepData.workVolume?.roleWorkVolume && 
            Object.entries(stepData.workVolume.roleWorkVolume).map(([roleId, item], index) => {
              const roleName = getRoleName(roleId);
              return (
              <div key={roleName ? `work-volume-${roleName.replace(/\s+/g, '-').toLowerCase()}` : `work-volume-fallback-${index}`} className="p-4 border border-gray-200 rounded-lg">
                <h5 className="font-medium text-gray-800 mb-3">{roleName}</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h6 className="font-medium text-gray-500">Volume</h6>
                    <p className="text-gray-800 font-semibold capitalize">{item.volume}</p>
                  </div>
                  <div>
                    <h6 className="font-medium text-gray-500">Complexity</h6>
                    <p className="text-gray-800 font-semibold capitalize">{item.complexity}</p>
                  </div>
                  <div>
                    <h6 className="font-medium text-gray-500">Repetitiveness</h6>
                    <p className="text-gray-800 font-semibold">{item.repetitiveness}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <h6 className="font-medium text-gray-500 text-sm">Data Description</h6>
                  <p className="text-gray-600 text-sm mt-1">{item.dataDescription}</p>
                </div>
              </div>
              );
            })
          }
        </div>
      ),
    },
    {
      id: "dataSystems",
      title: "Data & Systems",
      description: "Current technology landscape",
      icon: DatabaseIcon,
      content: (
        <div className="space-y-6">
          {/* Data & Systems */}
          <Card>
            <CardHeader>
              <CardTitle>Data & Systems</CardTitle>
              <CardDescription>Current technology landscape</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <InfoItem label="Current Systems" value={stepData.techStack?.currentSystems as any} />
              <InfoItem label="Data Quality" value={stepData.techStack?.dataQuality} />
              <InfoItem label="Integration Challenges" value={parseConsolidatedText(stepData.techStack?.relevantTools, 'Integration Challenges')} />
              <InfoItem label="Security Requirements" value={parseConsolidatedText(stepData.techStack?.relevantTools, 'Security Requirements')} />
              <InfoItem label="Data Accessibility" value={stepData.techStack?.dataAvailability?.[0]} />
              <InfoItem label="Systems Integration" value={stepData.techStack?.existingAutomation} />
            </CardContent>
          </Card>

          {/* Readiness & Expectations */}
          <Card>
            <CardHeader>
              <CardTitle>Readiness & Expectations</CardTitle>
              <CardDescription>Timeline and expectations</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <InfoItem label="Timeline Expectation" value={parseConsolidatedText(stepData.adoption?.anticipatedTrainingNeeds, 'Timeline')} />
              <InfoItem label="Budget Range" value={parseConsolidatedText(stepData.adoption?.anticipatedTrainingNeeds, 'Budget')} />
              <InfoItem label="Risk Tolerance" value={parseConsolidatedText(stepData.adoption?.anticipatedTrainingNeeds, 'Risk Tolerance')} />
              <InfoItem label="Organizational Readiness" value={parseConsolidatedText(stepData.adoption?.expectedAdoptionChallenges, 'Organizational Readiness')} />
              <InfoItem label="Stakeholder Alignment" value={parseConsolidatedText(stepData.adoption?.expectedAdoptionChallenges, 'Stakeholder Alignment')} />
              <InfoList label="Success Metrics" items={stepData.adoption?.successMetrics as string[] || []} />
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "roi",
      title: "ROI Targets",
      description: "Expected return on investment",
      icon: DollarSignIcon,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Expected ROI</h4>
              <p className="text-gray-600">{stepData.roiTargets?.expectedROI}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Time to Value</h4>
              <p className="text-gray-600">{stepData.roiTargets?.timeToValue}</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Primary Goals</h4>
            <div className="flex flex-wrap gap-2">
              {renderArray(
                (stepData.roiTargets?.primaryGoals || []).filter((g): g is string => !!g),
                (goal: string) => (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {goal}
                  </span>
                ),
                (goal: string, index: number) => `goal-${index}-${goal}`,
                'single-goal',
                false
              )}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Key Metrics</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              {renderArray(
                stepData.roiTargets?.keyMetrics,
                (metric: string) => <li>{metric}</li>,
                (metric: string, index: number) => `key-metric-${index}-${metric}`,
                'single-roi-metric'
              )}
            </ul>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/90">
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/assessment/current" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Assessments
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{assessment.title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Generated on {new Date(assessment.updatedAt).toLocaleString()} {" "}
              <span className="font-semibold text-gray-700">{stepData.basics?.companyName}</span>
            </p>
          </div>

          <div className="space-y-4">
            {sections.map((section) => (
              <Collapsible key={section.id} open={openSections.includes(section.id)} onOpenChange={() => toggleSection(section.id)}>
                <Card className="overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <div className="flex flex-row items-center justify-between p-4 cursor-pointer bg-white hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <section.icon className="w-6 h-6 text-blue-700" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-gray-800">{section.title}</CardTitle>
                          <p className="text-sm text-gray-500">{section.description}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="pointer-events-none">
                        {openSections.includes(section.id) ? (
                          <ChevronUpIcon className="w-5 h-5" />
                        ) : (
                          <ChevronDownIcon className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="p-6 pt-0">
                      {section.content}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>

          <div className="mt-8 flex justify-end gap-3">
            {report && (
              <Button variant="outline" asChild>
                <Link href={`/reports/${report.id}`} className="flex items-center">
                  <FileTextIcon className="w-4 h-4 mr-2" />
                  View Report
                </Link>
              </Button>
            )}
            <Button onClick={handlePrint}>Export Assessment</Button>
            <Button onClick={handleRegenerate} variant="secondary" className="text-white">Re-generate Report</Button>
          </div>
        </div>
      </main>
    </div>
  )
} 