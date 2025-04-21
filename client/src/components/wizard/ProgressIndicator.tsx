import React from "react";

interface Step {
  id: string;
  title: string;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStepIndex: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ 
  steps, 
  currentStepIndex 
}) => {
  const percentComplete = Math.round(((currentStepIndex + 1) / steps.length) * 100);
  
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        <div className="font-medium text-sm text-neutral-500">Assessment Progress</div>
        <div className="text-xs text-neutral-500">Step {currentStepIndex + 1} of {steps.length}</div>
      </div>
      
      <div className="mt-2 h-2 bg-neutral-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary-500 rounded-full" 
          style={{ width: `${percentComplete}%` }}
        ></div>
      </div>
      
      <div className={`mt-4 grid grid-cols-${steps.length} gap-1`}>
        {steps.map((step, index) => {
          // Determine step status
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;
          
          // Style classes based on status
          const circleClasses = isCompleted || isCurrent
            ? "bg-primary-500 text-white"
            : "bg-neutral-300 text-neutral-600";
          
          const textClasses = isCompleted || isCurrent
            ? "text-primary-600"
            : "text-neutral-500";
          
          return (
            <div key={step.id} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full ${circleClasses} flex items-center justify-center mb-1 text-xs`}>
                {isCompleted ? (
                  <span className="material-icons text-sm">check</span>
                ) : (
                  index + 1
                )}
              </div>
              <div className={`text-xs font-medium ${textClasses}`}>
                {step.title}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator;
