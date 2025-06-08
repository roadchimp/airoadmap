import React from 'react';
import { useSession } from '@/lib/session/SessionContext';
import { Check } from 'lucide-react';

interface WizardLayoutProps {
  children: React.ReactNode;
}

const WizardLayout: React.FC<WizardLayoutProps> = ({ children }) => {
  const { session, goToStep } = useSession();
  const totalSteps = session.steps.length;
  const currentStep = session.currentStepIndex;

  const stepNames = [
    'Organization Info',
    'Role Selection', 
    'Areas for Improvement',
    'Work Volume & Complexity',
    'Data & Systems',
    'Readiness & Expectations',
    'ROI Targets',
    'Review & Submit'
  ];

  const handleStepClick = (stepIndex: number) => {
    // Allow clicking to any step
    goToStep(stepIndex);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Horizontal Step Milestones at Top */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {stepNames.map((stepName, index) => {
              const isCompleted = session.steps[index]?.isCompleted || index < currentStep;
              const isCurrent = index === currentStep;
              const isClickable = true; // Allow all steps to be clickable
              
              return (
                <div key={index} className="flex items-center">
                  {/* Step Circle */}
                  <div 
                    className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                      isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'
                    } ${
                      isCurrent 
                        ? 'border-blue-600 bg-blue-600 text-white shadow-lg' 
                        : isCompleted
                        ? 'border-green-600 bg-green-600 text-white'
                        : 'border-gray-300 bg-white text-gray-500'
                    }`}
                    onClick={() => isClickable && handleStepClick(index)}
                  >
                    {isCompleted && !isCurrent ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  
                  {/* Step Name */}
                  <div className="ml-3 hidden lg:block">
                    <p className={`text-sm font-medium ${
                      isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {stepName}
                    </p>
                  </div>
                  
                  {/* Connector Line */}
                  {index < stepNames.length - 1 && (
                    <div className={`flex-1 mx-4 h-0.5 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Mobile Step Name */}
          <div className="mt-4 lg:hidden text-center">
            <p className="text-sm font-medium text-gray-600">
              Step {currentStep + 1} of {totalSteps}
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {stepNames[currentStep]}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
};

export default WizardLayout; 