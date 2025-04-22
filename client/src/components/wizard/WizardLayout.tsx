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
    <div className="flex flex-col h-full">
      <ProgressIndicator steps={steps} currentStepIndex={currentStepIndex} />
      
      <div className="flex-1 p-6">
        {children}
      </div>
      
      <div className="border-t border-border p-4 flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isFirstStep}
        >
          Back
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={isSubmitting}
        >
          {isLastStep ? (isSubmitting ? "Generating..." : "Generate Report") : "Next"}
        </Button>
      </div>
    </div>
  );
};

export default WizardLayout;
