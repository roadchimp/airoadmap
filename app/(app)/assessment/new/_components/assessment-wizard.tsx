'use client';

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from 'next/navigation'; 
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient"; 
import { queryClient } from "@/lib/queryClient"; 
import { useToast } from "@/hooks/use-toast"; 
import WizardLayout from "@/components/wizard/WizardLayout"; 
import QuestionCard, { QuestionOption } from "@/components/wizard/QuestionCard"; 
import { Department, JobRole, WizardStepData, Assessment, Report, industryMaturityEnum, companyStageEnum, insertAssessmentSchema, wizardStepDataSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Path } from "react-hook-form"; // Import Path
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// --- Interfaces --- (Should ideally be in a types file)
interface WizardStep {
  id: string;
  title: string;
  description: string;
}

// Updated AssessmentState to include new dedicated fields as optional
interface AssessmentState extends Omit<Assessment, 'stepData' | 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'userId' | 'title' | 'status' | 'industry' | 'industryMaturity' | 'companyStage' | 'strategicFocus' | 'aiAdoptionScoreInputs' > { // Omit all direct Assessment fields that will be re-added as optional or handled
  id?: number;
  title?: string; // Already there, but ensure it's optional if can be missing initially
  organizationId?: number;
  userId?: number;
  status?: Assessment['status']; // Use enum type
  stepData: Partial<WizardStepData>;
  createdAt?: Date | string; // Allow string for initial JSON parse, Date for DB
  updatedAt?: Date | string;

  // New dedicated fields (optional as they might not be set initially in state)
  industry?: Assessment['industry'];
  industryMaturity?: Assessment['industryMaturity'];
  companyStage?: Assessment['companyStage'];
  strategicFocus?: Assessment['strategicFocus'];
  aiAdoptionScoreInputs?: Assessment['aiAdoptionScoreInputs'];
}

// Props for the wizard component
interface AssessmentWizardProps {
  initialAssessmentData?: Assessment | null; // Accept initial data as optional prop
}

// Define the expected payload structure for the API when creating an assessment
interface CreateAssessmentApiPayload {
  basics: WizardStepData['basics']; // Ensured 'basics' is correctly typed
  stepData: Partial<WizardStepData>;
  organizationId?: number;
  userId?: number;
  // Add other top-level fields the API might expect, like aiAdoptionScoreInputs, if relevant at creation
}

// --- Wizard Steps Definition --- 
const wizardSteps: WizardStep[] = [
  { id: "basics", title: "Organization Info", description: "Basic organization information" },
  { id: "roles", title: "Role Selection", description: "Select roles to evaluate" },
  { id: "painPoints", title: "Areas for Improvement", description: "Identify pain points and challenges" },
  { id: "workVolume", title: "Work Volume & Complexity", description: "Assess work patterns" },
  { id: "techStack", title: "Data & Systems", description: "Evaluate technical readiness" },
  { id: "adoption", title: "Readiness & Expectations", description: "Assess adoption readiness" },
  { id: "aiAdoptionScoreInputs", title: "ROI Targets", description: "Provide inputs for AI Adoption Score calculation" },
  { id: "review", title: "Review & Submit", description: "Review and generate report" }
];

// Helper functions for client-side caching
const CACHE_KEY_PREFIX = 'ai_assessment_wizard_';

const saveToLocalCache = (assessmentId: number | undefined, stepData: Partial<WizardStepData>) => {
  if (!assessmentId) return; // Only cache if we have an ID
  try {
    localStorage.setItem(`${CACHE_KEY_PREFIX}${assessmentId}`, JSON.stringify(stepData));
    console.log('Saved assessment data to local cache');
  } catch (e) {
    console.error('Failed to save assessment data to cache:', e);
  }
};

