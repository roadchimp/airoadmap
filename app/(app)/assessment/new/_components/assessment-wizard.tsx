'use client';

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from 'next/navigation'; 
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient"; 
import { queryClient } from "@/lib/queryClient"; 
import { useToast } from "@/hooks/use-toast"; 
import WizardLayout from "@/components/wizard/WizardLayout"; 
import QuestionCard, { QuestionOption } from "@/components/wizard/QuestionCard"; 
import { Department, JobRole, WizardStepData, Assessment, Report } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// --- Interfaces --- (Should ideally be in a types file)
interface WizardStep {
  id: string;
  title: string;
  description: string;
}

// Use Assessment type from schema, make stepData Partial for incremental updates
interface AssessmentState extends Omit<Assessment, 'stepData' | 'id' | 'createdAt'> {
  id?: number; // Keep ID optional until created
  stepData: Partial<WizardStepData>;
  createdAt?: Date; // Make createdAt optional in state
}

// Props for the wizard component
interface AssessmentWizardProps {
  initialAssessmentData?: Assessment | null; // Accept initial data as optional prop
}

// --- Wizard Steps Definition --- 
const wizardSteps: WizardStep[] = [
  { id: "basics", title: "Organization Info", description: "Basic organization information" },
  { id: "roles", title: "Role Selection", description: "Select roles to evaluate" },
  { id: "painPoints", title: "Areas for Improvement", description: "Identify pain points and challenges" },
  { id: "workVolume", title: "Work Volume & Complexity", description: "Assess work patterns" },
  { id: "techStack", title: "Data & Systems", description: "Evaluate technical readiness" },
  { id: "adoption", title: "Readiness & Expectations", description: "Assess adoption readiness" },
  { id: "review", title: "Review & Submit", description: "Review and generate report" }
];

