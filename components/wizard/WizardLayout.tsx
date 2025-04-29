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
    <div className="flex min-h-screen">
      {/* Side Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* App title and logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md flex items-center justify-center bg-gradient-to-r from-orange-500 to-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900">AI Prioritize</h1>
              <p className="text-xs text-slate-500">Transformation Tool</p>
            </div>
          </div>
        </div>
        
        {/* Navigation links */}
        <nav className="flex-1 p-4 space-y-1">
          <a href="#" className="flex items-center p-2 rounded-md text-slate-700 hover:bg-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Dashboard
          </a>
          <a href="#" className="flex items-center p-2 rounded-md text-white bg-gradient-to-r from-orange-500 to-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            New Assessment
          </a>
          <a href="#" className="flex items-center p-2 rounded-md text-slate-700 hover:bg-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
            </svg>
            Previous Reports
          </a>
          <a href="#" className="flex items-center p-2 rounded-md text-slate-700 hover:bg-slate-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
            Libraries
          </a>
        </nav>
        
        {/* User info at bottom */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Consultant User</p>
              <p className="text-xs text-slate-500">consultant@example.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col bg-[#1a202c]">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-gray-700 bg-[#1e2533] p-4">
            <div className="mx-auto max-w-7xl px-4">
              <h1 className="text-2xl font-bold text-white">AI Transformation Assessment</h1>
            </div>
          </div>
          
          <div className="flex flex-1">
            {/* Main content */}
            <div className="flex-1 p-4 md:p-6">
              <div className="mx-auto max-w-4xl">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    Step {currentStepIndex + 1}: {steps[currentStepIndex].title}
                  </h2>
                  <p className="mt-1 text-slate-300">
                    Complete the assessment to identify opportunities for AI adoption in your organization.
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
                
                {/* Navigation */}
                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={onPrevious}
                    disabled={isFirstStep}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Back
                  </Button>
                  
                  <Button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
                  >
                    {isLastStep ? (isSubmitting ? "Generating..." : "Generate Report") : "Next"}
                  </Button>
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
        </div>
      </div>
    </div>
  );
};

export default WizardLayout;
