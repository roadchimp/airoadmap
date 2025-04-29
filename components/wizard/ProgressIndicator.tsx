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
  // Calculate progress percentage
  const percentComplete = Math.round((currentStepIndex / (steps.length - 1)) * 100);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Progress header with percentage */}
      <div className="p-4 pb-3 border-b border-gray-100">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-gray-700 text-sm font-medium">Assessment Progress</h3>
          <span className="text-gray-500 text-xs">{percentComplete}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full">
          <div 
            className="h-full bg-red-500 rounded-full transition-all duration-300"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>
      
      {/* Steps */}
      <div className="p-4 py-3 border-b border-gray-100 text-sm text-gray-600">
        Step {currentStepIndex + 1} of {steps.length}
      </div>
      
      {/* Step list */}
      <div className="py-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;
          
          return (
            <div 
              key={step.id}
              className={`px-4 py-2 flex items-center ${
                isCurrent ? 'bg-red-50' : ''
              }`}
            >
              {/* Status dot */}
              <div className="mr-3">
                {isCurrent && (
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                )}
                {isCompleted && (
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                )}
                {isPending && (
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                )}
              </div>
              
              {/* Step title */}
              <div className={`text-sm ${
                isCurrent ? 'text-red-700 font-medium' : 
                isCompleted ? 'text-gray-700' : 
                'text-gray-400'
              }`}>
                {step.title}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Large chevron arrow */}
      <div className="flex justify-center p-4">
        <svg 
          className="w-16 h-16 text-gray-900" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 5l7 7-7 7" 
          />
        </svg>
      </div>
    </div>
  );
};

export default ProgressIndicator;