// --- Main Wizard Component --- 
export default function AssessmentWizard({ initialAssessmentData }: AssessmentWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const initialStepIndex = useMemo(() => {
      const stepId = searchParams.get('step');
      if (stepId) {
          const index = wizardSteps.findIndex(step => step.id === stepId);
          return index !== -1 ? index : 0;
      }
      // If no step param, try finding the highest step with data in initialAssessmentData
      if (initialAssessmentData?.stepData) {
        const stepKeys = Object.keys(initialAssessmentData.stepData);
        let highestIndex = 0;
        stepKeys.forEach(key => {
            const index = wizardSteps.findIndex(step => step.id === key);
            if (index > highestIndex) highestIndex = index;
        });
        // If data exists, maybe start user at highest step + 1 (or last step if completed)?
        // For now, let's just return highest index found, or 0
        return highestIndex;
      }
      return 0; // Default to first step
  }, [searchParams, initialAssessmentData]);

  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex);
  // Add state for max reached step, initialize with current
  const [maxReachedStepIndex, setMaxReachedStepIndex] = useState(initialStepIndex);
  
  // --- State --- 
  const [assessment, setAssessment] = useState<AssessmentState>(() => {
      if (initialAssessmentData) {
          return {
              ...initialAssessmentData,
              stepData: initialAssessmentData.stepData || {}, // Ensure stepData is at least an empty object
          };
      } else {
          // Revert back to using 'title' and original fields
          return {
              title: "New AI Transformation Assessment", // Reverted from 'name'
              organizationId: 1, // Placeholder
              userId: 1, // Placeholder
              status: "draft",
              stepData: {},
              updatedAt: new Date(),
      };
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // --- Data Fetching --- 
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
    queryFn: async () => (await apiRequest("GET", "/api/departments")).json(),
  });
  
  const { data: jobRoles = [] } = useQuery<JobRole[]>({
    queryKey: ["/api/job-roles"],
    queryFn: async () => (await apiRequest("GET", "/api/job-roles")).json(),
  });

  // --- Mutations --- 
  const createAssessmentMutation = useMutation({
    mutationFn: async (assessmentData: Omit<AssessmentState, 'id'>) => {
      const response = await apiRequest("POST", "/api/assessments", assessmentData);
      if (!response.ok) throw new Error(await response.text());
      return response.json() as Promise<Assessment>;
    },
    onSuccess: (data) => {
      setAssessment(prev => ({ ...prev, id: data.id, stepData: data.stepData || {} }));
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      toast({
        title: "Assessment created",
        description: "Assessment draft saved.",
      });
      setIsSaving(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error creating assessment", description: error.message, variant: "destructive" });
      setIsSaving(false);
    }
  });
  
  const updateAssessmentStepMutation = useMutation({
    mutationFn: async ({ id, stepData }: { id: number, stepData: Partial<WizardStepData> }) => {
      const response = await apiRequest("PATCH", `/api/assessments/${id}/step`, stepData);
       if (!response.ok) throw new Error(await response.text());
      return response.json() as Promise<Assessment>;
    },
    onSuccess: (data) => {
      setAssessment(prev => ({ ...prev, stepData: data.stepData || {} }));
      queryClient.invalidateQueries({ queryKey: [`/api/assessments/${data.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      toast({ title: "Progress Saved", description: "Your changes have been saved.", duration: 2000 });
      setIsSaving(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error saving progress", description: error.message, variant: "destructive" });
      setIsSaving(false);
    }
  });
  
  const generateReportMutation = useMutation({
    mutationFn: async (assessmentId: number): Promise<Report> => {
       setIsGeneratingReport(true);
      const response = await apiRequest("POST", "/api/prioritize", { assessmentId });
      if (!response.ok) throw new Error(await response.text());
      return response.json() as Promise<Report>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      queryClient.invalidateQueries({ queryKey: [`/api/assessments/${assessment.id}`] });
      toast({ title: "Report Generated", description: "Redirecting to your report..." });
      router.push(`/reports/${data.id}`);
    },
    onError: (error: Error) => {
      toast({ title: "Error generating report", description: error.message, variant: "destructive" });
    },
    onSettled: () => {
      setIsGeneratingReport(false);
    }
  });

  // --- Effects --- 
  // Sync state with URL step parameter AND update maxReachedStepIndex if needed
  useEffect(() => {
    const stepIdFromUrl = searchParams.get('step') || wizardSteps[0].id;
    const indexFromUrl = wizardSteps.findIndex(step => step.id === stepIdFromUrl);
    const validIndex = indexFromUrl !== -1 ? indexFromUrl : 0;

    setCurrentStepIndex(validIndex);
    // Ensure maxReached is at least the current step index upon load/navigation
    setMaxReachedStepIndex(prevMax => Math.max(prevMax, validIndex));

    // --- This effect should ONLY run when the step parameter changes --- 
  }, [searchParams]); // Dependency only on searchParams

  // --- Handlers --- 
  const saveCurrentStep = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    
    const currentStepId = wizardSteps[currentStepIndex].id as keyof WizardStepData;
    // Ensure we have the most recent step data from state
    const stepPayload = { [currentStepId]: assessment.stepData[currentStepId] }; 

    try {
      let currentAssessment = assessment; // Use state directly
      if (!currentAssessment.id) {
        console.log("Attempting to create assessment:", { ...currentAssessment, stepData: stepPayload });
        const created = await createAssessmentMutation.mutateAsync({
            ...currentAssessment, // Use current state
            createdAt: undefined, // Don't send createdAt on create
            stepData: stepPayload 
        });
        // Update local state immediately with returned ID if successful
        // The onSuccess handler for the mutation also updates state, but this can be faster
        if (created) {
            setAssessment(prev => ({ ...prev, id: created.id })); 
        }
      } else {
         console.log("Attempting to update assessment:", assessment.id, stepPayload);
        await updateAssessmentStepMutation.mutateAsync({ 
            id: currentAssessment.id, 
            stepData: stepPayload
        });
      }
    } catch (error) { 
        console.error("Save failed:", error);
         // Let mutation onError handle toast
    } finally {
        // Even if mutation fails, we stop showing saving indicator after attempt
        // Or rely on mutation's onSettled/onError ? For now, let's just stop it here.
        // Reconsider this: maybe onSuccess/onError should handle setIsSaving(false)?
        // For now: let mutation handle it
        // setIsSaving(false); 
    }
  }, [assessment, currentStepIndex, isSaving, createAssessmentMutation, updateAssessmentStepMutation]);

  const handleNext = useCallback(async () => {
    await saveCurrentStep();
    if (currentStepIndex < wizardSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      const nextStepId = wizardSteps[nextIndex].id;
      const basePath = assessment.id ? `/assessment/${assessment.id}` : '/assessment/new';
      router.push(`${basePath}?step=${nextStepId}`);
      // Update max reached index AFTER successful navigation intent
      setMaxReachedStepIndex(prevMax => Math.max(prevMax, nextIndex));
    }
  }, [saveCurrentStep, currentStepIndex, router, assessment.id]);

  const handlePrevious = useCallback(async () => { // Make async
    // Save before going back (logic added previously)
    // Note: The actual saving happens in WizardLayout/ProgressIndicator now
    // We just need to navigate
    if (currentStepIndex > 0) {
      const prevStepId = wizardSteps[currentStepIndex - 1].id;
      const basePath = assessment.id ? `/assessment/${assessment.id}` : '/assessment/new';
      router.push(`${basePath}?step=${prevStepId}`);
      // No need to update maxReachedStepIndex when going back
    }
  }, [currentStepIndex, router, assessment.id]); // Removed saveCurrentStep dependency here
  
  const handleSubmit = useCallback(async () => {
     await saveCurrentStep();
    if (assessment.id) {
        // Mark final step as reached before submitting
        setMaxReachedStepIndex(prevMax => Math.max(prevMax, wizardSteps.length -1));
        generateReportMutation.mutate(assessment.id);
    }
  }, [saveCurrentStep, assessment.id, generateReportMutation]);
  
  // Generic input change handler - deep updates for nested stepData
  const handleInputChange = (path: string, value: any) => {
    setAssessment(prev => {
      const keys = path.split('.');
      const newState = { ...prev };
      let currentLevel: any = newState.stepData;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        // Ensure nested objects exist
        if (currentLevel[key] === undefined || currentLevel[key] === null) {
          currentLevel[key] = {};
        }
        currentLevel = currentLevel[key];
      }
      
      currentLevel[keys[keys.length - 1]] = value;
      return newState;
    });
  };

   // --- Step Rendering Logic --- 
  const renderStepContent = () => {
    const { id: stepId, title, description } = wizardSteps[currentStepIndex];
    const stepData = assessment.stepData || {};

    // Stakeholder options for the key stakeholders field
    const stakeholderOptions = [
      "Executive Leadership",
      "IT Department",
      "Operations",
      "Finance",
      "Human Resources",
      "Sales & Marketing",
      // Add any other relevant options
    ];


    switch (stepId) {
      case "basics":
        return (
          <React.Fragment>
            <h2 className="text-xl font-semibold mb-4 text-slate-900">{title}</h2>
            
            <div className="space-y-6">
              <div className="section-card">
                <h3 className="text-base font-medium mb-3 text-slate-800">What is the name of your organization? <span className="text-red-500">*</span></h3>
                <Input 
                  className="max-w-md border-slate-300 focus:border-primary focus:ring-primary"
                  value={stepData.basics?.companyName || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("basics.companyName", e.target.value)}
                  placeholder="Enter your company name"
                />
              </div>

              <div className="section-card">
                <h3 className="text-base font-medium mb-3 text-slate-800">What industry is your organization in? <span className="text-red-500">*</span></h3>
                <p className="text-sm text-slate-500 mb-4">Select the industry that best matches your organization's primary business activities.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "Software & Technology",
                    "Finance & Banking",
                    "Healthcare",
                    "Retail & E-commerce",
                    "Manufacturing",
                    "Education",
                    "Professional Services", 
                    "Media & Entertainment",
                    "Other"
                  ].map((industry) => (
                    <div 
                      key={industry} 
                      className={`radio-option ${stepData.basics?.industry === industry ? 'selected' : ''}`}
                      onClick={() => handleInputChange("basics.industry", industry)}
                    >
                      <div className="radio-circle">
                        {stepData.basics?.industry === industry && (
                          <div className="radio-circle-dot"></div>
                        )}
                      </div>
                      <span>{industry}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="section-card">
                <h3 className="text-base font-medium mb-3 text-slate-800">What is the size of your organization? <span className="text-red-500">*</span></h3>
                <p className="text-sm text-slate-500 mb-4">Select the option that best describes your organization's size.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { value: "Small (1-50 employees)", label: "Small (1-50 employees)" },
                    { value: "Medium (51-500 employees)", label: "Medium (51-500 employees)" },
                    { value: "Large (501-5000 employees)", label: "Large (501-5000 employees)" },
                    { value: "Enterprise (5000+ employees)", label: "Enterprise (5000+ employees)" }
                  ].map((sizeOption) => (
                    <div 
                      key={sizeOption.value} 
                      className={`radio-option ${stepData.basics?.size === sizeOption.value ? 'selected' : ''}`}
                      onClick={() => handleInputChange("basics.size", sizeOption.value)}
                    >
                      <div className="radio-circle">
                        {stepData.basics?.size === sizeOption.value && (
                          <div className="radio-circle-dot"></div>
                        )}
                      </div>
                      <span>{sizeOption.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="section-card">
                <h3 className="text-base font-medium mb-3 text-slate-800">Primary Goals for AI Transformation</h3>
                <Textarea
                  className="min-h-[100px] border-slate-300 focus:border-primary focus:ring-primary"
                  value={stepData.basics?.goals || ""}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("basics.goals", e.target.value)}
                  placeholder="Describe key objectives, e.g., improve efficiency, enhance customer experience..."
                />
              </div>
              
              <div className="section-card">
                <h3 className="text-base font-medium mb-3 text-slate-800">Key Stakeholders</h3>
                <p className="text-sm text-slate-500 mb-4">Select all departments or roles involved in approving or supporting this AI implementation.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {stakeholderOptions.map((option) => {
                      // Ensure stakeholders is treated as an array
                      const currentStakeholders: string[] = stepData.basics?.stakeholders || [];
                      const isSelected = currentStakeholders.includes(option);  
                            
      
                      return (
                        <div
                          key={option}
                          className={`checkbox-option ${isSelected ? 'selected' : ''}`} // Use appropriate styling
                        >
                          <Checkbox
                            id={`stakeholder-${option.replace(/\s+/g, '-')}`} // Create a unique ID
                            checked={isSelected}
                            onCheckedChange={(checked: boolean | string) => {
                              const wasChecked = checked === true;
                              const currentSelection = stepData.basics?.stakeholders || [];
                              let newSelection;
                              if (wasChecked) {
                                newSelection = [...currentSelection, option];
                              } else {
                                newSelection = currentSelection.filter(s => s !== option);
                              }
                              // Use handleInputChange to update the state
                              handleInputChange("basics.stakeholders", newSelection);
                            }}
                            className="h-4 w-4"
                          />
                          <Label
                            htmlFor={`stakeholder-${option.replace(/\s+/g, '-')}`}
                            className="cursor-pointer flex-1 font-normal text-slate-700"
                          >
                            {option}
                          </Label>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      case "roles":
        // Get the current selections from state, providing defaults
        const selectedDepartments = stepData.roles?.selectedDepartments || [];
        const selectedRoleIds = (stepData.roles?.selectedRoles || []).map(r => r.id).filter(id => id !== undefined) as number[]; // Filter out roles without IDs and ensure type

        // Filter job roles based on selected departments
        const filteredRoles = jobRoles.filter(role => 
            selectedDepartments.some(deptName => {
                const dept = departments.find(d => d.name === deptName);
                return dept && role.departmentId === dept.id;
            })
        );

        // Handler for department selection
        const handleDepartmentChange = (deptName: string, checked: boolean | string) => {
          const currentSelection = selectedDepartments;
          const isChecked = checked === true; 
          const newSelection = isChecked 
            ? [...currentSelection, deptName]
            : currentSelection.filter(d => d !== deptName);
          handleInputChange("roles.selectedDepartments", newSelection);
          
          if (!isChecked) {
            const dept = departments.find(d => d.name === deptName);
            if (dept) {
                const rolesToKeep = (stepData.roles?.selectedRoles || []).filter(role => role.department !== deptName);
                handleInputChange("roles.selectedRoles", rolesToKeep);
            }
          }
        };
        
        // Handler for role selection
        const handleRoleChange = (role: JobRole, checked: boolean | string) => {
          const currentSelection = stepData.roles?.selectedRoles || [];
           const isChecked = checked === true;
          let newSelection;
          if (isChecked) {
             const dept = departments.find(d => d.id === role.departmentId);
             const deptName = dept ? dept.name : 'Unknown Department'; 
            newSelection = [...currentSelection, { 
                id: role.id, 
                title: role.title, 
                department: deptName, 
            }];
          } else {
            newSelection = currentSelection.filter(r => r.id !== role.id);
          }
          handleInputChange("roles.selectedRoles", newSelection);
        };
        
         return (
          <React.Fragment>
            <h2 className="text-xl font-semibold mb-4 text-slate-900">Role Selection</h2>
            <p className="text-slate-600 mb-4">Select roles to evaluate in your assessment</p>
            
            <div className="space-y-6">
             {/* Department Selection */}
            <div className="section-card">
              <h3 className="text-base font-medium mb-4 text-slate-800">Select Departments</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {departments.map((dept) => (
                  <div 
                    key={dept.id} 
                    className={`checkbox-option ${selectedDepartments.includes(dept.name) ? 'selected' : ''}`}
                  >
                    <Checkbox
                      id={`dept-${dept.id}`}
                      checked={selectedDepartments.includes(dept.name)}
                      onCheckedChange={(checked: boolean | string) => handleDepartmentChange(dept.name, checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`dept-${dept.id}`} className="cursor-pointer flex-1 font-normal text-slate-700">
                      {dept.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

             {/* Role Selection */}
            {selectedDepartments.length > 0 && (
              <div className="section-card">
                <h3 className="text-base font-medium mb-4 text-slate-800">Select Roles</h3>
                {filteredRoles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredRoles.map((role) => (
                          <div 
                            key={role.id} 
                            className={`checkbox-option ${(stepData.roles?.selectedRoles || []).some(r => r.id === role.id) ? 'selected' : ''}`}
                          >
                            <Checkbox
                              id={`role-${role.id}`}
                              checked={(stepData.roles?.selectedRoles || []).some(r => r.id === role.id)}
                              onCheckedChange={(checked: boolean | string) => handleRoleChange(role, checked)}
                              className="h-4 w-4"
                            />
                            <Label htmlFor={`role-${role.id}`} className="cursor-pointer flex-1 font-normal text-slate-700">
                              {role.title}
                            </Label>
                          </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">No roles found for the selected department(s).</p>
                )}
              </div>
            )}
          </div>
          </React.Fragment>
        );
      case "painPoints":
        const selectedRoles = stepData.roles?.selectedRoles || [];
         // Ensure painPointsData is correctly typed
        const painPointsData: Partial<WizardStepData['painPoints']> = stepData.painPoints || {};

        return (
          <React.Fragment>
            <h2 className="text-xl font-semibold mb-1">{title}</h2>
            <p className="text-muted-foreground mb-4">{description}</p>
            <div className="space-y-6">
              {selectedRoles.length > 0 ? (
                selectedRoles.map((role) => {
                  // Safe access using role ID
                  const rolePainPoints = painPointsData.roleSpecificPainPoints?.[role.id!];
                  return (
                    <Card key={role.id}> 
                      <CardHeader>
                        <CardTitle>{role.title}</CardTitle>
                        <CardDescription>Describe the primary pain points or challenges for this role.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            className="mt-1"
                            value={rolePainPoints?.description || ""} // Use safely accessed data
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                              handleInputChange(`painPoints.roleSpecificPainPoints.${role.id}.description`, e.target.value)
                            }
                            placeholder={`e.g., Time spent on repetitive tasks, difficulty accessing data...`}
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label>Severity (1-5)</Label>
                            <Input
                              className="mt-1"
                              type="number"
                              min="1"
                              max="5"
                              value={rolePainPoints?.severity || ""} // Use safely accessed data
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                handleInputChange(`painPoints.roleSpecificPainPoints.${role.id}.severity`, parseInt(e.target.value) || undefined)
                              }
                            />
                          </div>
                          <div>
                            <Label>Frequency (1-5)</Label>
                            <Input
                              className="mt-1"
                              type="number"
                              min="1"
                              max="5"
                              value={rolePainPoints?.frequency || ""} // Use safely accessed data
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                handleInputChange(`painPoints.roleSpecificPainPoints.${role.id}.frequency`, parseInt(e.target.value) || undefined)
                              }
                            />
                          </div>
                          <div>
                            <Label>Impact (1-5)</Label>
                            <Input
                              className="mt-1"
                              type="number"
                              min="1"
                              max="5"
                              value={rolePainPoints?.impact || ""} // Use safely accessed data
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                handleInputChange(`painPoints.roleSpecificPainPoints.${role.id}.impact`, parseInt(e.target.value) || undefined)
                              }
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <p className="text-muted-foreground">Please select roles in the previous step to identify pain points.</p>
              )}
              <div>
                <Label>General Organizational Pain Points</Label>
                <Textarea
                  className="mt-1"
                  value={painPointsData.generalPainPoints || ""} // Safe access
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("painPoints.generalPainPoints", e.target.value)}
                  placeholder="Describe any broader challenges not specific to a single role (e.g., communication silos, outdated tools)..."
                />
              </div>
            </div>
          </React.Fragment>
        );
      case "workVolume":
        const wvSelectedRoles = stepData.roles?.selectedRoles || [];
        const workVolumeData: Record<string, { // Explicitly type key as string
          volume?: string;
          complexity?: string;
          repetitiveness?: number;
          notes?: string;
          // Add other fields from schema if necessary
          timeSpent?: string;
          errorRisk?: string;
          isDataDriven?: boolean;
          dataDescription?: string;
          hasPredictiveTasks?: boolean;
          predictiveTasksDescription?: string;
          needsContentGeneration?: boolean;
          contentGenerationDescription?: string;
          decisionComplexity?: string;
        }> = stepData.workVolume?.roleWorkVolume || {}; // Access nested roleWorkVolume

        return (
          <React.Fragment>
            <h2 className="text-xl font-semibold mb-1">{title}</h2>
            <p className="text-muted-foreground mb-4">{description}</p>
            <div className="space-y-6">
              {wvSelectedRoles.length > 0 ? (
                wvSelectedRoles.map((role) => {
                   const roleIdStr = String(role.id!); // Cast ID to string
                   const roleWorkVolume = workVolumeData[roleIdStr] || {}; // Index with string
                  return (
                    <Card key={role.id}>
                      <CardHeader>
                        <CardTitle>{role.title}</CardTitle>
                        <CardDescription>Assess the typical work patterns for this role.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Task Volume</Label>
                            <Select
                              value={roleWorkVolume?.volume || ''} // Use 'volume'
                              onValueChange={(value: string) =>
                                handleInputChange(`workVolume.roleWorkVolume.${roleIdStr}.volume`, value) // Use string index in path
                              }
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select volume..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Task Complexity</Label>
                            <Select
                              value={roleWorkVolume?.complexity || ''} // Use 'complexity'
                               onValueChange={(value: string) =>
                                handleInputChange(`workVolume.roleWorkVolume.${roleIdStr}.complexity`, value) // Use string index in path
                              }
                             >
                               <SelectTrigger className="mt-1">
                                 <SelectValue placeholder="Select complexity..." />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="low">Low</SelectItem>
                                 <SelectItem value="medium">Medium</SelectItem>
                                 <SelectItem value="high">High</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                          <div>
                            <Label>Repetitiveness (1-5)</Label>
                            <Input
                              type="number"
                              min="1"
                              max="5"
                              className="mt-1"
                              value={roleWorkVolume?.repetitiveness || ""} // Use 'repetitiveness'
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleInputChange(`workVolume.roleWorkVolume.${roleIdStr}.repetitiveness`, parseInt(e.target.value) || undefined) // Use string index in path
                              }
                              placeholder="1-5"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Data Description (Optional)</Label> { /* Changed from Notes */}
                          <Textarea
                            className="mt-1"
                            value={roleWorkVolume?.dataDescription || ""} // Use 'dataDescription'
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                              handleInputChange(`workVolume.roleWorkVolume.${roleIdStr}.dataDescription`, e.target.value) // Use string index in path
                            }
                            placeholder="Describe the data used or generated by this role..."
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                 })
              ) : (
                 <p className="text-muted-foreground">Please select roles in the previous steps to assess work volume.</p>
              )}
            </div>
          </React.Fragment>
        );
      case "techStack":
        // Ensure techStackData is correctly typed
        const techStackData: Partial<WizardStepData['techStack']> = stepData.techStack || {};

        return (
          <React.Fragment>
            <h2 className="text-xl font-semibold mb-1">{title}</h2>
            <p className="text-muted-foreground mb-4">{description}</p>
            <div className="space-y-6">
              {/* Data Accessibility Select */}
              <div>
                <Label>Data Accessibility</Label>
                <Select
                  value={techStackData.dataAccessibility || ''}
                  onValueChange={(value: string) => handleInputChange('techStack.dataAccessibility', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select accessibility level..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy (Well-documented, readily available)</SelectItem>
                    <SelectItem value="moderate">Moderate (Requires some effort/cleanup)</SelectItem>
                    <SelectItem value="difficult">Difficult (Siloed, requires significant effort)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Data Quality Select */}
              <div>
                <Label>Data Quality</Label>
                 <Select
                   value={techStackData.dataQuality || ''}
                   onValueChange={(value: string) => handleInputChange('techStack.dataQuality', value)}
                 >
                   <SelectTrigger className="mt-1">
                     <SelectValue placeholder="Select data quality level..." />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="good">Good (Accurate, complete, consistent)</SelectItem>
                     <SelectItem value="fair">Fair (Some inconsistencies or gaps)</SelectItem>
                     <SelectItem value="poor">Poor (Inaccurate, incomplete, unreliable)</SelectItem>
                   </SelectContent>
                 </Select>
              </div>

              {/* Systems Integration Select */}
              <div>
                <Label>Systems Integration</Label>
                 <Select
                   value={techStackData.systemsIntegration || ''}
                   onValueChange={(value: string) => handleInputChange('techStack.systemsIntegration', value)}
                 >
                   <SelectTrigger className="mt-1">
                     <SelectValue placeholder="Select integration ease..." />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="easy">Easy (APIs available, modern systems)</SelectItem>
                     <SelectItem value="moderate">Moderate (Some custom work needed)</SelectItem>
                     <SelectItem value="difficult">Difficult (Legacy systems, lack of APIs)</SelectItem>
                   </SelectContent>
                 </Select>
              </div>

              {/* Relevant Tools Textarea */}
              <div>
                <Label>Relevant Tools & Platforms</Label>
                <Textarea
                  className="mt-1"
                  value={techStackData.relevantTools || ""} // Assuming string for now
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("techStack.relevantTools", e.target.value)}
                  placeholder="List key software, platforms, or databases currently in use (e.g., Salesforce, SAP, Snowflake, internal tools)..."
                />
              </div>

              {/* Notes Textarea */}
              <div>
                <Label>Notes (Optional)</Label>
                 <Textarea
                   className="mt-1"
                   value={techStackData.notes || ""}
                   onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("techStack.notes", e.target.value)}
                   placeholder="Add any other relevant details about the current tech stack or data landscape..."
                 />
              </div>
            </div>
          </React.Fragment>
        );
      case "adoption":
         // Ensure adoptionData is correctly typed
         const adoptionData: Partial<WizardStepData['adoption']> = stepData.adoption || {};

        return (
          <React.Fragment>
            <h2 className="text-xl font-semibold mb-1">{title}</h2>
            <p className="text-muted-foreground mb-4">{description}</p>
            <div className="space-y-6">
               {/* Change Readiness Select */}
               <div>
                 <Label>Organizational Readiness for Change</Label>
                 <Select
                   value={adoptionData.changeReadiness || ''}
                   onValueChange={(value: string) => handleInputChange('adoption.changeReadiness', value)}
                 >
                   <SelectTrigger className="mt-1">
                     <SelectValue placeholder="Select readiness level..." />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="high">High (Proactive, adaptable culture)</SelectItem>
                     <SelectItem value="medium">Medium (Some resistance, needs clear communication)</SelectItem>
                     <SelectItem value="low">Low (Resistant to change, requires significant effort)</SelectItem>
                   </SelectContent>
                 </Select>
               </div>

               {/* Stakeholder Alignment Select */}
               <div>
                 <Label>Stakeholder Alignment on AI Goals</Label>
                 <Select
                   value={adoptionData.stakeholderAlignment || ''}
                   onValueChange={(value: string) => handleInputChange('adoption.stakeholderAlignment', value)}
                 >
                   <SelectTrigger className="mt-1">
                     <SelectValue placeholder="Select alignment level..." />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="high">High (Clear consensus, shared vision)</SelectItem>
                     <SelectItem value="medium">Medium (General agreement, some differing priorities)</SelectItem>
                     <SelectItem value="low">Low (Significant disagreement or lack of clarity)</SelectItem>
                   </SelectContent>
                 </Select>
               </div>

                {/* Training Needs Textarea */}
               <div>
                 <Label>Anticipated Training Needs</Label>
                 <Textarea
                   className="mt-1"
                   value={adoptionData.trainingNeeds || ""}
                   onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("adoption.trainingNeeds", e.target.value)}
                   placeholder="Describe potential training requirements for employees to adopt new AI tools or processes..."
                 />
               </div>

               {/* Expected Challenges Textarea */}
               <div>
                 <Label>Expected Adoption Challenges</Label>
                 <Textarea
                   className="mt-1"
                   value={adoptionData.expectedChallenges || ""}
                   onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("adoption.expectedChallenges", e.target.value)}
                   placeholder="List potential hurdles to successful AI adoption (e.g., technical integration, user resistance, budget constraints)..."
                 />
               </div>

                {/* Success Metrics Textarea */}
               <div>
                 <Label>Key Success Metrics for AI Initiatives</Label>
                 <Textarea
                   className="mt-1"
                   value={adoptionData.successMetrics || ""}
                   onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("adoption.successMetrics", e.target.value)}
                   placeholder="How will the success of AI adoption be measured? (e.g., % time saved, cost reduction, improved quality score)..."
                 />
               </div>
            </div>
          </React.Fragment>
        );
      case "review":
        return (
           <React.Fragment>
             <h2 className="text-xl font-semibold mb-1">{title}</h2>
             <p className="text-muted-foreground mb-4">{description}</p>
             <p className="mb-6">Review and edit the information you entered below before generating the report.</p>

             <div className="space-y-6">
               {/* --- Basics Section --- */}
               <Card>
                 <CardHeader>
                   <CardTitle>Organization Info</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <div>
                        <Label>Organization Name</Label>
                        <Input
                          className="mt-1"
                          value={stepData.basics?.companyName || ""}
                          onChange={(e) => handleInputChange("basics.companyName", e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>Industry</Label>
                        <Select
                           value={stepData.basics?.industry || ''}
                           onValueChange={(v) => handleInputChange("basics.industry", v)}
                         >
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                           <SelectContent>
                             <SelectItem value="Software & Technology">Software & Technology</SelectItem>
                             <SelectItem value="Finance & Banking">Finance & Banking</SelectItem>
                             <SelectItem value="Healthcare">Healthcare</SelectItem>
                             <SelectItem value="Retail & E-commerce">Retail & E-commerce</SelectItem>
                             <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                             <SelectItem value="Education">Education</SelectItem>
                             <SelectItem value="Professional Services">Professional Services</SelectItem>
                             <SelectItem value="Media & Entertainment">Media & Entertainment</SelectItem>
                             <SelectItem value="Other">Other</SelectItem>
                           </SelectContent>
                         </Select>
                    </div>
                    <div>
                        <Label>Organization Size</Label>
                         <Select
                           value={stepData.basics?.size || ''}
                           onValueChange={(v) => handleInputChange("basics.size", v)}
                         >
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                           <SelectContent>
                             <SelectItem value="Small (1-50 employees)">Small (1-50 employees)</SelectItem>
                             <SelectItem value="Medium (51-500 employees)">Medium (51-500 employees)</SelectItem>
                             <SelectItem value="Large (501-5000 employees)">Large (501-5000 employees)</SelectItem>
                             <SelectItem value="Enterprise (5000+ employees)">Enterprise (5000+ employees)</SelectItem>
                           </SelectContent>
                         </Select>
                    </div>
                    <div>
                        <Label>Primary Goals</Label>
                        <Textarea
                          className="mt-1"
                          value={stepData.basics?.goals || ""}
                          onChange={(e) => handleInputChange("basics.goals", e.target.value)}
                         />
                    </div>
                    <div>
                        <Label>Key Stakeholders</Label>
                        <Input
                          className="mt-1"
                          value={(stepData.basics?.stakeholders || []).join(", ")}
                          onChange={(e) => handleInputChange("basics.stakeholders", e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                          placeholder="e.g., CEO, Head of Dept, IT Director"
                         />
                         <p className="text-xs text-muted-foreground mt-1">Edit the list using comma separation.</p>
                    </div>
                 </CardContent>
               </Card>

                {/* --- Role Selection Section --- */}
               <Card>
                 <CardHeader>
                   <CardTitle>Selected Roles</CardTitle>
                   <CardDescription>Roles included in this assessment.</CardDescription>
                 </CardHeader>
                 <CardContent>
                   {(stepData.roles?.selectedRoles || []).length > 0 ? (
                     <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                       {(stepData.roles?.selectedRoles || []).map(role => (
                         <li key={role.id}>{role.title} ({role.department})</li>
                       ))}
                     </ul>
                   ) : (
                     <p className="text-sm text-muted-foreground">No roles selected.</p>
                   )}
                   <p className="text-xs text-muted-foreground mt-2">To change selected roles, please navigate back to the 'Role Selection' step.</p>
                 </CardContent>
               </Card>

               {/* --- Pain Points Section --- */}
               <Card>
                 <CardHeader>
                   <CardTitle>Areas for Improvement</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div>
                       <Label>General Organizational Pain Points</Label>
                       <Textarea
                         className="mt-1"
                         value={stepData.painPoints?.generalPainPoints || ""}
                         onChange={(e) => handleInputChange("painPoints.generalPainPoints", e.target.value)}
                       />
                   </div>
                   {(stepData.roles?.selectedRoles || []).map((role) => {
                     const rolePP = stepData.painPoints?.roleSpecificPainPoints?.[role.id!] || {};
                     return (
                       <div key={role.id} className="border-t pt-4 mt-4">
                         <h4 className="font-medium text-sm mb-2">{role.title} Pain Points</h4>
                         <div>
                           <Label>Description</Label>
                           <Textarea
                             className="mt-1"
                             value={rolePP.description || ""}
                             onChange={(e) => handleInputChange(`painPoints.roleSpecificPainPoints.${role.id}.description`, e.target.value)}
                           />
                         </div>
                         <div className="grid grid-cols-3 gap-4 mt-2">
                            <div>
                                <Label>Severity (1-5)</Label>
                                <Input className="mt-1" type="number" min="1" max="5" value={rolePP.severity || ""} onChange={(e) => handleInputChange(`painPoints.roleSpecificPainPoints.${role.id}.severity`, parseInt(e.target.value) || undefined)} />
                           </div>
                           <div>
                               <Label>Frequency (1-5)</Label>
                               <Input className="mt-1" type="number" min="1" max="5" value={rolePP.frequency || ""} onChange={(e) => handleInputChange(`painPoints.roleSpecificPainPoints.${role.id}.frequency`, parseInt(e.target.value) || undefined)} />
                           </div>
                           <div>
                               <Label>Impact (1-5)</Label>
                               <Input className="mt-1" type="number" min="1" max="5" value={rolePP.impact || ""} onChange={(e) => handleInputChange(`painPoints.roleSpecificPainPoints.${role.id}.impact`, parseInt(e.target.value) || undefined)} />
                           </div>
                         </div>
                       </div>
                     );
                   })}
                 </CardContent>
               </Card>

                {/* --- Work Volume Section --- */}
               <Card>
                 <CardHeader>
                    <CardTitle>Work Volume & Complexity</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                     {(stepData.roles?.selectedRoles || []).map((role) => {
                         const roleIdStr = String(role.id!); 
                         const roleWV = stepData.workVolume?.roleWorkVolume?.[roleIdStr] || {}; 
                         return (
                             <div key={role.id} className="border-t pt-4 mt-4">
                                 <h4 className="font-medium text-sm mb-2">{role.title} Work Patterns</h4>
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                     <div>
                                         <Label>Task Volume</Label>
                                         <Select value={roleWV.volume || ''} onValueChange={(v) => handleInputChange(`workVolume.roleWorkVolume.${roleIdStr}.volume`, v)}>
                                             <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                                             <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
                                         </Select>
                                     </div>
                                     <div>
                                         <Label>Task Complexity</Label>
                                          <Select value={roleWV.complexity || ''} onValueChange={(v) => handleInputChange(`workVolume.roleWorkVolume.${roleIdStr}.complexity`, v)}>
                                              <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                                              <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
                                          </Select>
                                     </div>
                                     <div>
                                         <Label>Repetitiveness (1-5)</Label>
                                          <Input 
                                            type="number" 
                                            min="1" 
                                            max="5" 
                                            value={roleWV.repetitiveness || ""} 
                                            onChange={(e) => handleInputChange(`workVolume.roleWorkVolume.${roleIdStr}.repetitiveness`, parseInt(e.target.value) || undefined)}
                                            className="mt-1"
                                            placeholder="1-5"
                                           />
                                     </div>
                                 </div>
                                 <div className="mt-4">
                                     <Label>Data Description</Label>
                                      <Textarea className="mt-1" value={roleWV.dataDescription || ""} onChange={(e) => handleInputChange(`workVolume.roleWorkVolume.${roleIdStr}.dataDescription`, e.target.value)} />
                                 </div>
                             </div>
                         );
                     })}
                 </CardContent>
               </Card>

                {/* --- Tech Stack Section --- */}
               <Card>
                 <CardHeader>
                   <CardTitle>Data & Systems</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <div>
                        <Label>Data Accessibility</Label>
                        <Select value={stepData.techStack?.dataAccessibility || ''} onValueChange={(v) => handleInputChange('techStack.dataAccessibility', v)}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                            <SelectContent><SelectItem value="easy">Easy</SelectItem><SelectItem value="moderate">Moderate</SelectItem><SelectItem value="difficult">Difficult</SelectItem></SelectContent>
                        </Select>
                    </div>
                     <div>
                         <Label>Data Quality</Label>
                         <Select value={stepData.techStack?.dataQuality || ''} onValueChange={(v) => handleInputChange('techStack.dataQuality', v)}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                            <SelectContent><SelectItem value="good">Good</SelectItem><SelectItem value="fair">Fair</SelectItem><SelectItem value="poor">Poor</SelectItem></SelectContent>
                         </Select>
                    </div>
                     <div>
                         <Label>Systems Integration</Label>
                         <Select value={stepData.techStack?.systemsIntegration || ''} onValueChange={(v) => handleInputChange('techStack.systemsIntegration', v)}>
                             <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                            <SelectContent><SelectItem value="easy">Easy</SelectItem><SelectItem value="moderate">Moderate</SelectItem><SelectItem value="difficult">Difficult</SelectItem></SelectContent>
                         </Select>
                     </div>
                    <div>
                        <Label>Relevant Tools & Platforms</Label>
                        <Textarea className="mt-1" value={stepData.techStack?.relevantTools || ""} onChange={(e) => handleInputChange("techStack.relevantTools", e.target.value)} />
                    </div>
                    <div>
                        <Label>Notes</Label>
                        <Textarea className="mt-1" value={stepData.techStack?.notes || ""} onChange={(e) => handleInputChange("techStack.notes", e.target.value)} />
                    </div>
                 </CardContent>
               </Card>

               {/* --- Adoption Section --- */}
               <Card>
                 <CardHeader>
                   <CardTitle>Readiness & Expectations</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                     <div>
                         <Label>Organizational Readiness for Change</Label>
                         <Select value={stepData.adoption?.changeReadiness || ''} onValueChange={(v) => handleInputChange('adoption.changeReadiness', v)}>
                             <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                            <SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
                         </Select>
                     </div>
                      <div>
                         <Label>Stakeholder Alignment on AI Goals</Label>
                         <Select value={stepData.adoption?.stakeholderAlignment || ''} onValueChange={(v) => handleInputChange('adoption.stakeholderAlignment', v)}>
                              <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                             <SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
                         </Select>
                     </div>
                      <div>
                         <Label>Anticipated Training Needs</Label>
                         <Textarea className="mt-1" value={stepData.adoption?.trainingNeeds || ""} onChange={(e) => handleInputChange("adoption.trainingNeeds", e.target.value)} />
                     </div>
                      <div>
                         <Label>Expected Adoption Challenges</Label>
                         <Textarea className="mt-1" value={stepData.adoption?.expectedChallenges || ""} onChange={(e) => handleInputChange("adoption.expectedChallenges", e.target.value)} />
                     </div>
                    <div>
                         <Label>Key Success Metrics for AI Initiatives</Label>
                         <Textarea className="mt-1" value={stepData.adoption?.successMetrics || ""} onChange={(e) => handleInputChange("adoption.successMetrics", e.target.value)} />
                     </div>
                 </CardContent>
               </Card>

             </div>
           </React.Fragment>
        );
      default:
        return <div>Unknown Step</div>;
    }
  };

  // --- Render ---
  if (!wizardSteps[currentStepIndex]) {
    return <div>Loading step...</div>;
  }

  return (
    <WizardLayout
      title={assessment.title || "Assessment"}
      steps={wizardSteps}
      currentStepIndex={currentStepIndex}
      totalSteps={wizardSteps.length}
      onNext={handleNext}
      onPrevious={handlePrevious}
      isSaving={isSaving}
      isSubmitting={isGeneratingReport}
      onSubmit={currentStepIndex === wizardSteps.length - 1 ? handleSubmit : undefined}
      assessmentId={assessment.id}
      onSaveBeforeNavigate={saveCurrentStep}
      maxReachedStepIndex={maxReachedStepIndex}
    >
      {renderStepContent()}
    </WizardLayout>
  );
} 