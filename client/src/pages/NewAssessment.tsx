import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import WizardLayout from "@/components/wizard/WizardLayout";
import QuestionCard, { QuestionOption } from "@/components/wizard/QuestionCard";
import { Department, JobRole, WizardStepData } from "@shared/schema";

interface WizardStep {
  id: string;
  title: string;
  description: string;
}

interface AssessmentData {
  id?: number;
  title: string;
  organizationId: number;
  userId: number;
  stepData: {
    basics?: {
      companyName?: string;
      industry?: string;
      size?: string;
      goals?: string;
      stakeholders?: string[];
      industryMaturity?: 'Mature' | 'Immature';
      companyStage?: 'Startup' | 'Early Growth' | 'Scaling' | 'Mature';
      reportName?: string;
    };
    roles?: {
      selectedDepartments?: number[];
      selectedRoles?: number[];
      prioritizedRoles?: number[];
    };
    painPoints?: {
      roleSpecificPainPoints?: Record<number, {
        severity?: number;
        frequency?: number;
        description?: string;
      }>;
      generalPainPoints?: string;
    };
    workVolume?: {
      roleWorkVolume?: Record<number, {
        volume?: string;
        timeSpent?: string;
        complexity?: string;
        errorRisk?: string;
      }>;
    };
    techStack?: {
      currentSystems?: string;
      dataAvailability?: string[];
      existingAutomation?: string;
      dataQuality?: number;
    };
    adoption?: {
      roleAdoption?: Record<number, {
        openness?: string;
        skillsReadiness?: string;
        risks?: string;
        suitability?: number;
      }>;
    };
    scores?: any;
    aiAdoptionScoreInputs?: {
      adoptionRateForecast?: number;
      timeSavingsPerUserHours?: number;
      affectedUserCount?: number;
      costEfficiencyGainsAmount?: number;
      performanceImprovementPercentage?: number;
      toolSprawlReductionScore?: number;
    };
  };
}

// Define wizard steps at the top level
const wizardSteps = [
  { id: "basics", title: "Organization Info", description: "Basic organization information" },
  { id: "roles", title: "Role Selection", description: "Select roles to evaluate" },
  { id: "painPoints", title: "Areas for Improvement", description: "Identify pain points and challenges" },
  { id: "workVolume", title: "Work Volume & Complexity", description: "Assess work patterns" },
  { id: "techStack", title: "Data & Systems", description: "Evaluate technical readiness" },
  { id: "adoption", title: "Readiness & Expectations", description: "Assess adoption readiness" },
  { id: "review", title: "Review & Submit", description: "Review and generate report" }
];

