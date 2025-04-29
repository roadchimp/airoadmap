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
    <div className="flex flex-col min-h-screen bg-white">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </div>
      
      {/* Progress indicator */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto">
          <ProgressIndicator 
            steps={steps} 
            currentStepIndex={currentStepIndex} 
          />
        </div>
      </div>
      
      {/* Footer with navigation buttons */}
      <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
        <div className="max-w-4xl mx-auto px-6 flex justify-between">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isFirstStep}
            className="text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            Back
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLastStep ? (isSubmitting ? "Generating..." : "Generate Report") : "Next"}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default WizardLayout;
