'use client';

import React from 'react';
import { useSession } from '@/lib/session/SessionContext';
import WizardStepIndicator from './wizard-step-indicator';
import BasicInfoStep from './steps/basic-info-step';
import DepartmentSelectionStep from './steps/department-selection-step';
import RoleSelectionStep from './steps/role-selection-step';
import AssessmentConfigStep from './steps/assessment-config-step';
import ReviewStep from './steps/review-step';
import WizardNavigation from './wizard-navigation';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ErrorBoundary from '@/components/ui/error-boundary';

interface StepComponent {
  id: string;
  component: React.ComponentType;
}

const stepComponents: StepComponent[] = [
  { id: 'basic-info', component: BasicInfoStep },
  { id: 'department-selection', component: DepartmentSelectionStep },
  { id: 'role-selection', component: RoleSelectionStep },
  // { id: 'assessment-config', component: AssessmentConfigStep },
  // { id: 'review', component: ReviewStep }
];

const AssessmentWizard: React.FC = () => {
  const { 
    session, 
    isLoading, 
    error,
    goToNextStep,
    goToPreviousStep,
    goToStep
  } = useSession();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading assessment wizard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-800 mb-2">
          Error Loading Wizard
        </h3>
        <p className="text-red-700">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const currentStepData = session.steps[session.currentStep];
  const CurrentStepComponent = stepComponents[session.currentStep]?.component;

  if (!CurrentStepComponent) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Invalid step configuration</p>
      </div>
    );
  }

  const canProceed = currentStepData.isValid || currentStepData.isCompleted;
  const isLastStep = session.currentStep === session.totalSteps - 1;

  return (
    <ErrorBoundary>
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Step Indicator */}
        <div className="border-b border-gray-200 px-6 py-4">
          <WizardStepIndicator 
            steps={session.steps}
            currentStep={session.currentStep}
            onStepClick={goToStep}
          />
        </div>

        {/* Auto-save indicator */}
        {session.isAutoSaving && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-2">
            <div className="flex items-center text-sm text-blue-700">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
              Auto-saving...
            </div>
          </div>
        )}

        {/* Current Step Content */}
        <div className="px-6 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              {currentStepData.name}
            </h2>
            <div className="mt-1 flex items-center text-sm text-gray-500">
              <span>Step {session.currentStep + 1} of {session.totalSteps}</span>
              {session.lastSaved && (
                <span className="ml-4">
                  Last saved: {new Date(session.lastSaved).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          {/* Step Errors */}
          {Object.keys(currentStepData.errors).length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                Please correct the following errors:
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                {Object.entries(currentStepData.errors).map(([field, errors]) => (
                  <li key={field}>
                    <strong>{field}:</strong> {errors.join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Step Component */}
          <CurrentStepComponent />
        </div>

        {/* Navigation */}
        <div className="border-t border-gray-200 px-6 py-4">
          <WizardNavigation
            canGoBack={session.currentStep > 0}
            canProceed={canProceed}
            isLastStep={isLastStep}
            onBack={goToPreviousStep}
            onNext={goToNextStep}
            isLoading={session.isAutoSaving}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AssessmentWizard; 