const NewAssessment: React.FC = () => {
  const params = useParams();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Get current step from URL or default to "new" or "basics"
  const currentStepParam = params.step || "new";
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // Assessment state with proper typing
  const [assessment, setAssessment] = useState<AssessmentData>({
    title: "",
    organizationId: 1,
    userId: 1,
    stepData: {
      basics: {
        companyName: "",
        industry: "",
        size: "",
        goals: "",
        stakeholders: [],
        industryMaturity: "Mature",
        companyStage: "Mature",
        reportName: "AI Roadmap Assessment"
      },
      aiAdoptionScoreInputs: {
        adoptionRateForecast: 80,
        timeSavingsPerUserHours: 7,
        affectedUserCount: 120,
        costEfficiencyGainsAmount: 25000,
        performanceImprovementPercentage: 30,
        toolSprawlReductionScore: 4
      }
    }
  });
  
  // Auto-save state
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch departments and roles for the role selection step
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/departments");
      if (!response.ok) throw new Error('Failed to fetch departments');
      return response.json() as Promise<Department[]>;
    },
  });
  
  const { data: jobRoles = [] } = useQuery<JobRole[]>({
    queryKey: ["/api/job-roles"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/job-roles");
      if (!response.ok) throw new Error('Failed to fetch job roles');
      return response.json() as Promise<JobRole[]>;
    },
  });
  
  // Create assessment mutation
  const createAssessment = useMutation({
    mutationFn: async (assessmentData: any) => {
      const response = await apiRequest("POST", "/api/assessments", assessmentData);
      return response.json();
    },
    onSuccess: (data) => {
      setAssessment(prev => ({ ...prev, id: data.id }));
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
      // Show creation message only when assessment is first created
      if (!assessment.id) {
        toast({
          title: "Assessment created",
          description: "Your new assessment has been created successfully.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error creating assessment",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update assessment step mutation
  const updateAssessmentStep = useMutation({
    mutationFn: async ({ id, stepData }: { id: number, stepData: any }) => {
      const response = await apiRequest("PATCH", `/api/assessments/${id}/step`, stepData);
      return response.json();
    },
    onSuccess: (data) => {
      setAssessment(prev => ({ ...prev, stepData: data.stepData || {} }));
      setIsSaving(true);
      setTimeout(() => setIsSaving(false), 2000);
      queryClient.invalidateQueries({ queryKey: ["/api/assessments"] });
    },
    onError: (error) => {
      toast({
        title: "Error updating assessment",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Generate report mutation
  const generateReport = useMutation({
    mutationFn: async (assessmentId: number) => {
      const response = await apiRequest("POST", "/api/prioritize", { assessmentId });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      toast({
        title: "Report Generated",
        description: "Your AI transformation roadmap has been created successfully.",
      });
      navigate(`/reports/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error generating report",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update useEffect to handle step navigation
  useEffect(() => {
    if (currentStepParam === "new") {
      // Reset state and navigate to first step
      setAssessment({
        title: "New AI Transformation Assessment",
        organizationId: 1,
        userId: 1,
        stepData: {
          basics: {
            companyName: "",
            industry: "",
            size: "",
            goals: "",
            stakeholders: [],
            industryMaturity: "Mature",
            companyStage: "Mature",
            reportName: "AI Roadmap Assessment"
          },
          aiAdoptionScoreInputs: {
            adoptionRateForecast: 80,
            timeSavingsPerUserHours: 7,
            affectedUserCount: 120,
            costEfficiencyGainsAmount: 25000,
            performanceImprovementPercentage: 30,
            toolSprawlReductionScore: 4
          }
        }
      });
      navigate("/assessment/basics");
    } else {
      // Find the step index from the step ID in the URL
      const stepIndex = wizardSteps.findIndex(step => step.id === currentStepParam);
      if (stepIndex !== -1) {
        setCurrentStepIndex(stepIndex);
      } else {
        // Invalid step, navigate to first step
        navigate("/assessment/basics");
        setCurrentStepIndex(0);
      }
    }
  }, [currentStepParam, navigate]);
  
  // Create or update assessment when changing steps
  const saveCurrentStep = async (stepData: Partial<WizardStepData>) => {
    const currentStep = wizardSteps[currentStepIndex].id as keyof WizardStepData;
    
    // Update local state first
    setAssessment(prev => ({
      ...prev, 
      stepData: {
        ...prev.stepData,
        [currentStep]: stepData[currentStep]
      }
    }));
    
    if (!assessment.id) {
      // Create new assessment if this is the first step
      await createAssessment.mutateAsync({
        title: assessment.title,
        organizationId: assessment.organizationId,
        userId: assessment.userId,
        status: "draft",
        stepData: {
          ...assessment.stepData,
          [currentStep]: stepData[currentStep]
        }
      });
    } else {
      // Update existing assessment
      await updateAssessmentStep.mutateAsync({
        id: assessment.id,
        stepData: {
          [currentStep]: stepData[currentStep]
        }
      });
    }
  };
  
  // Update handleNext to use wizardSteps
  const handleNext = async () => {
    // First, save the current step data
    await saveCurrentStep(assessment.stepData as Partial<WizardStepData>);
    
    // Then, navigate to the next step
    if (currentStepIndex < wizardSteps.length - 1) {
      const nextStepIndex = currentStepIndex + 1;
      const nextStep = wizardSteps[nextStepIndex].id;
      setCurrentStepIndex(nextStepIndex);
      navigate(`/assessment/${nextStep}`);
    }
  };
  
  // Update handlePrevious to use wizardSteps
  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const prevStepIndex = currentStepIndex - 1;
      const prevStep = wizardSteps[prevStepIndex].id;
      setCurrentStepIndex(prevStepIndex);
      navigate(`/assessment/${prevStep}`);
    } else {
      // First step, cancel assessment and return to dashboard
      navigate("/dashboard");
    }
  };
  
  // Submit assessment and generate report
  const handleSubmit = async () => {
    // First, save the review step if needed
    await saveCurrentStep(assessment.stepData as Partial<WizardStepData>);
    
    // Then, generate the report
    if (assessment.id) {
      generateReport.mutateAsync(assessment.id);
    }
  };
  
  // Update state based on form input changes
  const handleInputChange = (field: string, value: any) => {
    const currentStep = wizardSteps[currentStepIndex].id as keyof WizardStepData;
    
    setAssessment(prev => ({
      ...prev,
      stepData: {
        ...prev.stepData,
        [currentStep]: {
          ...(prev.stepData[currentStep] || {}),
          [field]: value
        }
      }
    }));
  };
  
  // Render different step content based on current step
  const renderStepContent = () => {
    const currentStep = wizardSteps[currentStepIndex].id;
    const stepData = assessment.stepData;
    
    switch (currentStep) {
      case "basics":
        return renderBasicsStep(stepData.basics || {});
      case "roles":
        return renderRolesStep(stepData.roles || {});
      case "painPoints":
        return renderPainPointsStep(stepData.painPoints || {});
      case "workVolume":
        return renderWorkVolumeStep(stepData.workVolume || {});
      case "techStack":
        return renderTechStackStep(stepData.techStack || {});
      case "adoption":
        return renderAdoptionStep(stepData.adoption || {});
      case "review":
        return renderReviewStep();
      default:
        return <div>Unknown step</div>;
    }
  };
  
  // Render Basics step
  const renderBasicsStep = (basicsData: any) => {
    return (
      <>
        <QuestionCard
          questionId="reportName"
          questionText="Give this assessment a name"
          inputType="text"
          value={basicsData.reportName || ""}
          onChange={(value) => handleInputChange("reportName", value)}
          isRequired={true}
        />

        <QuestionCard
          questionId="companyName"
          questionText="What is the name of your organization?"
          inputType="text"
          value={basicsData.companyName || ""}
          onChange={(value) => handleInputChange("companyName", value)}
          isRequired={true}
        />
        
        <QuestionCard
          questionId="industry"
          questionText="What industry is your organization in?"
          guidanceText="Select the industry that best matches your organization's primary business activities."
          inputType="singleChoice"
          options={[
            { id: "software", label: "Software", value: "Software" },
            { id: "manufacturing", label: "Manufacturing", value: "Manufacturing" },
            { id: "financial", label: "Financial Services", value: "Financial Services" },
            { id: "retail", label: "Retail", value: "Retail" },
            { id: "healthcare", label: "Healthcare", value: "Healthcare" },
            { id: "education", label: "Education", value: "Education" },
            { id: "nonprofit", label: "Non-profit", value: "Non-profit" },
            { id: "other", label: "Other", value: "Other" }
          ]}
          value={basicsData.industry || ""}
          onChange={(value) => handleInputChange("industry", value)}
          isRequired={true}
        />
        
        <QuestionCard
          questionId="industryMaturity"
          questionText="How would you describe your industry's maturity with AI?"
          guidanceText="Select the option that best describes the AI adoption level in your industry."
          inputType="singleChoice"
          options={[
            { id: "mature", label: "Mature - Widespread AI adoption in my industry", value: "Mature" },
            { id: "immature", label: "Immature - Limited AI adoption in my industry", value: "Immature" }
          ]}
          value={basicsData.industryMaturity || ""}
          onChange={(value) => handleInputChange("industryMaturity", value)}
          isRequired={true}
        />
        
        <QuestionCard
          questionId="companyStage"
          questionText="What stage is your company in?"
          guidanceText="Select the option that best describes your company's current stage."
          inputType="singleChoice"
          options={[
            { id: "startup", label: "Startup", value: "Startup" },
            { id: "early-growth", label: "Early Growth", value: "Early Growth" },
            { id: "scaling", label: "Scaling", value: "Scaling" },
            { id: "mature", label: "Mature", value: "Mature" }
          ]}
          value={basicsData.companyStage || ""}
          onChange={(value) => handleInputChange("companyStage", value)}
          isRequired={true}
        />
        
        <QuestionCard
          questionId="size"
          questionText="What is the size of your organization?"
          guidanceText="Select the option that best describes your organization's size."
          inputType="singleChoice"
          options={[
            { id: "small", label: "Small (1-50 employees)", value: "small" },
            { id: "medium", label: "Medium (51-500 employees)", value: "medium" },
            { id: "large", label: "Large (501-5000 employees)", value: "large" },
            { id: "enterprise", label: "Enterprise (5000+ employees)", value: "enterprise" }
          ]}
          value={basicsData.size || ""}
          onChange={(value) => handleInputChange("size", value)}
          isRequired={true}
        />
        
        <QuestionCard
          questionId="goals"
          questionText="What are your organization's main goals for AI transformation?"
          guidanceText="Describe what you hope to achieve by implementing AI in your organization."
          inputType="textarea"
          value={basicsData.goals || ""}
          onChange={(value) => handleInputChange("goals", value)}
          isRequired={true}
        />
        
        <QuestionCard
          questionId="stakeholders"
          questionText="Who are the key stakeholders interested in the outcome of this AI initiative?"
          guidanceText="Select all departments that would be involved in approving or supporting this AI implementation. These are the people who have a vested interest in the success of your AI roadmap."
          inputType="multipleChoice"
          options={[
            { id: "executives", label: "Executive Leadership", value: "executives" },
            { id: "it", label: "IT Department", value: "it" },
            { id: "operations", label: "Operations", value: "operations" },
            { id: "finance", label: "Finance", value: "finance" },
            { id: "hr", label: "Human Resources", value: "hr" },
            { id: "sales", label: "Sales & Marketing", value: "sales" }
          ]}
          value={basicsData.stakeholders || []}
          onChange={(value) => handleInputChange("stakeholders", value)}
          isRequired={true}
        />
      </>
    );
  };
  
  // Render Roles step
  const renderRolesStep = (rolesData: any) => {
    // Convert departments to options for the multiselect
    const departmentOptions: QuestionOption[] = departments?.map((dept: Department) => ({
      id: dept.id,
      label: dept.name,
      value: dept.name
    })) || [];
    
    // Filter job roles by selected departments if needed
    let filteredRoles = jobRoles || [];
    const selectedDepartments = rolesData.selectedDepartments || [];
    
    if (selectedDepartments.length > 0) {
      filteredRoles = (jobRoles || []).filter((role: JobRole) => 
        selectedDepartments.includes(role.departmentId)
      );
    }
    
    // Convert job roles to options for the role selector
    const roleOptions: QuestionOption[] = filteredRoles.map((role: JobRole) => {
      const dept = departments?.find((d: Department) => d.id === role.departmentId);
      return {
        id: role.id,
        label: role.title,
        value: role.id,
        description: role.description || ""
      };
    });
    
    // Get selected roles data for ranking
    const selectedRoleIds = rolesData.selectedRoles || [];
    const selectedRoleOptions = selectedRoleIds.map((roleId: number) => {
      const role = jobRoles?.find((r: JobRole) => r.id === roleId);
      if (role) {
        const dept = departments?.find((d: Department) => d.id === role.departmentId);
        return {
          id: role.id,
          label: role.title,
          description: dept ? dept.name : "",
          value: role.id
        };
      }
      return null;
    }).filter(Boolean);
    
    return (
      <>
        <QuestionCard
          questionId="selectedDepartments"
          questionText="Which department areas are you assessing?"
          guidanceText="Select all relevant departments for this assessment. You can add a custom department below if needed."
          inputType="multipleChoice"
          options={[
            ...(departmentOptions || []),
            { id: "it", label: "IT", value: "IT" },
            { id: "product", label: "Product Management", value: "Product Management" },
            { id: "support", label: "Customer Support", value: "Customer Support" },
            { id: "engineering", label: "Engineering", value: "Engineering" },
            { id: "research", label: "Research & Development", value: "Research & Development" }
          ]}
          value={rolesData.selectedDepartments || []}
          onChange={(value) => handleInputChange("selectedDepartments", value)}
          isRequired={true}
        />
        
        <QuestionCard
          questionId="customDepartment"
          questionText="Add a custom department (optional)"
          guidanceText="If you don't see your department listed above, you can add it here."
          inputType="text"
          value={rolesData.customDepartment || ""}
          onChange={(value) => {
            handleInputChange("customDepartment", value);
            
            // If a value is provided, add it to the selected departments
            if (value && value.trim() !== "") {
              const customDeptId = `custom_${value.replace(/\s+/g, '_').toLowerCase()}`;
              
              // Only add if not already in the selected departments
              if (!rolesData.selectedDepartments?.includes(customDeptId)) {
                handleInputChange("selectedDepartments", [
                  ...(rolesData.selectedDepartments || []),
                  customDeptId
                ]);
              }
            }
          }}
          isRequired={false}
        />
        
        <QuestionCard
          questionId="selectedRoles"
          questionText="Select specific roles to evaluate"
          guidanceText="Choose the roles you want to evaluate for AI transformation potential."
          inputType="roleSelector"
          options={roleOptions}
          value={rolesData.selectedRoles || []}
          onChange={(value) => handleInputChange("selectedRoles", value)}
          isRequired={true}
        />
        
        {selectedRoleOptions && selectedRoleOptions.length > 0 && (
          <QuestionCard
            questionId="prioritizedRoles"
            questionText="Prioritize these selected roles"
            guidanceText="Drag to reorder based on your organization's priorities for AI transformation."
            inputType="ranking"
            options={selectedRoleOptions}
            value={rolesData.prioritizedRoles || selectedRoleOptions.map((o: any) => o.id)}
            onChange={(value) => handleInputChange("prioritizedRoles", value)}
            isRequired={true}
          />
        )}
      </>
    );
  };
  
  // Render Pain Points step
  const renderPainPointsStep = (painPointsData: any) => {
    // Get selected roles from previous step
    const selectedRoles = assessment.stepData.roles?.selectedRoles || [];
    const roleSpecificPainPoints = painPointsData.roleSpecificPainPoints || {};
    
    // For each selected role, render a pain point section
    return (
      <>
        {selectedRoles.map((roleId: number) => {
          const role = jobRoles?.find((r: JobRole) => r.id === roleId);
          if (!role) return null;
          
          // Current pain points for this role
          const currentPainPoints = roleSpecificPainPoints[roleId] || [];
          
          return (
            <div key={roleId} className="mb-8 pb-8 border-b border-neutral-200 last:border-0">
              <h3 className="text-lg font-medium mb-4">{role.title}</h3>
              
              <QuestionCard
                questionId={`painPoint_${roleId}_severity`}
                questionText="How severe are the pain points for this role?"
                guidanceText="On a scale of 1-5, where 5 is extremely severe."
                inputType="rating"
                value={currentPainPoints.severity || 3}
                onChange={(value) => {
                  const updated = {
                    ...roleSpecificPainPoints,
                    [roleId]: {
                      ...currentPainPoints,
                      severity: value
                    }
                  };
                  handleInputChange("roleSpecificPainPoints", updated);
                }}
                isRequired={true}
              />
              
              <QuestionCard
                questionId={`painPoint_${roleId}_frequency`}
                questionText="How frequently do these pain points occur?"
                guidanceText="On a scale of 1-5, where 5 is constantly."
                inputType="rating"
                value={currentPainPoints.frequency || 3}
                onChange={(value) => {
                  const updated = {
                    ...roleSpecificPainPoints,
                    [roleId]: {
                      ...currentPainPoints,
                      frequency: value
                    }
                  };
                  handleInputChange("roleSpecificPainPoints", updated);
                }}
                isRequired={true}
              />
              
              <QuestionCard
                questionId={`painPoint_${roleId}_description`}
                questionText="Describe the specific pain points for this role"
                guidanceText="What inefficiencies or challenges does this role face that AI could potentially address?"
                inputType="textarea"
                value={currentPainPoints.description || ""}
                onChange={(value) => {
                  const updated = {
                    ...roleSpecificPainPoints,
                    [roleId]: {
                      ...currentPainPoints,
                      description: value
                    }
                  };
                  handleInputChange("roleSpecificPainPoints", updated);
                }}
                isRequired={true}
              />
            </div>
          );
        })}
        
        <QuestionCard
          questionId="generalPainPoints"
          questionText="Are there any organization-wide pain points to consider?"
          guidanceText="Describe any challenges that affect multiple roles or departments."
          inputType="textarea"
          value={painPointsData.generalPainPoints || ""}
          onChange={(value) => handleInputChange("generalPainPoints", value)}
          isRequired={false}
        />
      </>
    );
  };
  
  // Render Work Volume step - based on AI Pilot Discovery Questionnaire
  const renderWorkVolumeStep = (workVolumeData: any) => {
    // Get selected roles from previous step
    const selectedRoles = assessment.stepData.roles?.selectedRoles || [];
    const roleWorkVolume = workVolumeData.roleWorkVolume || {};
    
    return (
      <>
        {selectedRoles.map((roleId: number) => {
          const role = jobRoles?.find((r: JobRole) => r.id === roleId);
          if (!role) return null;
          
          // Current work volume data for this role
          const currentWorkVolume = roleWorkVolume[roleId] || {};
          
          return (
            <div key={roleId} className="mb-8 pb-8 border-b border-neutral-200 last:border-0">
              <h3 className="text-lg font-medium mb-4">{role.title}</h3>
              
              <QuestionCard
                questionId={`workVolume_${roleId}_volume`}
                questionText="What is the volume of work for this role?"
                guidanceText="Example: 'Each support agent handles 50 tickets/day', '200 invoices processed per month'. Higher volumes may yield greater benefits from automation."
                inputType="textarea"
                value={currentWorkVolume.volume || ""}
                onChange={(value) => {
                  const updated = {
                    ...roleWorkVolume,
                    [roleId]: {
                      ...currentWorkVolume,
                      volume: value
                    }
                  };
                  handleInputChange("roleWorkVolume", updated);
                }}
                isRequired={true}
              />
              
              <QuestionCard
                questionId={`workVolume_${roleId}_timeSpent`}
                questionText="How many hours per week does this role spend on tasks that could be AI-assisted?"
                guidanceText="This helps quantify potential efficiency gains. For example, if 20 hours/week are spent on a task, automating it has significant upside."
                inputType="singleChoice"
                options={[
                  { id: "minimal", label: "Less than 5 hours", value: "minimal" },
                  { id: "low", label: "5-10 hours", value: "low" },
                  { id: "medium", label: "10-20 hours", value: "medium" },
                  { id: "high", label: "20-30 hours", value: "high" },
                  { id: "very_high", label: "More than 30 hours", value: "very_high" }
                ]}
                value={currentWorkVolume.timeSpent || ""}
                onChange={(value) => {
                  const updated = {
                    ...roleWorkVolume,
                    [roleId]: {
                      ...currentWorkVolume,
                      timeSpent: value
                    }
                  };
                  handleInputChange("roleWorkVolume", updated);
                }}
                isRequired={true}
              />
              
              <QuestionCard
                questionId={`workVolume_${roleId}_complexity`}
                questionText="How complex are the decisions in this role?"
                guidanceText="AI performs well with well-defined or moderately complex decisions, but tasks needing very nuanced human judgment might be less suitable."
                inputType="singleChoice"
                options={[
                  { id: "simple", label: "Mostly simple and rules-based", value: "simple" },
                  { id: "moderate", label: "Requires moderate judgment", value: "moderate" },
                  { id: "complex", label: "Highly complex with nuanced judgment", value: "complex" }
                ]}
                value={currentWorkVolume.complexity || ""}
                onChange={(value) => {
                  const updated = {
                    ...roleWorkVolume,
                    [roleId]: {
                      ...currentWorkVolume,
                      complexity: value
                    }
                  };
                  handleInputChange("roleWorkVolume", updated);
                }}
                isRequired={true}
              />
              
              <QuestionCard
                questionId={`workVolume_${roleId}_errorRisk`}
                questionText="What is the error risk or impact for this role's tasks?"
                guidanceText="Are manual errors common and what are their consequences? If AI can reduce errors, that adds value. Low-risk tasks are easier to pilot."
                inputType="textarea"
                value={currentWorkVolume.errorRisk || ""}
                onChange={(value) => {
                  const updated = {
                    ...roleWorkVolume,
                    [roleId]: {
                      ...currentWorkVolume,
                      errorRisk: value
                    }
                  };
                  handleInputChange("roleWorkVolume", updated);
                }}
                isRequired={true}
              />
            </div>
          );
        })}
      </>
    );
  };

  // Render Tech Stack step
  const renderTechStackStep = (techStackData: any) => {
    const currentSystems = techStackData.currentSystems || [];
    
    return (
      <>
        <QuestionCard
          questionId="currentSystems"
          questionText="What are the key software systems your organization currently uses?"
          guidanceText="Include CRM, ERP, communication tools, and other important systems."
          inputType="textarea"
          value={techStackData.currentSystems || ""}
          onChange={(value) => handleInputChange("currentSystems", value)}
          isRequired={true}
        />
        
        <QuestionCard
          questionId="dataAvailability"
          questionText="What types of data does your organization have access to?"
          guidanceText="Select all that apply. This helps determine what AI solutions might be viable."
          inputType="multipleChoice"
          options={[
            { id: "structuredData", label: "Structured data (databases, spreadsheets)", value: "structuredData" },
            { id: "unstructuredText", label: "Unstructured text (documents, emails)", value: "unstructuredText" },
            { id: "historicalRecords", label: "Historical records and archives", value: "historicalRecords" },
            { id: "realTimeInputs", label: "Real-time data inputs", value: "realTimeInputs" },
            { id: "apiAccess", label: "API access to systems", value: "apiAccess" }
          ]}
          value={techStackData.dataAvailability || []}
          onChange={(value) => handleInputChange("dataAvailability", value)}
          isRequired={true}
        />
        
        <QuestionCard
          questionId="existingAutomation"
          questionText="Do you currently have any automation or AI systems in place?"
          guidanceText="If yes, please describe what's already implemented."
          inputType="textarea"
          value={techStackData.existingAutomation || ""}
          onChange={(value) => handleInputChange("existingAutomation", value)}
          isRequired={false}
        />
        
        <QuestionCard
          questionId="dataQuality"
          questionText="How would you rate the quality and accessibility of your data?"
          guidanceText="On a scale of 1-5, where 5 is excellent quality and highly accessible."
          inputType="rating"
          value={techStackData.dataQuality || 3}
          onChange={(value) => handleInputChange("dataQuality", value)}
          isRequired={true}
        />
      </>
    );
  };
  
  // Render Adoption & Readiness step
  const renderAdoptionStep = (adoptionData: any) => {
    // Get selected roles from previous step
    const selectedRoles = assessment.stepData.roles?.selectedRoles || [];
    const roleAdoption = adoptionData.roleAdoption || {};
    
    return (
      <>
        {selectedRoles.map((roleId: number) => {
          const role = jobRoles?.find((r: JobRole) => r.id === roleId);
          if (!role) return null;
          
          // Current adoption data for this role
          const currentAdoption = roleAdoption[roleId] || {};
          
          return (
            <div key={roleId} className="mb-8 pb-8 border-b border-neutral-200 last:border-0">
              <h3 className="text-lg font-medium mb-4">{role.title}</h3>
              
              <QuestionCard
                questionId={`adoption_${roleId}_openness`}
                questionText="How open is the team in this area to adopting new technology like AI?"
                guidanceText="Adoption will be smoother if the people involved are open to trying AI. If resistance is high, more change management may be needed."
                inputType="singleChoice"
                options={[
                  { id: "enthusiastic", label: "Enthusiastic", value: "enthusiastic" },
                  { id: "neutral", label: "Neutral", value: "neutral" },
                  { id: "resistant", label: "Resistant", value: "resistant" }
                ]}
                value={currentAdoption.openness || ""}
                onChange={(value) => {
                  const updated = {
                    ...roleAdoption,
                    [roleId]: {
                      ...currentAdoption,
                      openness: value
                    }
                  };
                  handleInputChange("roleAdoption", updated);
                }}
                isRequired={true}
              />
              
              <QuestionCard
                questionId={`adoption_${roleId}_skillsReadiness`}
                questionText="Do you have or can you arrange subject matter experts to train or guide an AI solution?"
                guidanceText="Having experts available to validate outputs or provide training data is important for a successful AI pilot."
                inputType="singleChoice"
                options={[
                  { id: "yes", label: "Yes, we have experts available", value: "yes" },
                  { id: "maybe", label: "Possibly, with some arrangement", value: "maybe" },
                  { id: "no", label: "No, experts are unavailable or too busy", value: "no" }
                ]}
                value={currentAdoption.skillsReadiness || ""}
                onChange={(value) => {
                  const updated = {
                    ...roleAdoption,
                    [roleId]: {
                      ...currentAdoption,
                      skillsReadiness: value
                    }
                  };
                  handleInputChange("roleAdoption", updated);
                }}
                isRequired={true}
              />
              
              <QuestionCard
                questionId={`adoption_${roleId}_benefits`}
                questionText="What would be the tangible benefit if tasks in this role are automated or AI-assisted?"
                guidanceText="Examples: 'Save ~10 hours/week of sales reps' time', 'Faster response to customers', 'Improved consistency', 'Cost savings of $X per month'. Try to quantify in time, cost, or quality terms."
                inputType="textarea"
                value={currentAdoption.benefits || ""}
                onChange={(value) => {
                  const updated = {
                    ...roleAdoption,
                    [roleId]: {
                      ...currentAdoption,
                      benefits: value
                    }
                  };
                  handleInputChange("roleAdoption", updated);
                }}
                isRequired={true}
              />
              
              <QuestionCard
                questionId={`adoption_${roleId}_successCriteria`}
                questionText="What are the success criteria for an AI pilot in this role?"
                guidanceText="How would you measure success after 90 days? E.g. 'The AI handles 50% of tickets with >85% accuracy', 'Report generation time cut from 3 days to 3 hours'."
                inputType="textarea"
                value={currentAdoption.successCriteria || ""}
                onChange={(value) => {
                  const updated = {
                    ...roleAdoption,
                    [roleId]: {
                      ...currentAdoption,
                      successCriteria: value
                    }
                  };
                  handleInputChange("roleAdoption", updated);
                }}
                isRequired={true}
              />
              
              <QuestionCard
                questionId={`adoption_${roleId}_risks`}
                questionText="What are the potential risks or concerns with automating this role's tasks?"
                guidanceText="E.g. 'Risk of AI giving incorrect info to client', 'Compliance concerns', 'Employee job displacement fears'. This ensures risks are manageable."
                inputType="textarea"
                value={currentAdoption.risks || ""}
                onChange={(value) => {
                  const updated = {
                    ...roleAdoption,
                    [roleId]: {
                      ...currentAdoption,
                      risks: value
                    }
                  };
                  handleInputChange("roleAdoption", updated);
                }}
                isRequired={true}
              />
              
              <QuestionCard
                questionId={`adoption_${roleId}_suitability`}
                questionText="Considering all factors, how suitable does this role appear for an AI pilot?"
                guidanceText="This is a gut-check after answering the questions – does it feel like a strong candidate or are there red flags?"
                inputType="rating"
                value={currentAdoption.suitability || 3}
                onChange={(value) => {
                  const updated = {
                    ...roleAdoption,
                    [roleId]: {
                      ...currentAdoption,
                      suitability: value
                    }
                  };
                  handleInputChange("roleAdoption", updated);
                }}
                isRequired={true}
              />
            </div>
          );
        })}
      </>
    );
  };
  
  // Render Review step
  const renderReviewStep = () => {
    const stepData = assessment.stepData;
    
    return (
      <div className="space-y-6">
        <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
          <h3 className="text-lg font-medium mb-2">Organization Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Company Name:</p>
              <p>{stepData.basics?.companyName || "Not provided"}</p>
            </div>
            <div>
              <p className="font-medium">Industry:</p>
              <p>{stepData.basics?.industry || "Not provided"}</p>
            </div>
            <div>
              <p className="font-medium">Size:</p>
              <p>{stepData.basics?.size || "Not provided"}</p>
            </div>
            <div>
              <p className="font-medium">Goals:</p>
              <p className="line-clamp-2">{stepData.basics?.goals || "Not provided"}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
          <h3 className="text-lg font-medium mb-2">Selected Roles</h3>
          <div className="space-y-2">
            {(stepData.roles?.selectedRoles || []).map((roleId: number) => {
              const role = jobRoles?.find((r: JobRole) => r.id === roleId);
              if (!role) return null;
              
              return (
                <div key={roleId} className="p-2 bg-white border border-neutral-100 rounded">
                  <p className="font-medium">{role.title}</p>
                  <p className="text-xs text-neutral-500">{role.description}</p>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
          <h3 className="text-lg font-medium mb-2">Pain Points Summary</h3>
          {Object.entries(stepData.painPoints?.roleSpecificPainPoints || {}).map(([roleId, painPoint]: [string, any]) => {
            const role = jobRoles?.find((r: JobRole) => r.id === parseInt(roleId));
            if (!role) return null;
            
            return (
              <div key={roleId} className="mb-2">
                <p className="font-medium">{role.title}</p>
                <p className="text-sm">{painPoint.description}</p>
                <div className="flex text-xs text-neutral-500 mt-1">
                  <p className="mr-3">Severity: {painPoint.severity}/5</p>
                  <p>Frequency: {painPoint.frequency}/5</p>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
          <h3 className="text-lg font-medium mb-2">Work Volume & Complexity</h3>
          {Object.entries(stepData.workVolume?.roleWorkVolume || {}).map(([roleId, workVolume]: [string, any]) => {
            const role = jobRoles?.find((r: JobRole) => r.id === parseInt(roleId));
            if (!role) return null;
            
            return (
              <div key={roleId} className="mb-2">
                <p className="font-medium">{role.title}</p>
                <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                  <div>
                    <p className="font-medium text-xs">Volume:</p>
                    <p className="text-xs">{workVolume.volume || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-xs">Time Spent:</p>
                    <p className="text-xs">{workVolume.timeSpent || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-xs">Complexity:</p>
                    <p className="text-xs">{workVolume.complexity || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-xs">Error Risk:</p>
                    <p className="text-xs line-clamp-1">{workVolume.errorRisk || "Not specified"}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
          <h3 className="text-lg font-medium mb-2">Tech Stack</h3>
          <p className="mb-2"><span className="font-medium">Current Systems:</span> {stepData.techStack?.currentSystems || "None specified"}</p>
          <p className="mb-2"><span className="font-medium">Data Types:</span> {(stepData.techStack?.dataAvailability || []).join(", ") || "None specified"}</p>
          <p><span className="font-medium">Data Quality Rating:</span> {stepData.techStack?.dataQuality || "Not rated"}/5</p>
        </div>
        
        <div className="bg-neutral-50 p-4 rounded-md border border-neutral-200">
          <h3 className="text-lg font-medium mb-2">Readiness & Expectations</h3>
          {Object.entries(stepData.adoption?.roleAdoption || {}).map(([roleId, adoption]: [string, any]) => {
            const role = jobRoles?.find((r: JobRole) => r.id === parseInt(roleId));
            if (!role) return null;
            
            return (
              <div key={roleId} className="mb-2">
                <p className="font-medium">{role.title}</p>
                <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                  <div>
                    <p className="font-medium text-xs">Team Openness:</p>
                    <p className="text-xs">{adoption.openness || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-xs">Expert Availability:</p>
                    <p className="text-xs">{adoption.skillsReadiness || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-xs">Expected Benefits:</p>
                    <p className="text-xs line-clamp-1">{adoption.benefits || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-xs">Overall Suitability:</p>
                    <p className="text-xs">{adoption.suitability ? `${adoption.suitability}/5` : "Not rated"}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="bg-primary-50 p-4 rounded-md border border-primary-100">
          <h3 className="text-lg font-medium text-primary-800 mb-2">Ready to Generate Your AI Transformation Roadmap</h3>
          <p className="text-primary-700">
            Click "Generate Report" below to analyze your assessment data and create a prioritized AI transformation roadmap.
            This will include a prioritization matrix, recommended AI capabilities for your top roles, and estimated performance impacts.
          </p>
        </div>
      </div>
    );
  };
  
  return (
    <WizardLayout
      title={assessment.title || "New Assessment"}
      steps={wizardSteps}
      currentStepIndex={currentStepIndex}
      totalSteps={wizardSteps.length}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onSubmit={handleSubmit}
      isSubmitting={generateReport.isPending}
      isSaving={isSaving}
    >
      {renderStepContent()}
    </WizardLayout>
  );
};

export default NewAssessment;
