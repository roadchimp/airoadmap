import React, { useState, useEffect } from "react";
import ProgressIndicator from "./ProgressIndicator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen } from "lucide-react";

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
  onSaveBeforeNavigate?: () => Promise<void>;
  maxReachedStepIndex?: number;
  validationError?: string | null;
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
  isSaving = false,
  assessmentId,
  onSaveBeforeNavigate,
  maxReachedStepIndex,
  validationError
}) => {
  const { toast } = useToast();
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);

  const handleNext = () => {
    if (isLastStep) {
      onSubmit?.();
    } else {
      onNext?.();
    }
  };

  const handlePreviousClick = async () => {
    if (onPrevious) {
      try {
        await onSaveBeforeNavigate?.();
        onPrevious();
      } catch (error) {
        console.error("Error saving before navigating back:", error);
        toast({ title: "Save Error", description: "Could not save progress before going back.", variant: "destructive" });
      }
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleFullscreenMode = () => {
    setFullscreenMode(!fullscreenMode);
    // Add a class to the document body to hide the left nav
    if (!fullscreenMode) {
      document.body.classList.add('hide-main-sidebar');
    } else {
      document.body.classList.remove('hide-main-sidebar');
    }
  };

  // Clean up body class when component unmounts
  useEffect(() => {
    return () => {
      document.body.classList.remove('hide-main-sidebar');
    };
  }, []);

  // Add stylesheet at component mount
  useEffect(() => {
    // Create a style element
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .hide-main-sidebar [class*="SidebarNav"] {
        display: none !important;
      }
      .hide-main-sidebar > div > div:first-child {
        width: 0 !important;
        min-width: 0 !important;
        overflow: hidden !important;
      }
    `;
    styleEl.setAttribute('id', 'wizard-fullscreen-styles');
    document.head.appendChild(styleEl);

    // Clean up
    return () => {
      const existingStyle = document.getElementById('wizard-fullscreen-styles');
      if (existingStyle) existingStyle.remove();
    };
  }, []);

  return (
    <div className="flex flex-1 bg-gray-100 relative">
      {/* Fullscreen toggle button */}
      <button
        onClick={toggleFullscreenMode}
        className="absolute top-2 left-2 z-30 p-1.5 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 focus:outline-none text-[#e84c2b] hover:text-[#d13c1c] transition-colors"
        aria-label={fullscreenMode ? "Exit fullscreen mode" : "Enter fullscreen mode"}
      >
        {fullscreenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>

      {/* Main content */}
      <div className={`flex-1 p-4 md:p-6 bg-transparent transition-all duration-300 ${
        sidebarCollapsed || fullscreenMode ? 'md:pr-6 md:max-w-none' : 'md:max-w-[calc(100%-20rem)]'
      }`}>
        <div className="mx-auto max-w-4xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Step {currentStepIndex + 1}: {steps[currentStepIndex].title}
            </h2>
            <p className="mt-1 text-gray-600">
              {steps[currentStepIndex].description}
            </p>
            
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
          
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            {children}
          </div>
          
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
                variant="outline"
                onClick={handlePreviousClick}
                disabled={isFirstStep || isSaving}
                className="border-gray-600 text-gray-700 hover:bg-gray-400"
              >
                Back
              </Button>
  
            <div className="flex flex-col items-end">
              {validationError && (
                <div className="mb-2 text-sm font-medium text-red-600">{validationError}</div>
              )}
              <Button
                variant="default"
                onClick={(e) => {
                  console.log("Button clicked directly");
                  // Call the actual handler
                  handleNext();
                }}
                disabled={isSubmitting}
                className="bg-[#e84c2b] text-white hover:bg-[#d13c1c]"
              >
                {isLastStep ? (isSubmitting ? "Generating..." : "Generate Report") : "Next"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sidebar with toggle button - hidden in fullscreen mode */}
      {!fullscreenMode && (
        <div className={`hidden md:flex flex-col transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-14' : 'w-80'
        }`}>
          {/* Sidebar content wrapper with border */}
          <div className="flex flex-1 relative border-l border-gray-200 bg-white">
            {/* Full sidebar content */}
            <div className={`flex-1 p-4 ${sidebarCollapsed ? 'hidden' : 'block'} flex flex-col h-full`}>
              <div className="sticky top-4 flex-1 overflow-auto">
                <h3 className="mb-4 text-base font-medium text-gray-900">Assessment Progress</h3>
                <div className="mb-4">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-gray-700">Step {currentStepIndex + 1} of {steps.length}</span>
                    <span className="text-gray-500">{Math.round((currentStepIndex / (steps.length - 1)) * 100)}% complete</span>
                  </div>
                  <div className="progress-indicator">
                    <div 
                      className="progress-bar bg-[#e84c2b]" 
                      style={{ width: `${Math.round((currentStepIndex / (steps.length - 1)) * 100)}%` }}
                    />
                  </div>
                </div>
                <ProgressIndicator
                  steps={steps}
                  currentStepIndex={currentStepIndex}
                  assessmentId={assessmentId ?? 0}
                  onSaveBeforeNavigate={onSaveBeforeNavigate}
                  maxReachedStepIndex={maxReachedStepIndex ?? currentStepIndex}
                />
              </div>
              
              {/* Sidebar toggle button at bottom */}
              <button
                onClick={toggleSidebar}
                className="mt-auto pt-4 flex items-center justify-between text-sm font-medium text-gray-600 hover:text-[#e84c2b] transition-colors group"
                aria-label="Hide sidebar"
              >
                <span>Hide Sidebar</span>
                <PanelLeftClose 
                  size={18} 
                  className="ml-2 text-gray-400 group-hover:text-[#e84c2b] transition-colors" 
                />
              </button>
            </div>

            {/* Mini sidebar when collapsed */}
            {sidebarCollapsed && (
              <div className="flex-1 flex flex-col items-center py-4 h-full">
                <div className="w-8 h-8 rounded-full bg-[#e84c2b] text-white flex items-center justify-center text-xs mb-6 mt-8">
                  {Math.round((currentStepIndex / (steps.length - 1)) * 100)}%
                </div>
                <div className="flex flex-col items-center space-y-3 overflow-y-auto flex-1">
                  {steps.map((_, index) => {
                    // Use a constant for better readability
                    const safeMaxReachedIndex = maxReachedStepIndex !== undefined ? maxReachedStepIndex : currentStepIndex;
                    
                    return (
                      <div 
                        key={index} 
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          index === currentStepIndex 
                            ? 'bg-[#e84c2b] text-white' 
                            : index <= safeMaxReachedIndex
                              ? 'bg-gray-200 text-gray-700' 
                              : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {index + 1}
                      </div>
                    );
                  })}
                </div>
                
                {/* Expand sidebar button at bottom of collapsed sidebar */}
                <button
                  onClick={toggleSidebar}
                  className="mt-auto pt-4 text-gray-600 hover:text-[#e84c2b] transition-colors"
                  aria-label="Show sidebar"
                >
                  <PanelLeftOpen size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen indicator - small pill showing current step when in fullscreen mode */}
      {fullscreenMode && (
        <div className="fixed bottom-4 right-4 bg-white rounded-full px-3 py-1.5 shadow-lg border border-gray-200 flex items-center space-x-2 z-30">
          <div className="w-6 h-6 rounded-full bg-[#e84c2b] text-white flex items-center justify-center text-xs">
            {currentStepIndex + 1}
          </div>
          <span className="text-sm font-medium text-gray-700">Step {currentStepIndex + 1} of {steps.length}</span>
        </div>
      )}
    </div>
  );
};

export default WizardLayout;
