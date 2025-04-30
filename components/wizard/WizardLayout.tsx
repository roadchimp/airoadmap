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
  steps: Step[];
  children: React.ReactNode;
  currentStepIndex: number;
  onNext?: () => void;
  onPrevious?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  isSaving?: boolean;
}

const WizardLayout: React.FC<WizardLayoutProps> = ({
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
    <div className="flex flex-1">
      {/* Main content */}
      <div className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">
              Step {currentStepIndex + 1}: {steps[currentStepIndex].title}
            </h2>
            <p className="mt-1 text-slate-300">
              {steps[currentStepIndex].description} {/* Use dynamic description */}
            </p>
            
            {/* Progress bar for mobile only */}
            <div className="mt-4 md:hidden">
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-slate-200">Step {currentStepIndex + 1} of {steps.length}</span>
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
          <div className="rounded-lg border border-gray-700 bg-[#252e3f] p-6 shadow-sm">
            {children}
          </div>
          
          {/* Footer Navigation Area */}
          <div className="mt-6 flex items-center justify-between gap-3">
            {/* User Info on the left */}
            <div className="p-4"> {/* Removed border-t, adjusted padding */}
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  {/* TODO: Get user info dynamically */}
                  <p className="text-sm font-medium text-white">Consultant User</p>
                  <p className="text-xs text-slate-400">consultant@example.com</p>
                </div>
              </div>
            </div>
            
            {/* Buttons on the right */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onPrevious}
                disabled={isFirstStep}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Back
              </Button>
              
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
      <div className="hidden w-80 border-l border-gray-700 bg-[#1e2533] p-4 md:block">
        <div className="sticky top-4">
          <h3 className="mb-4 text-base font-medium text-white">Assessment Progress</h3>
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium text-slate-200">Step {currentStepIndex + 1} of {steps.length}</span>
              <span className="text-slate-400">{Math.round((currentStepIndex / (steps.length - 1)) * 100)}% complete</span>
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
