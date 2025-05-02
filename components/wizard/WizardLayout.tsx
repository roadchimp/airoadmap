import React from "react";
import ProgressIndicator from "./ProgressIndicator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Step {
  id: string;
  title: string;
  description: string;
}

interface WizardLayoutProps {
  title: string;
  steps: Step[];
  children: React.ReactNode;
  currentStepIndex: number;
  onNext?: () => void;
  onPrevious?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  isSaving?: boolean;
  assessmentId?: number;
  totalSteps: number;
}

const WizardLayout: React.FC<WizardLayoutProps> = ({
  title,
  steps,
  children,
  currentStepIndex,
  onNext,
  onPrevious,
  onSubmit,
  isSubmitting = false,
  isSaving = false
}) => {
  const { toast } = useToast();
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onSubmit?.();
    } else {
      onNext?.();
    }
  };

  return (
    // Return the main content structure directly
    <div className="flex flex-1 bg-gray-100">
      {/* Main content */}
      <div className="flex-1 p-4 md:p-6 bg-transparent">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Step {currentStepIndex + 1}: {steps[currentStepIndex].title}
            </h2>
            <p className="mt-1 text-gray-600">
              {steps[currentStepIndex].description} {/* Use dynamic description */}
            </p>
            
            {/* Progress bar for mobile only */}
            <div className="mt-4 md:hidden">
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-gray-700">Step {currentStepIndex + 1} of {steps.length}</span>
                <span className="text-slate-400">{Math.round((currentStepIndex / (steps.length - 1)) * 100)}% complete</span>
              </div>
              <div className="progress-indicator">
                <div 
                  className="progress-bar" 
                  style={{ width: `${Math.round((currentStepIndex / (steps.length - 1)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Step Content */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            {children}
          </div>
          
          {/* Footer Navigation Area */}
          <div className="mt-6 flex items-center justify-between gap-3">
      
            {/* Back Button on the left */}    
            <Button
                variant="outline"
                onClick={onPrevious}
                disabled={isFirstStep}
                className="border-gray-600 text-gray-700 hover:bg-gray-700"
              >
                Back
              </Button>
  
            
            {/* Next button on the right */}
            <div className="flex">
              <Button
                variant="destructive"
                onClick={handleNext}
                disabled={isSubmitting}
                className="border border-destructive"
              >
                {isLastStep ? (isSubmitting ? "Generating..." : "Generate Report") : "Next"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress sidebar - hidden on mobile */}
      <div className="hidden w-80 border-l border-gray-200 bg-white p-4 md:block">
        <div className="sticky top-4">
          <h3 className="mb-4 text-base font-medium text-gray-900">Assessment Progress</h3>
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium text-gray-700">Step {currentStepIndex + 1} of {steps.length}</span>
              <span className="text-gray-500">{Math.round((currentStepIndex / (steps.length - 1)) * 100)}% complete</span>
            </div>
            <div className="progress-indicator">
              <div 
                className="progress-bar" 
                style={{ width: `${Math.round((currentStepIndex / (steps.length - 1)) * 100)}%` }}
              />
            </div>
          </div>
          <ProgressIndicator steps={steps} currentStepIndex={currentStepIndex} />
        </div>
      </div>
    </div>
  );
};

export default WizardLayout;
