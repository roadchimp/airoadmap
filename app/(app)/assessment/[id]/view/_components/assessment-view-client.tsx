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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Assessment, WizardStepData, JobRole, Department } from "@shared/schema"

interface AssessmentViewClientProps {
  assessment: Assessment;
  reportId?: number;
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

type SuccessMetric = {
  name: string;
}

type KeyMetric = {
  name: string;
}

export default function AssessmentViewClient({ assessment, reportId }: AssessmentViewClientProps) {
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

  const stepData = assessment.stepData as WizardStepData;

  // Properly typed roles data
  const rolesData = stepData.roles as RolesData | undefined;

  const getRoleName = (roleId: number | string | undefined): string => {
    if (roleId === undefined || roleId === null) {
      return 'Unknown Role';
    }
    const roleIdNum = typeof roleId === 'string' ? parseInt(roleId, 10) : roleId;
    // Handle NaN case
    if (isNaN(roleIdNum)) {
      return `Invalid Role: ${roleId}`;
    }

    const role = rolesData?.selectedRoles?.find((r: JobRole) => r.id === roleIdNum);
    return role?.title ?? `Role ID: ${roleId}`;
  };

  // Helper function to safely render arrays with proper keys
  const renderArray = <T,>(
    items: T[] | T | undefined,
    renderItem: (item: T, index: number) => React.ReactNode,
    getKey: (item: T, index: number) => string | number,
    fallbackKey?: string
  ): React.ReactNode => {
    if (!items) return null;
    
    if (Array.isArray(items)) {
      return items.map((item, index) => {
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

    } else {
      const key = fallbackKey || 'single-item';
      return (
        <React.Fragment key={key}>
          {renderItem(items, 0)}
        </React.Fragment>
      );
    }
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
                (stakeholder: string) => <li>{stakeholder}</li>,
                (stakeholder: string, index: number) => `stakeholder-${index}-${stakeholder}`,
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
                'single-department'
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
                'single-role'
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
                Object.entries(stepData.painPoints.roleSpecificPainPoints).map(([roleId, painPoint], index) => (
                  <div key={roleId ? `pain-point-${roleId}` : `pain-point-fallback-${index}`} className="p-4 border border-gray-200 rounded-lg">
                    <h5 className="font-medium text-gray-800 mb-2">{getRoleName(roleId)}</h5>
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
                ))
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
            Object.entries(stepData.workVolume.roleWorkVolume).map(([roleId, item], index) => (
              <div key={roleId ? `work-volume-${roleId}` : `work-volume-fallback-${index}`} className="p-4 border border-gray-200 rounded-lg">
                <h5 className="font-medium text-gray-800 mb-3">{getRoleName(roleId)}</h5>
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
            ))
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Current Systems</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {renderArray(
                  stepData.techStack?.currentSystems,
                  (system: CurrentSystem) => <li>{system.name}</li>,
                  (system: CurrentSystem, index: number) => `system-${index}-${system.name}`,
                  'single-system'
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Data Quality</h4>
              <p className="text-gray-600">{stepData.techStack?.dataQuality}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Integration Challenges</h4>
              <p className="text-gray-600">{stepData.techStack?.integrationChallenges}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Security Requirements</h4>
              <p className="text-gray-600">{stepData.techStack?.securityRequirements}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "readiness",
      title: "Readiness & Expectations",
      description: "Timeline and expectations",
      icon: CheckCircleIcon,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Timeline Expectation</h4>
              <p className="text-gray-600">{stepData.adoption?.timelineExpectation}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Budget Range</h4>
              <p className="text-gray-600">{stepData.adoption?.budgetRange}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Risk Tolerance</h4>
              <p className="text-gray-600">{stepData.adoption?.riskTolerance}</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Success Metrics</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              {renderArray(
                stepData.adoption?.successMetrics,
                (metric: SuccessMetric) => <li>{metric.name}</li>,
                (metric: SuccessMetric, index: number) => `success-metric-${index}-${metric.name}`,
                'single-metric'
              )}
            </ul>
          </div>
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
                stepData.roiTargets?.primaryGoals,
                (goal: string) => (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {goal}
                  </span>
                ),
                (goal: string, index: number) => `goal-${index}-${goal}`,
                'single-goal'
              )}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Key Metrics</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              {renderArray(
                stepData.roiTargets?.keyMetrics,
                (metric: KeyMetric) => <li>{metric.name}</li>,
                (metric: KeyMetric, index: number) => `key-metric-${index}-${metric.name}`,
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
            {reportId && (
              <Button variant="outline" asChild>
                <Link href={`/reports/${reportId}`} className="flex items-center">
                  <FileTextIcon className="w-4 h-4 mr-2" />
                  View Report
                </Link>
              </Button>
            )}
            <Button onClick={handlePrint}>Export Assessment</Button>
          </div>
        </div>
      </main>
    </div>
  )
} 