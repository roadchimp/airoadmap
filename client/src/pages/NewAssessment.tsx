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

// Define steps for the wizard
const wizardSteps: WizardStep[] = [
  {
    id: "basics",
    title: "Basics",
    description: "Tell us about your organization and its goals."
  },
  {
    id: "roles",
    title: "Roles",
    description: "Select and evaluate key roles in your organization that might benefit from AI transformation."
  },
  {
    id: "painPoints",
    title: "Pain Points",
    description: "Identify the main challenges and pain points for the selected roles."
  },
  {
    id: "techStack",
    title: "Tech Stack",
    description: "Tell us about your current technology ecosystem and data availability."
  },
  {
    id: "review",
    title: "Review",
    description: "Review your assessment before generating your AI transformation roadmap."
  }
];

const NewAssessment: React.FC = () => {
  const params = useParams();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Get current step from URL or default to "new" or "basics"
  const currentStepParam = params.step || "new";
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // Assessment state
  const [assessment, setAssessment] = useState<{
    id?: number;
    title: string;
    organizationId: number;
    userId: number;
    stepData: Partial<WizardStepData>;
  }>({
    title: "",
    organizationId: 1, // Default for demo purposes
    userId: 1, // Default for demo purposes
    stepData: {}
  });
  
  // Auto-save state
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch departments and roles for the role selection step
  const { data: departments } = useQuery({
    queryKey: ["/api/departments"],
  });
  
  const { data: jobRoles } = useQuery({
    queryKey: ["/api/job-roles"],
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
      toast({
        title: "Assessment created",
        description: "Your new assessment has been created successfully.",
      });
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
  
  // Initialize assessment if starting a new one
  useEffect(() => {
    if (currentStepParam === "new") {
      // Reset state and navigate to first step
      setAssessment({
        title: "New AI Transformation Assessment",
        organizationId: 1,
        userId: 1,
        stepData: {}
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
  
  // Navigate to next step and save current step data
  const handleNext = async () => {
    // First, save the current step data
    await saveCurrentStep(assessment.stepData);
    
    // Then, navigate to the next step
    if (currentStepIndex < wizardSteps.length - 1) {
      const nextStep = wizardSteps[currentStepIndex + 1].id;
      navigate(`/assessment/${nextStep}`);
    }
  };
  
  // Navigate to previous step
  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      const prevStep = wizardSteps[currentStepIndex - 1].id;
      navigate(`/assessment/${prevStep}`);
    } else {
      // First step, cancel assessment
      navigate("/");
    }
  };
  
  // Submit assessment and generate report
  const handleSubmit = async () => {
    // First, save the review step if needed
    await saveCurrentStep(assessment.stepData);
    
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
      case "techStack":
        return renderTechStackStep(stepData.techStack || {});
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
            { id: "generic", label: "Generic", value: "Generic" },
            { id: "nonprofit", label: "Non-profit", value: "Non-profit" }
          ]}
          value={basicsData.industry || ""}
          onChange={(value) => handleInputChange("industry", value)}
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
          <h3 className="text-lg font-medium mb-2">Tech Stack</h3>
          <p className="mb-2"><span className="font-medium">Current Systems:</span> {stepData.techStack?.currentSystems || "None specified"}</p>
          <p className="mb-2"><span className="font-medium">Data Types:</span> {(stepData.techStack?.dataAvailability || []).join(", ") || "None specified"}</p>
          <p><span className="font-medium">Data Quality Rating:</span> {stepData.techStack?.dataQuality || "Not rated"}/5</p>
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
      steps={wizardSteps}
      currentStepIndex={currentStepIndex}
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
