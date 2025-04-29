import React from 'react';

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
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="divide-y divide-gray-100">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;
          
          let statusClass = "upcoming";
          if (isCurrent) statusClass = "active";
          if (isCompleted) statusClass = "completed";
          
          return (
            <div 
              key={step.id}
              className={`step-indicator ${statusClass}`}
            >
              <div className={`step-number ${statusClass}`}>
                {isCompleted ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
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
