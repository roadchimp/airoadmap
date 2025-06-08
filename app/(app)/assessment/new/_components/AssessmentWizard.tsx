'use client';

import React from 'react';
import { useSession } from '../../../../../lib/session/SessionContext';
import { wizardStepMap } from '../../../../../lib/session/wizardStepMap';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const AssessmentWizard = () => {
  const { session, goToNextStep, goToPreviousStep } = useSession();
  const { currentStepIndex, steps } = session;

  const stepsArray = React.useMemo(() => Object.values(wizardStepMap), []);
  const CurrentStepComponent = stepsArray[currentStepIndex]?.component;

  if (!CurrentStepComponent) {
    return <div>Step not found</div>;
  }

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === stepsArray.length - 1;

  return (
    <div>
      <CurrentStepComponent />

      <div className="flex justify-between mt-8">
        <Button
          onClick={goToPreviousStep}
          disabled={isFirstStep}
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous Step
        </Button>
        <Button
          onClick={goToNextStep}
          disabled={!steps[currentStepIndex]?.isValid}
        >
          {isLastStep ? 'Finish & Review' : 'Next Step'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}; 