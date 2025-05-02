'use client'; // Required if using hooks like useRouter

import React from 'react';
import { useRouter } from 'next/navigation'; // Import the router

interface ProgressIndicatorProps {
  steps: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  currentStepIndex: number;
  assessmentId?: number; // Add assessmentId as an optional prop
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ 
  steps, 
  currentStepIndex,
  assessmentId // Destructure the new prop
}) => {
  const router = useRouter(); // Initialize the router

  const handleStepClick = (stepId: string, stepIndex: number) => {
    // Only allow navigation if the step is completed AND we have an assessmentId
    if (stepIndex < currentStepIndex && assessmentId) {
      router.push(`/assessment/${assessmentId}?step=${stepId}`);
    }
    // Do nothing if the step is not completed or assessmentId is missing
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="divide-y divide-gray-100">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          // const isPending = index > currentStepIndex; // isPending is unused
          
          let statusClass = "upcoming";
          if (isCurrent) statusClass = "active";
          if (isCompleted) statusClass = "completed";

          // Determine if the step should be clickable
          const isClickable = isCompleted && !!assessmentId;

          return (
            <div 
              key={step.id}
              className={`step-indicator ${statusClass} ${isClickable ? 'cursor-pointer hover:bg-gray-50' : ''}`} // Add cursor and hover effect if clickable
              onClick={() => handleStepClick(step.id, index)} // Add onClick handler
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
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"className="text-white"> {/* Ensure icon color contrasts */}
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
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator;
