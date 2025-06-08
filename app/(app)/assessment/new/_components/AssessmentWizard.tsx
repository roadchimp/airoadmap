'use client';

import React, { useEffect } from 'react';
import { useSession } from '../../../../../lib/session/SessionContext';
import { wizardStepMap } from '../../../../../lib/session/wizardStepMap';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Assessment } from '@shared/schema';

interface AssessmentWizardProps {
  initialAssessmentData?: Assessment;
}

export const AssessmentWizard: React.FC<AssessmentWizardProps> = ({ 
  initialAssessmentData 
}) => {
  const { session, goToNextStep, goToPreviousStep, setStepData } = useSession();
  const { currentStepIndex, steps } = session;

  // Load initial assessment data into session when editing
  useEffect(() => {
    if (initialAssessmentData?.stepData) {
      const stepData = initialAssessmentData.stepData as any;
      
      // Map database stepData to session format
      if (stepData.basics) {
        setStepData(0, { basics: stepData.basics }, true, undefined, undefined);
      }
      if (stepData.roles) {
        // Convert role IDs back to role objects if needed
        setStepData(1, { roleSelection: { selectedRoles: [] } }, true, undefined, undefined);
      }
      if (stepData.painPoints) {
        setStepData(2, { areasForImprovement: stepData.painPoints }, true, undefined, undefined);
      }
      if (stepData.workVolume) {
        setStepData(3, { workVolume: stepData.workVolume }, true, undefined, undefined);
      }
      if (stepData.techStack) {
        setStepData(4, { dataSystems: stepData.techStack }, true, undefined, undefined);
      }
      if (stepData.adoption) {
        setStepData(5, { readiness: stepData.adoption }, true, undefined, undefined);
      }
      if (stepData.aiAdoptionScoreInputs) {
        setStepData(6, { roiTargets: stepData.aiAdoptionScoreInputs }, true, undefined, undefined);
      }
    }
  }, [initialAssessmentData, setStepData]);

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