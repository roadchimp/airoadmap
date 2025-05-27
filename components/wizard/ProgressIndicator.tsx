'use client'; // Required if using hooks like useRouter

import React from 'react';
import { useRouter } from 'next/navigation'; // Import the router
import { useToast } from "@/hooks/use-toast"; // Import useToast

interface ProgressIndicatorProps {
  steps: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  currentStepIndex: number;
  assessmentId: number; // Add assessmentId as an optional prop
  onSaveBeforeNavigate?: () => Promise<void>; // Add this prop
  maxReachedStepIndex: number; // Add prop (make non-optional as WizardLayout provides default)
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ 
  steps, 
  currentStepIndex,
  assessmentId, // Destructure the new prop
  onSaveBeforeNavigate, // Destructure the new prop
  maxReachedStepIndex // Destructure the new prop
}) => {
  const router = useRouter(); // Initialize the router
  const { toast } = useToast(); // Initialize toast

  // Updated handler to save before navigating
  const handleStepClick = async (stepId: string, stepIndex: number) => {
    // Allow navigation if:
    // 1. It's not the current step
    // 2. The target step index is less than OR EQUAL to the maximum reached step index
    if (stepIndex !== currentStepIndex && stepIndex <= maxReachedStepIndex) {
      try {
        await onSaveBeforeNavigate?.();
        // Build base path depending on whether we're editing an existing assessment or creating a new one
        const basePath = assessmentId ? `/assessment/${assessmentId}` : "/assessment/new";
        router.push(`${basePath}?step=${stepId}`);
      } catch (error) {
        console.error("Error saving before navigating via progress indicator:", error);
        toast({ title: "Save Error", description: "Could not save progress before navigating.", variant: "destructive" });
      }
    } else if (stepIndex > maxReachedStepIndex) {
        // Notify user if they click a future (not yet reached) step
        toast({ title: "Navigation Restricted", description: "Please complete prior steps before navigating here.", variant: "default" });
    }
    // If stepIndex === currentStepIndex, do nothing (already on that step)
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="divide-y divide-gray-100">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex; // Completed is still based on *current*
          const isCurrent = index === currentStepIndex;

          let statusClass = "upcoming";
          if (isCurrent) statusClass = "active";
          if (isCompleted) statusClass = "completed";

          // Determine if the step should be clickable
          // Allow clicking any step UP TO AND INCLUDING the maximum reached step
          const isClickable = index <= maxReachedStepIndex;

          return (
            <div
              key={step.id}
              className={`step-indicator ${statusClass} ${isClickable ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              onClick={isClickable ? () => handleStepClick(step.id, index) : undefined}
              role={isClickable ? "button" : undefined} // Add role for accessibility
              tabIndex={isClickable ? 0 : undefined} // Make clickable items focusable
              onKeyDown={(e) => { // Allow activation with Enter/Space for accessibility
                  if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                      handleStepClick(step.id, index);
                  }
              }}
            >
              <div className={`step-number ${statusClass}`}>
                {isCompleted ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className={`truncate text-sm font-medium ${isCurrent ? 'text-primary' : isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                  {step.title}
                </div>
              </div>
            </div> // Closing tag for the step div
          ); // Closing parenthesis for map return
        })} {/* Closing curly brace for map function */}
      </div> {/* Closing tag for divide-y div */}
    </div> // Closing tag for outer div
  ); // Closing parenthesis for return statement
};

export default ProgressIndicator;