const getFromLocalCache = (assessmentId: number | undefined): Partial<WizardStepData> | null => {
  if (!assessmentId) return null;
  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${assessmentId}`);
    if (cached) {
      console.log('Retrieved assessment data from local cache');
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error('Failed to retrieve assessment data from cache:', e);
  }
  return null;
};

const mapAssessmentToWizardData = (assessment: Assessment & { organization?: { name?: string, size?: string, industry?: string } }): Partial<WizardStepData> => {
  return {
    basics: {
      companyName: assessment.organization?.name || "",
      reportName: assessment.title || "",
      industry: assessment.industry || assessment.organization?.industry || "", // Prioritize assessment.industry
      size: assessment.organization?.size || "",
      goals: (assessment as any).goals || "", // Assuming goals might be on assessment or needs casting
      stakeholders: (assessment as any).stakeholders || [], // Assuming stakeholders might be on assessment
      industryMaturity: assessment.industryMaturity || undefined,
      companyStage: assessment.companyStage || undefined,
    },
    // ... other steps mapping
  };
};

// --- Main Wizard Component --- 
export default function AssessmentWizard({ initialAssessmentData }: AssessmentWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Add a loading state for step transitions
  const [isTransitioning, setIsTransitioning] = useState(false);
  
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
  
  // Add a state to track validation errors
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Moved useForm to the top level of the component
  const form = useForm<WizardStepData>({
    resolver: zodResolver(wizardStepDataSchema),
    defaultValues: initialAssessmentData
      ? mapAssessmentToWizardData(initialAssessmentData)
      : {
          basics: {
            companyName: "",
            reportName: "",
            industry: "",
            size: "",
            goals: "",
            stakeholders: [],
            industryMaturity: undefined,
            companyStage: undefined,
          },
          roles: {
            selectedDepartments: [],
            selectedRoles: [],
          },
          painPoints: { roleSpecificPainPoints: {}, generalPainPoints: "" },
          workVolume: { roleWorkVolume: {} },
          techStack: { 
            currentSystems: "", 
            dataAvailability: [], 
            existingAutomation: "", 
            dataQuality: undefined, // Assuming this might be a select, hence undefined default
            dataQualityIssues: "",
            approvals: "",
            dataAccessibility: undefined, // Assuming select
            systemsIntegration: undefined, // Assuming select
            relevantTools: "",
            notes: ""
          },
          adoption: { // Defaults for fields defined in wizardStepDataSchema.adoption
            roleAdoption: {},
            changeReadiness: undefined, // Assuming select
            stakeholderAlignment: undefined, // Assuming select
            expectedChallenges: "",
            successMetrics: "",
            trainingNeeds: "",
          },
          scores: { // `scores` is a top-level key in WizardStepData, not under adoption
            assessmentScores: undefined // Or an initial empty AssessmentScores object if defined
          },
          aiAdoptionScoreInputs: {
            adoptionRateForecast: 80,
            timeSavingsPerUserHours: 7,
            affectedUserCount: 120,
            costEfficiencyGainsAmount: 25000,
            performanceImprovementPercentage: 30,
            toolSprawlReductionScore: 4
          },
        },
  });

  const [assessment, setAssessment] = useState<AssessmentState>(() => {
    if (initialAssessmentData) {
      const mappedData = mapAssessmentToWizardData(initialAssessmentData);
      // Ensure stepData in the initial state is fully populated or defaults correctly
      const defaultFormValues = form.getValues(); // Get defaults including all steps
      const initialStepData: Partial<WizardStepData> = {
        ...defaultFormValues, // Start with all default step structures
        ...mappedData       // Override with mapped data from initialAssessmentData
      };
      if (mappedData.basics) initialStepData.basics = mappedData.basics; // Ensure basics is specifically from mappedData if present
      // ... ensure other steps are also correctly merged if necessary

      return {
        id: initialAssessmentData.id,
        title: initialAssessmentData.title,
        organizationId: initialAssessmentData.organizationId,
        userId: initialAssessmentData.userId,
        status: initialAssessmentData.status,
        stepData: initialStepData, // Use the merged initial step data
        createdAt: initialAssessmentData.createdAt,
        updatedAt: initialAssessmentData.updatedAt,
        industry: initialAssessmentData.industry,
        industryMaturity: initialAssessmentData.industryMaturity,
        companyStage: initialAssessmentData.companyStage,
        strategicFocus: initialAssessmentData.strategicFocus,
        aiAdoptionScoreInputs: initialAssessmentData.aiAdoptionScoreInputs,
      };
    } else {
      return {
        title: "New AI Transformation Assessment",
        stepData: form.getValues(), // Initialize with all default form values
      };
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Add a state for strategicFocus, which is stored at the assessment level, not in stepData
  const [strategicFocus, setStrategicFocus] = useState<string[]>(
    initialAssessmentData?.strategicFocus || []
  );

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
    // Updated mutationFn to accept the new CreateAssessmentApiPayload type
    mutationFn: async (payloadForApi: CreateAssessmentApiPayload) => {
      const response = await apiRequest("POST", "/api/assessments", payloadForApi);
      if (!response.ok) throw new Error(await response.text());
      return response.json() as Promise<Assessment>;
    },
    onSuccess: (createdDbAssessment) => {
      setAssessment(prev => ({ 
        ...prev,
        id: createdDbAssessment.id,
        title: createdDbAssessment.title,
        organizationId: createdDbAssessment.organizationId,
        userId: createdDbAssessment.userId,
        status: createdDbAssessment.status,
        industry: createdDbAssessment.industry,
        industryMaturity: createdDbAssessment.industryMaturity,
        companyStage: createdDbAssessment.companyStage,
        strategicFocus: createdDbAssessment.strategicFocus,
        aiAdoptionScoreInputs: createdDbAssessment.aiAdoptionScoreInputs,
        stepData: (createdDbAssessment.stepData as Partial<WizardStepData>) || { basics: form.getValues().basics }, 
        createdAt: createdDbAssessment.createdAt, 
        updatedAt: createdDbAssessment.updatedAt,
      }));
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
    mutationFn: async ({ id, stepData, strategicFocus }: { id: number, stepData: Partial<WizardStepData>, strategicFocus?: string[] }) => {
      const response = await apiRequest("PATCH", `/api/assessments/${id}/step`, { 
        ...stepData,
        strategicFocus
      });
       if (!response.ok) throw new Error(await response.text());
      return response.json() as Promise<Assessment>;
    },
    onSuccess: (data) => {
      setAssessment(prev => ({ 
        ...prev, 
        stepData: data.stepData || {},
        strategicFocus: data.strategicFocus || prev.strategicFocus 
      }));
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
    mutationFn: async (assessmentId: number) => {
      console.log("Generating report for assessment:", assessmentId);
      setIsGeneratingReport(true); // Set generation loading state
      const res = await fetch(`/api/reports/assessment/${assessmentId}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to generate report");
      const data = await res.json();
      return data.reportId;
    },
    onSuccess: (reportId) => {
      console.log("Report generated:", reportId);
      setIsGeneratingReport(false); // Clear generation loading state
      
      // Immediately redirect to the report page - don't wait for any confirmation
      // This is critical for reducing perceived latency, as report generation continues in the background
      console.log(`Redirecting to report ${reportId} immediately...`);
      
      // Force a hard navigation instead of client-side routing for more reliability
      window.location.href = `/reports/${reportId}`;
    },
    onError: (error) => {
      console.error("Failed to generate report:", error);
      setIsGeneratingReport(false); // Clear generation loading state
      toast({
        title: "Error generating report",
        description: "Please try again. If the problem persists, contact support.",
        variant: "destructive",
      });
    },
  });

  // --- Effects ---
  
  // Effect to load from local cache when assessment ID becomes available
  useEffect(() => {
    if (assessment.id) {
      const cachedData = getFromLocalCache(assessment.id);
      if (cachedData) {
        // Only update if we have data in the cache that's not already in state
        setAssessment(prev => {
          // Merge cached data with existing state, preferring state data if it exists
          const mergedStepData = { ...cachedData, ...prev.stepData };
          if (JSON.stringify(mergedStepData) !== JSON.stringify(prev.stepData)) {
            console.log('Updating assessment with cached data');
            return { ...prev, stepData: mergedStepData };
          }
          return prev;
        });
      }
    }
  }, [assessment.id]);
  
  // Effect to save to local cache when step data changes
  useEffect(() => {
    if (assessment.id && Object.keys(assessment.stepData).length > 0) {
      saveToLocalCache(assessment.id, assessment.stepData);
    }
  }, [assessment.stepData, assessment.id]);
  
  // Effect to handle prefetching data for the next step
  useEffect(() => {
    const currentStepId = wizardSteps[currentStepIndex]?.id;
    
    if (currentStepId === 'painPoints') {
      const selectedRoles = assessment.stepData.roles?.selectedRoles || [];
      
      console.log('Pain Points Step - Current selected roles:', selectedRoles);
      console.log('Current assessment state:', assessment);
      
      if (selectedRoles.length > 0) {
        setAssessment(prev => {
          const newStepData = JSON.parse(JSON.stringify(prev.stepData)); // Deep clone

          if (!newStepData.painPoints) {
            newStepData.painPoints = { roleSpecificPainPoints: {}, generalPainPoints: '' };
          } else if (!newStepData.painPoints.roleSpecificPainPoints) {
            newStepData.painPoints.roleSpecificPainPoints = {};
          }

          let painPointsUpdated = false;
          const currentRolePainPoints = newStepData.painPoints.roleSpecificPainPoints;

          // Verify what's already in the pain points state
          console.log('Current pain points state:', currentRolePainPoints);

          selectedRoles.forEach(role => {
            // Use string ID as the key for consistency
            const roleId = role.id?.toString() || '';
            console.log(`Processing role ${role.title} with ID ${roleId}`);
            
            if (roleId && !currentRolePainPoints[roleId]) {
              // Create new entry with the string key
              currentRolePainPoints[roleId] = {
                description: '',
                severity: undefined, 
                frequency: undefined,
                impact: undefined
              };
              painPointsUpdated = true;
              console.log(`Added pain points structure for role ${role.title} with ID ${roleId}`);
            } else if (roleId) {
              console.log(`Pain points structure already exists for role ${role.title} with ID ${roleId}`);
            }
          });

          console.log('Updated pain points data:', newStepData.painPoints);

          if (painPointsUpdated) {
            console.log('Returning updated pain points state');
            return { ...prev, stepData: newStepData };
          }
          
          // Always return the previous state if no updates were made to avoid returning undefined
          console.log('No pain points updates needed');
          return prev; 
        });
      }
      // It's also useful to clear pain points if NO roles are selected, 
      // but only if painPoints data actually exists to avoid unnecessary updates.
      // else if (selectedRoles.length === 0 && assessment.stepData.painPoints?.roleSpecificPainPoints) {
      //   setAssessment(prev => {
      //     const newStepData = JSON.parse(JSON.stringify(prev.stepData));
      //     if (newStepData.painPoints) { // Ensure painPoints object exists
      //       newStepData.painPoints.roleSpecificPainPoints = {}; // Clear role-specific points
      //       return { ...prev, stepData: newStepData };
      //     }
      //     return prev;
      //   });
      // }
    }
  }, [currentStepIndex, assessment.stepData.roles?.selectedRoles, wizardSteps]); // Track the entire selectedRoles array

  // Sync state with URL step parameter AND update maxReachedStepIndex if needed
  // This useEffect was likely misplaced in the previous diff, ensure it's at the correct scope level.
  useEffect(() => {
    const stepIdFromUrl = searchParams.get('step') || wizardSteps[0].id;
    const indexFromUrl = wizardSteps.findIndex(step => step.id === stepIdFromUrl);
    const validIndex = indexFromUrl !== -1 ? indexFromUrl : 0;

    setCurrentStepIndex(validIndex);
    setMaxReachedStepIndex(prevMax => Math.max(prevMax, validIndex));
  }, [searchParams, wizardSteps]); // Dependencies were searchParams; added wizardSteps as it's used

  // Sync form values from assessment.stepData when navigating between steps
  useEffect(() => {
    const stepId = wizardSteps[currentStepIndex].id;
    if (assessment.stepData) {
      // Special handling for the review step to load all data
      if (stepId === 'review') {
        // For the review step, use the full assessment data
        form.reset(assessment.stepData as any, {});
      } else if (assessment.stepData[stepId as keyof typeof assessment.stepData]) {
        // For other steps, only update that specific step's data
        form.reset({
          ...form.getValues(),
          [stepId]: assessment.stepData[stepId as keyof typeof assessment.stepData],
        }, {});
      }
    }
    // Clear validation errors when changing steps
    setValidationError(null);
  }, [currentStepIndex, form, assessment.stepData]);

  // Effect to clear validation error when form fields are updated
  useEffect(() => {
    const subscription = form.watch(() => {
      if (validationError) {
        setValidationError(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, validationError]);

  // --- Handlers --- 
  // Refactored: Only update local state and localStorage on step navigation
  const saveCurrentStep = useCallback(async (onSuccess?: () => void) => {
    // Only update local state and localStorage, no API/database writes
    const wizardFormData = form.getValues();
    console.log('Saving form data for step:', wizardSteps[currentStepIndex].id, wizardFormData);
    
    setAssessment(prev => {
      // Merge new form data with existing step data to ensure we keep all data
      const updatedStepData = {
        ...prev.stepData,
        ...wizardFormData
      };
      console.log('Updated step data:', updatedStepData);
      
      return {
        ...prev,
        stepData: updatedStepData,
        updatedAt: new Date().toISOString(),
        // Important: We're not including strategicFocus here as it's managed separately
      };
    });
    
    if (assessment.id) {
      saveToLocalCache(assessment.id, wizardFormData);
    }
    if (onSuccess) onSuccess();
  }, [form, assessment.id, currentStepIndex, wizardSteps]);

  // --- Enhance navigation handlers with transition state ---
  const handleNext = useCallback(async () => {
    if (isTransitioning) return;
    const currentStepId = wizardSteps[currentStepIndex].id;
    // Handle validation
    let isValid = true;
    let fieldsToValidate: Path<WizardStepData>[] = [];
    if (currentStepId === 'basics') {
      fieldsToValidate.push(...[
        'basics.companyName',
        'basics.reportName',
        'basics.industry',
        'basics.size',
        'basics.industryMaturity',
        'basics.companyStage',
      ] as Path<WizardStepData>[]);
    }
    fieldsToValidate = Array.from(new Set(fieldsToValidate));
    if (fieldsToValidate.length > 0) {
      isValid = await form.trigger(fieldsToValidate, {});
    }
    if (!isValid) {
      // Set the validation error message
      setValidationError("Please complete all required fields marked with * before proceeding");
      
      // Check for fields with errors and create a more specific message
      if (form.formState.errors) {
        // Count errors in form.formState.errors
        const errorCount = Object.keys(form.formState.errors).reduce((count, key) => {
          // Each key might have nested errors, just count the top level keys for simplicity
          return count + 1;
        }, 0);
        
        if (errorCount > 0) {
          setValidationError(`Please complete ${errorCount} required field${errorCount > 1 ? 's' : ''} marked with * before proceeding`);
        }
      }
      
      toast({
        title: "Validation Error",
        description: "Please correct the errors shown on the form before proceeding.",
        variant: "destructive",
      });
      return;
    }
    // Clear any validation error when valid
    setValidationError(null);
    setIsTransitioning(true);
    try {
      await saveCurrentStep(() => {
        if (currentStepIndex < wizardSteps.length - 1) {
          const nextIndex = currentStepIndex + 1;
          const nextStepId = wizardSteps[nextIndex].id;
          setMaxReachedStepIndex(prevMax => Math.max(prevMax, nextIndex));
          // Always navigate to /assessment/new for a local-only wizard
          router.push(`/assessment/new?step=${nextStepId}`);
        }
      });
    } finally {
      setIsTransitioning(false);
    }
  }, [form, currentStepIndex, wizardSteps, saveCurrentStep, router, isTransitioning, toast]);

  const handlePrevious = useCallback(async () => {
    if (isTransitioning) return;
    // Clear any validation errors when going back
    setValidationError(null);
    setIsTransitioning(true);
    await saveCurrentStep(() => {
      if (currentStepIndex > 0) {
        const prevStepId = wizardSteps[currentStepIndex - 1].id;
        // Always navigate to /assessment/new for a local-only wizard
        router.push(`/assessment/new?step=${prevStepId}`);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      } else {
        setIsTransitioning(false);
      }
    });
  }, [currentStepIndex, router, saveCurrentStep, isTransitioning, wizardSteps]);

  // Only send the full wizard data to the backend on final submit
  const handleSubmit = useCallback(async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      // Count errors for a specific message
      const errorCount = Object.keys(form.formState.errors).reduce((count, key) => count + 1, 0);
      
      if (errorCount > 0) {
        setValidationError(`Please complete ${errorCount} required field${errorCount > 1 ? 's' : ''} before generating the report`);
      } else {
        setValidationError("Please correct all errors on the form before generating the report");
      }
      
      toast({
        title: "Validation Error",
        description: "Please correct all errors on the form before submitting.",
        variant: "destructive",
      });
      return;
    }
    // Clear validation errors on valid submission
    setValidationError(null);
    // On submit, send the full wizard data to the backend
    setIsGeneratingReport(true);
    try {
      toast({
        title: "Processing",
        description: "Preparing to submit assessment..."
      });
      
      // IMPORTANT: Merge all step data from both form and assessment state to ensure we have everything
      const formData = form.getValues();
      const combinedStepData = {
        ...assessment.stepData,  // Start with current assessment state
        ...formData,             // Overlay form data 
      };
      
      console.log("Current assessment state:", assessment);
      console.log("Form values:", formData);
      console.log("Combined step data:", combinedStepData);
      
      // Ensure pain points data is correctly structured with string keys
      if (combinedStepData.roles?.selectedRoles?.length && combinedStepData.painPoints?.roleSpecificPainPoints) {
        // Create a fresh copy to work with
        const cleanPainPoints = { ...combinedStepData.painPoints };
        cleanPainPoints.roleSpecificPainPoints = {};
        
        // Add pain points for each role using string keys
        combinedStepData.roles.selectedRoles.forEach(role => {
          const roleId = role.id?.toString() || '';
          if (roleId && combinedStepData.painPoints?.roleSpecificPainPoints?.[roleId]) {
            cleanPainPoints.roleSpecificPainPoints[roleId] = combinedStepData.painPoints.roleSpecificPainPoints[roleId];
          }
        });
        
        combinedStepData.painPoints = cleanPainPoints;
        console.log("Cleaned pain points data:", cleanPainPoints);
      }
      
      // Check if AI Adoption Score inputs were provided
      const hasAiAdoptionScoreInputs = 
        combinedStepData.aiAdoptionScoreInputs && 
        Object.keys(combinedStepData.aiAdoptionScoreInputs).length > 0;
      
      if (hasAiAdoptionScoreInputs) {
        console.log("AI Adoption Score inputs:", JSON.stringify(combinedStepData.aiAdoptionScoreInputs, null, 2));
        
        // Validate inputs are numbers
        const inputs = combinedStepData.aiAdoptionScoreInputs;
        const validInputs = inputs ? Object.entries(inputs).every(([key, value]) => 
          typeof value === 'number' && !isNaN(value)
        ) : false;
        
        if (!validInputs) {
          console.warn("Some AI Adoption Score inputs are not valid numbers. This may cause calculation issues.");
        }
      } else {
        console.warn("No AI Adoption Score inputs provided. AI Adoption Score will not be calculated.");
      }
      
      // Prepare the payload with the combined data
      const payload = {
        basics: combinedStepData.basics,
        stepData: combinedStepData,
        organizationId: 1, // Placeholder, adjust as needed
        userId: 1, // Placeholder, adjust as needed
        strategicFocus: strategicFocus, // Include the strategicFocus field
        industry: combinedStepData.basics?.industry,
        industryMaturity: combinedStepData.basics?.industryMaturity,
        companyStage: combinedStepData.basics?.companyStage,
        aiAdoptionScoreInputs: hasAiAdoptionScoreInputs ? combinedStepData.aiAdoptionScoreInputs : undefined,
      };
      
      console.log("Submitting assessment with payload:", JSON.stringify(payload, null, 2));
      
      toast({
        title: "Submitting",
        description: "Sending assessment data to server..."
      });
      
      const response = await apiRequest("POST", "/api/assessments", payload);
      if (!response.ok) throw new Error(await response.text());
      const createdAssessment = await response.json();
      
      toast({
        title: "Assessment Created",
        description: "Assessment successfully created, generating report..."
      });
      
      // Log the created assessment for debugging
      console.log("Created assessment:", JSON.stringify(createdAssessment, null, 2));
      
      setAssessment(prev => ({
        ...prev,
        id: createdAssessment.id,
        title: createdAssessment.title,
        organizationId: createdAssessment.organizationId,
        userId: createdAssessment.userId,
        status: createdAssessment.status,
        industry: createdAssessment.industry,
        industryMaturity: createdAssessment.industryMaturity,
        companyStage: createdAssessment.companyStage,
        strategicFocus: createdAssessment.strategicFocus,
        aiAdoptionScoreInputs: createdAssessment.aiAdoptionScoreInputs,
        stepData: (createdAssessment.stepData as Partial<WizardStepData>) || { basics: combinedStepData.basics },
        createdAt: createdAssessment.createdAt,
        updatedAt: createdAssessment.updatedAt,
      }));
      // Generate report after assessment is created
      generateReportMutation.mutate(createdAssessment.id);
    } catch (error) {
      console.error("Submission Error:", error);
      toast({
        title: "Submission Error",
        description: error instanceof Error ? error.message : "Unknown error.",
        variant: "destructive",
      });
      setIsGeneratingReport(false);
    }
  }, [form, toast, generateReportMutation, strategicFocus]);
  
  // Generic input change handler - deep updates for nested stepData
  const handleInputChange = (path: string, value: any) => {
    // Update react-hook-form state
    form.setValue(path as any, value, { shouldDirty: true, shouldValidate: true });

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

    // Options for checkbox-style radio groups
    const industryOptions = [
      { value: "Software & Technology", label: "Software & Technology" },
      { value: "Finance & Banking", label: "Finance & Banking" },
      { value: "Healthcare", label: "Healthcare" },
      { value: "Retail & E-commerce", label: "Retail & E-commerce" },
      { value: "Manufacturing", label: "Manufacturing" },
      { value: "Education", label: "Education" },
      { value: "Professional Services", label: "Professional Services" },
      { value: "Media & Entertainment", label: "Media & Entertainment" },
      { value: "Other", label: "Other" },
    ];

    const companySizeOptions = [
      { value: "Small (1-50 employees)", label: "Small (1-50 employees)" },
      { value: "Medium (51-500 employees)", label: "Medium (51-500 employees)" },
      { value: "Large (501-5000 employees)", label: "Large (501-5000 employees)" },
      { value: "Enterprise (5000+ employees)", label: "Enterprise (5000+ employees)" },
    ];

    switch (stepId) {
      case "basics":
        return (
          <div className="space-y-6 p-1">
            <FormField
              control={form.control}
              name="basics.companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name*</FormLabel>
                  <FormControl><Input placeholder="Your Company LLC" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="basics.reportName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Report Name*</FormLabel>
                  <FormControl><Input placeholder="Q1 AI Readiness Report" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="basics.industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry*</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                      {industryOptions.map((option) => (
                        <div key={option.value} className={`checkbox-option ${field.value === option.value ? 'selected' : ''}`}>
                          <Checkbox
                            id={`industry-${option.value}`}
                            checked={field.value === option.value}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange(option.value);
                              } else if (field.value === option.value) {
                                // Optional: allow unchecking to clear. Zod requires a selection.
                                // field.onChange(""); // Or undefined, if your schema handles it.
                                // For now, to ensure one is always selected once interacted with,
                                // clicking an already checked one does nothing or use radio group behavior.
                                // If Zod requires a selection, this logic is fine.
                              }
                            }}
                            className="h-4 w-4"
                          />
                          <Label htmlFor={`industry-${option.value}`} className="cursor-pointer flex-1 font-normal text-slate-700">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </FormControl>
                  {/* <FormDescription>Select the industry that best matches your organization's primary business activities.</FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="basics.size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Size*</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                      {companySizeOptions.map((option) => (
                        <div key={option.value} className={`checkbox-option ${field.value === option.value ? 'selected' : ''}`}>
                          <Checkbox
                            id={`size-${option.value}`}
                            checked={field.value === option.value}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange(option.value);
                              }
                              // Similar logic as industry for ensuring one selection if needed
                            }}
                            className="h-4 w-4"
                          />
                          <Label htmlFor={`size-${option.value}`} className="cursor-pointer flex-1 font-normal text-slate-700">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </FormControl>
                  {/* <FormDescription>Select the option that best describes your organization's size.</FormDescription> */}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="basics.industryMaturity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry Maturity*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select industry maturity..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      {industryMaturityEnum.enumValues.map((maturity) => (
                        <SelectItem key={maturity} value={maturity}>{maturity}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  <FormDescription className="mt-2 text-xs text-slate-600 space-y-1">
                    {/* Changed p tags to div to avoid p-in-p hydration error */}
                    <div><span className="font-semibold">Mature Industry:</span> An industry that has reached a stable, established phase with slow or minimal growth, high competition, and a well-defined customer base, often focusing on efficiency and cost control rather than rapid expansion.</div>
                    <div><span className="font-semibold">Immature Industry:</span> An industry that is still in its early or growth phases, characterized by rapid innovation, high growth rates, emerging customer bases, and frequent entry of new competitors as the market is still developing and evolving.</div>
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="basics.companyStage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Stage*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select company stage..." /></SelectTrigger></FormControl>
                    <SelectContent>
                      {companyStageEnum.enumValues.map((stage) => (
                        <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  <Accordion type="single" collapsible className="w-full mt-2">
                    <AccordionItem value="company-stage-context">
                      <AccordionTrigger className="text-sm text-red-600 hover:text-red-700 hover:no-underline py-2">Hint: Details for each company stage</AccordionTrigger>
                      <AccordionContent className="text-xs p-1">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-slate-200 border border-slate-200">
                            <thead className="bg-slate-50">
                              <tr>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Stage</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Typical Annual Revenue</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Typical Employee Count</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Operational/AI Characteristics</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                              {[
                                {
                                  stage: "Startup",
                                  revenue: "$0 – $1M",
                                  employees: "1–10",
                                  characteristics: "Founder-led, manual ops, ad hoc, early AI pilots"
                                },
                                {
                                  stage: "Early Growth",
                                  revenue: "$1M – $10M",
                                  employees: "10–50",
                                  characteristics: "First sales/CS hires, basic automation, track CAC"
                                },
                                {
                                  stage: "Scaling",
                                  revenue: "$10M – $50M+",
                                  employees: "50–250",
                                  characteristics: "Multiple teams, advanced analytics, AI scaling"
                                },
                                {
                                  stage: "Mature",
                                  revenue: "$50M – $500M+ (or IPO)",
                                  employees: "250–1000+",
                                  characteristics: "Fully built org, heavy automation, AI everywhere"
                                }
                              ].map(item => (
                                <tr key={item.stage}>
                                  <td className="px-3 py-2 whitespace-nowrap text-slate-700 font-medium">{item.stage}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-slate-600">{item.revenue}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-slate-600">{item.employees}</td>
                                  <td className="px-3 py-2 text-slate-600 text-wrap">{item.characteristics}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </FormItem>
              )}
            />
            
            <FormItem>
              <FormLabel>Strategic Focus (select all that apply)</FormLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                {[
                  "Efficiency & Productivity",
                  "Cost Reduction",
                  "Revenue Growth",
                  "Customer Experience",
                  "Innovation & New Products",
                  "Operational Excellence",
                  "Data-Driven Decision Making",
                  "Talent & Workforce Development"
                ].map((option) => (
                  <div key={option} className={`checkbox-option ${strategicFocus.includes(option) ? 'selected' : ''}`}>
                    <Checkbox
                      id={`strategic-focus-${option}`}
                      checked={strategicFocus.includes(option)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setStrategicFocus(prev => [...prev, option]);
                        } else {
                          setStrategicFocus(prev => prev.filter(v => v !== option));
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`strategic-focus-${option}`} className="cursor-pointer flex-1 font-normal text-slate-700">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
              <FormDescription>Select the strategic focus areas for your AI initiatives.</FormDescription>
            </FormItem>
            
            <FormField
              control={form.control}
              name="basics.goals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key Business Goals for AI (Optional)</FormLabel>
                  <FormControl><Textarea placeholder="Describe key business goals AI could address..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="basics.stakeholders"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key Stakeholders (select all that apply)</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                      {stakeholderOptions.map((option) => (
                        <div key={option} className={`checkbox-option ${(field.value || []).includes(option) ? 'selected' : ''}`}>
                          <Checkbox
                            id={`stakeholder-${option}`}
                            checked={(field.value || []).includes(option)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, option]);
                              } else {
                                field.onChange(current.filter((v: string) => v !== option));
                              }
                            }}
                            className="h-4 w-4"
                          />
                          <Label htmlFor={`stakeholder-${option}`} className="cursor-pointer flex-1 font-normal text-slate-700">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </FormControl>
                  <FormDescription>Select the key stakeholders involved in this assessment.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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
            
            // Ensure role ID is always included
            newSelection = [...currentSelection, { 
                id: role.id, 
                title: role.title, 
                department: deptName, 
            }];
            
            console.log(`Added role: ${role.title} (ID: ${role.id})`);
            console.log('Updated roles selection:', newSelection);
            
            // Prefetch the painPoints structure for this role to prevent it being undefined later
            setTimeout(() => {
              // Use a setTimeout to ensure this runs after the state update
              setAssessment(prev => {
                const newStepData = { ...prev.stepData };
                
                if (!newStepData.painPoints) {
                  newStepData.painPoints = { roleSpecificPainPoints: {}, generalPainPoints: '' };
                } else if (!newStepData.painPoints.roleSpecificPainPoints) {
                  newStepData.painPoints.roleSpecificPainPoints = {};
                }
                
                // Create the entry using string ID as key
                const roleId = role.id?.toString() || '';
                if (roleId && !newStepData.painPoints.roleSpecificPainPoints[roleId]) {
                  newStepData.painPoints.roleSpecificPainPoints[roleId] = {
                    description: '',
                    severity: undefined, 
                    frequency: undefined,
                    impact: undefined
                  };
                  
                  console.log(`Prefetched pain points for role ${role.title} (ID: ${roleId})`);
                  return { ...prev, stepData: newStepData };
                }
                
                return prev;
              });
            }, 0);
          } else {
            newSelection = currentSelection.filter(r => r.id !== role.id);
            console.log(`Removed role: ${role.title} (ID: ${role.id})`);
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

        console.log('Pain Points Step - All data:', {
          selectedRoles,
          painPointsData
        });

        return (
          <React.Fragment>
            <h2 className="text-xl font-semibold mb-1">{title}</h2>
            <p className="text-muted-foreground mb-4">{description}</p>
            <div className="space-y-6">
              {selectedRoles.length > 0 ? (
                selectedRoles.map((role) => {
                  // Role ID needs to be used as a string key
                  const roleId = role.id?.toString() || '';
                  const rolePainPoints = painPointsData.roleSpecificPainPoints?.[roleId];
                  
                  console.log(`Pain Points Step - Role ${role.title} (ID: ${roleId}):`, {
                    roleData: role,
                    painPointsData: rolePainPoints  
                  });
                  
                  return (
                    <Card key={role.id} data-role-id={roleId} data-role-name={role.title.replace(/\s+/g, '-').toLowerCase()} data-testid={`role-pain-points-${roleId}`}> 
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
                              handleInputChange(`painPoints.roleSpecificPainPoints.${roleId}.description`, e.target.value)
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
                                handleInputChange(`painPoints.roleSpecificPainPoints.${roleId}.severity`, parseInt(e.target.value) || undefined)
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
                                handleInputChange(`painPoints.roleSpecificPainPoints.${roleId}.frequency`, parseInt(e.target.value) || undefined)
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
                                handleInputChange(`painPoints.roleSpecificPainPoints.${roleId}.impact`, parseInt(e.target.value) || undefined)
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
                    <Card key={role.id} data-role-id={roleIdStr} data-role-name={role.title.replace(/\s+/g, '-').toLowerCase()} data-testid={`role-work-volume-${roleIdStr}`}>
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
      case "aiAdoptionScoreInputs":
        // Get current AI Adoption Score inputs or initialize with empty object
        const aiAdoptionScoreInputs = stepData.aiAdoptionScoreInputs || {};
        
        return (
          <React.Fragment>
            <h2 className="text-xl font-semibold mb-1">{title}</h2>
            <p className="text-muted-foreground mb-4">{description}</p>
            <div className="space-y-6">
              <div>
                <Label>Adoption Rate Forecast (%)</Label>
                <Input 
                  placeholder="Enter percentage (e.g., 75)" 
                  type="number"
                  value={aiAdoptionScoreInputs.adoptionRateForecast || ""}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                    handleInputChange("aiAdoptionScoreInputs.adoptionRateForecast", value);
                  }}
                  min={0}
                  max={100}
                />
                <FormDescription>Estimated percentage of potential users who will adopt the AI solution</FormDescription>
              </div>
              
              <div>
                <Label>Time Savings (hours/week/user)</Label>
                <Input 
                  placeholder="Enter hours (e.g., 5)" 
                  type="number"
                  value={aiAdoptionScoreInputs.timeSavingsPerUserHours || ""}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    handleInputChange("aiAdoptionScoreInputs.timeSavingsPerUserHours", value);
                  }}
                  min={0}
                  step={0.5}
                />
                <FormDescription>Estimated hours saved per user per week</FormDescription>
              </div>
              
              <div>
                <Label>Affected Users (count)</Label>
                <Input 
                  placeholder="Enter number of users (e.g., 50)" 
                  type="number"
                  value={aiAdoptionScoreInputs.affectedUserCount || ""}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                    handleInputChange("aiAdoptionScoreInputs.affectedUserCount", value);
                  }}
                  min={0}
                />
                <FormDescription>Number of users who will be affected by the AI solution</FormDescription>
              </div>
              
              <div>
                <Label>Cost Efficiency Gains ($)</Label>
                <Input 
                  placeholder="Enter dollar amount (e.g., 10000)" 
                  type="number"
                  value={aiAdoptionScoreInputs.costEfficiencyGainsAmount || ""}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    handleInputChange("aiAdoptionScoreInputs.costEfficiencyGainsAmount", value);
                  }}
                  min={0}
                />
                <FormDescription>Estimated direct cost savings per year</FormDescription>
              </div>
              
              <div>
                <Label>Performance Improvement (%)</Label>
                <Input 
                  placeholder="Enter percentage (e.g., 20)" 
                  type="number"
                  value={aiAdoptionScoreInputs.performanceImprovementPercentage || ""}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined;
                    handleInputChange("aiAdoptionScoreInputs.performanceImprovementPercentage", value);
                  }}
                  min={0}
                  max={100}
                />
                <FormDescription>Estimated percentage improvement in a key performance metric</FormDescription>
              </div>
              
              <div>
                <Label>Tool Sprawl Reduction (1-5)</Label>
                <Select
                  value={aiAdoptionScoreInputs.toolSprawlReductionScore?.toString() || ""}
                  onValueChange={(value) => {
                    handleInputChange("aiAdoptionScoreInputs.toolSprawlReductionScore", parseInt(value, 10));
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a value..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Minimal</SelectItem>
                    <SelectItem value="2">2 - Below Average</SelectItem>
                    <SelectItem value="3">3 - Average</SelectItem>
                    <SelectItem value="4">4 - Above Average</SelectItem>
                    <SelectItem value="5">5 - Significant</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Estimated benefit from consolidating or replacing existing tools</FormDescription>
              </div>
              
              <Card className="bg-slate-50 mt-4">
                <CardContent className="pt-6">
                  <div className="text-sm text-slate-700">
                    <p className="font-medium mb-2">AI Adoption Score Formula:</p>
                    <p className="mb-1">AIAdoption Score = (α·U + β·I + γ·E + δ·S - ε·B) / IB</p>
                    <p className="text-xs mb-4">Where weights (α, β, γ, δ, ε) vary based on industry and company stage.</p>
                    
                    <p className="text-xs">
                      <span className="font-semibold">U</span> = User factors (adoption rate, affected users)<br/>
                      <span className="font-semibold">I</span> = Impact factors (time savings, performance improvement)<br/>
                      <span className="font-semibold">E</span> = Efficiency factors (cost savings)<br/>
                      <span className="font-semibold">S</span> = Strategic factors (tool sprawl reduction)<br/>
                      <span className="font-semibold">B</span> = Barriers<br/>
                      <span className="font-semibold">IB</span> = Industry-specific normalization factor
                    </p>
                  </div>
                </CardContent>
              </Card>
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
                        <Label>Assessment Name</Label>
                        <Input
                          className="mt-1"
                          value={stepData.basics?.reportName || ""}
                          onChange={(e) => {
                            // Update both the stepData and the title
                            handleInputChange("basics.reportName", e.target.value);
                            setAssessment(prev => ({ ...prev, title: e.target.value || "New AI Transformation Assessment" }));
                          }}
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
                        <div className="mt-1">
                          {Array.isArray(stepData.basics?.stakeholders) && stepData.basics.stakeholders.length > 0
                            ? stepData.basics.stakeholders.join(", ")
                            : <span className="text-muted-foreground">No stakeholders selected.</span>}
                        </div>
                    </div>
                    <div>
                        <Label>Strategic Focus Areas</Label>
                        <div className="mt-1">
                          {Array.isArray(strategicFocus) && strategicFocus.length > 0
                            ? strategicFocus.join(", ")
                            : <span className="text-muted-foreground">No strategic focus areas selected.</span>}
                        </div>
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

               {/* --- AI Adoption Score Inputs Section --- */}
               <Card>
                 <CardHeader>
                   <CardTitle>AI Adoption Score Inputs</CardTitle>
                   <CardDescription>ROI calculation inputs.</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-2">
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <Label>Adoption Rate Forecast</Label>
                       <div className="text-sm mt-1">
                         {stepData.aiAdoptionScoreInputs?.adoptionRateForecast ? 
                           `${stepData.aiAdoptionScoreInputs.adoptionRateForecast}%` : 
                           <span className="text-muted-foreground">Not specified</span>}
                       </div>
                     </div>
                     <div>
                       <Label>Time Savings</Label>
                       <div className="text-sm mt-1">
                         {stepData.aiAdoptionScoreInputs?.timeSavingsPerUserHours ?
                           `${stepData.aiAdoptionScoreInputs.timeSavingsPerUserHours} hours/week/user` :
                           <span className="text-muted-foreground">Not specified</span>}
                       </div>
                     </div>
                     <div>
                       <Label>Affected Users</Label>
                       <div className="text-sm mt-1">
                         {stepData.aiAdoptionScoreInputs?.affectedUserCount ?
                           stepData.aiAdoptionScoreInputs.affectedUserCount :
                           <span className="text-muted-foreground">Not specified</span>}
                       </div>
                     </div>
                     <div>
                       <Label>Cost Efficiency Gains</Label>
                       <div className="text-sm mt-1">
                         {stepData.aiAdoptionScoreInputs?.costEfficiencyGainsAmount ?
                           `$${stepData.aiAdoptionScoreInputs.costEfficiencyGainsAmount}` :
                           <span className="text-muted-foreground">Not specified</span>}
                       </div>
                     </div>
                     <div>
                       <Label>Performance Improvement</Label>
                       <div className="text-sm mt-1">
                         {stepData.aiAdoptionScoreInputs?.performanceImprovementPercentage ?
                           `${stepData.aiAdoptionScoreInputs.performanceImprovementPercentage}%` :
                           <span className="text-muted-foreground">Not specified</span>}
                       </div>
                     </div>
                     <div>
                       <Label>Tool Sprawl Reduction</Label>
                       <div className="text-sm mt-1">
                         {stepData.aiAdoptionScoreInputs?.toolSprawlReductionScore ?
                           `${stepData.aiAdoptionScoreInputs.toolSprawlReductionScore}/5` :
                           <span className="text-muted-foreground">Not specified</span>}
                       </div>
                     </div>
                   </div>
                   <p className="text-xs text-muted-foreground mt-2">To modify these values, please navigate to the 'ROI Targets' step.</p>
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
                     // Ensure we're accessing the pain points with the right key
                     // Role ID needs to be used as a string key
                     const roleId = role.id?.toString() || '';
                     const rolePP = stepData.painPoints?.roleSpecificPainPoints?.[roleId] || {};
                     
                     console.log(`Review step - Role ${role.title} (ID: ${roleId}):`, {
                       roleData: role,
                       painPointsData: rolePP,
                       allPainPoints: stepData.painPoints?.roleSpecificPainPoints
                     });
                     
                     return (
                       <div key={role.id} className="border-t pt-4 mt-4">
                         <h4 className="font-medium text-sm mb-2">{role.title} Pain Points</h4>
                         <div>
                           <Label>Description</Label>
                           <Textarea
                             className="mt-1"
                             value={rolePP.description || ""}
                             onChange={(e) => handleInputChange(`painPoints.roleSpecificPainPoints.${roleId}.description`, e.target.value)}
                           />
                         </div>
                         <div className="grid grid-cols-3 gap-4 mt-2">
                            <div>
                                <Label>Severity (1-5)</Label>
                                <Input className="mt-1" type="number" min="1" max="5" value={rolePP.severity || ""} onChange={(e) => handleInputChange(`painPoints.roleSpecificPainPoints.${roleId}.severity`, parseInt(e.target.value) || undefined)} />
                           </div>
                           <div>
                               <Label>Frequency (1-5)</Label>
                               <Input className="mt-1" type="number" min="1" max="5" value={rolePP.frequency || ""} onChange={(e) => handleInputChange(`painPoints.roleSpecificPainPoints.${roleId}.frequency`, parseInt(e.target.value) || undefined)} />
                           </div>
                           <div>
                               <Label>Impact (1-5)</Label>
                               <Input className="mt-1" type="number" min="1" max="5" value={rolePP.impact || ""} onChange={(e) => handleInputChange(`painPoints.roleSpecificPainPoints.${roleId}.impact`, parseInt(e.target.value) || undefined)} />
                           </div>
                         </div>
                       </div>
                     );
                   })}
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

  const isLastStep = currentStepIndex === wizardSteps.length - 1;

  return (
    <WizardLayout
      title={assessment.title || "Assessment"}
      steps={wizardSteps}
      currentStepIndex={currentStepIndex}
      totalSteps={wizardSteps.length}
      onPrevious={handlePrevious}
      onNext={handleNext}
      onSubmit={currentStepIndex === wizardSteps.length - 1 ? handleSubmit : undefined}
      isSaving={isSaving || isTransitioning}
      isSubmitting={isGeneratingReport}
      assessmentId={0} // This is needed for progress indicator navigation, even if we're not using it
      onSaveBeforeNavigate={saveCurrentStep}
      maxReachedStepIndex={maxReachedStepIndex}
      validationError={validationError}
    >
      <Form {...form}>
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {wizardSteps[currentStepIndex].title}
                </h1>
                <p className="text-slate-600">
                  {wizardSteps[currentStepIndex].description}
                </p>
              </div>
              
              {isGeneratingReport && (
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="text-slate-600 font-medium">Generating report...</span>
                </div>
              )}
            </div>
            
            {renderStepContent()}
          </CardContent>
        </Card>
      </Form>
    </WizardLayout>
  );
} 