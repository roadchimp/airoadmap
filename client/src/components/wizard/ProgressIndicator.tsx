import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  steps: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  currentStepIndex: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ 
  steps, 
  currentStepIndex 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Calculate progress percentage based on current step (1-based)
  const stepNumber = currentStepIndex + 1;
  const percentComplete = Math.round(((stepNumber - 1) / (steps.length - 1)) * 100);
  
  return (
    <div className={cn(
      "fixed top-4 right-4 w-64 bg-white rounded-lg shadow-md transition-all duration-300 z-50",
      isExpanded ? "p-4" : "p-2 w-auto"
    )}>
      <div className="flex justify-between items-center mb-2">
        <div className={cn(
          "text-sm font-medium text-neutral-600",
          !isExpanded && "hidden"
        )}>
          Assessment Progress
          <span className="ml-2 text-xs text-neutral-500">{percentComplete}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "text-xs text-neutral-500",
            !isExpanded && "hidden"
          )}>
            Step {stepNumber} of {steps.length}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <span className="material-icons text-lg">
              {isExpanded ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>
      </div>
      
      <div className={cn(
        "h-1.5 bg-neutral-100 rounded-full overflow-hidden",
        isExpanded ? "mb-3" : "mb-0 w-16"
      )}>
        <div 
          className="h-full bg-red-500 transition-all duration-300 ease-in-out rounded-full"
          style={{ width: `${percentComplete}%` }}
        />
      </div>
      
      <div className={cn(
        "space-y-1.5",
        !isExpanded && "hidden"
      )}>
        {steps.map((step, index) => {
          const stepIndex = index;
          const isCompleted = stepIndex < currentStepIndex;
          const isCurrent = stepIndex === currentStepIndex;
          
          return (
            <div 
              key={step.id}
              className={cn(
                "flex items-center text-xs py-1 px-2 rounded transition-colors",
                isCurrent && "bg-red-50 text-red-700 font-medium",
                isCompleted && "text-neutral-700",
                !isCompleted && !isCurrent && "text-neutral-500"
              )}
            >
              <div 
                className={cn(
                  "w-1.5 h-1.5 rounded-full mr-2",
                  isCurrent && "bg-red-500",
                  isCompleted && "bg-neutral-500",
                  !isCompleted && !isCurrent && "bg-neutral-300"
                )}
              />
              {step.title}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator;
