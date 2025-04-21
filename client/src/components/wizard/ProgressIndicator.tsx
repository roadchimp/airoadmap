import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  steps: Array<{
    id: string;
    title: string;
  }>;
  currentStepIndex: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ 
  steps, 
  currentStepIndex 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const percentComplete = Math.round(((currentStepIndex + 1) / steps.length) * 100);
  
  // Color mapping for different sections
  const getStepColor = (index: number) => {
    if (index < currentStepIndex) return 'bg-emerald-500'; // completed
    if (index === currentStepIndex) return 'bg-blue-500'; // current
    return 'bg-neutral-200'; // upcoming
  };

  return (
    <div className={cn(
      "fixed top-4 right-4 w-64 bg-white rounded-lg shadow-md transition-all duration-300",
      isExpanded ? "p-4" : "p-2 w-auto"
    )}>
      <div className="flex justify-between items-center mb-2">
        <div className={cn(
          "text-sm font-medium text-neutral-600",
          !isExpanded && "hidden"
        )}>Assessment Progress</div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "text-xs text-neutral-500",
            !isExpanded && "hidden"
          )}>Step {currentStepIndex + 1} of {steps.length}</div>
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
          className="h-full transition-all duration-300 ease-in-out rounded-full"
          style={{ 
            width: `${percentComplete}%`,
            backgroundColor: getStepColor(currentStepIndex)
          }}
        />
      </div>
      
      <div className={cn(
        "space-y-1.5",
        !isExpanded && "hidden"
      )}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          
          return (
            <div 
              key={step.id}
              className={cn(
                "flex items-center text-xs py-1 px-2 rounded transition-colors",
                isCurrent && "bg-blue-50 text-blue-700 font-medium",
                isCompleted && "text-emerald-700",
                !isCompleted && !isCurrent && "text-neutral-500"
              )}
            >
              <div 
                className={cn(
                  "w-1.5 h-1.5 rounded-full mr-2",
                  getStepColor(index)
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
