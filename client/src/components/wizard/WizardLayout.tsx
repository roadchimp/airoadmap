import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
  currentStepIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  isSaving?: boolean;
  children: React.ReactNode;
}

const WizardLayout: React.FC<WizardLayoutProps> = ({
  steps,
  currentStepIndex,
  onNext,
  onPrevious,
  onSubmit,
  isSubmitting = false,
  isSaving = false,
  children
}) => {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  
  // Auto-save notification
  useEffect(() => {
    if (isSaving) {
      toast({
        title: "Progress saved",
        description: "Your assessment progress has been saved.",
        duration: 3000
      });
    }
  }, [isSaving, toast]);
  
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  
  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Progress Indicator */}
      <ProgressIndicator 
        steps={steps} 
        currentStepIndex={currentStepIndex} 
      />
      
      {/* Current Step Content */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-2">{steps[currentStepIndex].title}</h2>
        <p className="text-neutral-600 mb-6">{steps[currentStepIndex].description}</p>
        
        {children}
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isFirstStep || isSubmitting}
        >
          {isFirstStep ? 'Cancel' : `Previous: ${steps[currentStepIndex - 1]?.title || 'Back'}`}
        </Button>
        
        {isLastStep ? (
          <Button 
            onClick={onSubmit} 
            disabled={isSubmitting}
            className="bg-primary-600 hover:bg-primary-700"
          >
            {isSubmitting ? 'Generating Report...' : 'Generate Report'}
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={isSubmitting}
            className="bg-primary-600 hover:bg-primary-700"
          >
            {`Next: ${steps[currentStepIndex + 1]?.title || 'Continue'}`}
          </Button>
        )}
      </div>
    </div>
  );
};

export default WizardLayout;
