'use client';

import React, { useEffect } from 'react';
import { useSession } from '@/lib/session/SessionContext';
import { wizardStepMap } from '@/lib/session/wizardStepMap';
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

  // Scroll to top when step changes
  useEffect(() => {
    // Scroll to the top of the page smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Also scroll any overflow containers to top
    const containers = document.querySelectorAll('[data-scroll-container]');
    containers.forEach(container => {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, [currentStepIndex]);

  // Use a ref to store the setStepData function to avoid dependency issues
  const setStepDataRef = React.useRef(setStepData);
  setStepDataRef.current = setStepData;

  // Load initial assessment data into session when editing
  useEffect(() => {
    if (initialAssessmentData) {
      console.log('Loading initial assessment data:', initialAssessmentData);
      
      // Load basic assessment info from the assessment record itself
      const basics = {
        name: initialAssessmentData.title,
        industry: initialAssessmentData.industry || 'Unknown',
        size: 'Medium', // Default size since it's not stored in assessment
        description: undefined, // Not stored in assessment
        industryMaturity: initialAssessmentData.industryMaturity || 'Immature',
        companyStage: initialAssessmentData.companyStage || 'Startup',
        strategicFocus: initialAssessmentData.strategicFocus || [],
        // Add other basic fields from the assessment
      };
      setStepDataRef.current(0, { basics }, true);

      // Load step data if it exists
      if (initialAssessmentData.stepData) {
        const stepData = initialAssessmentData.stepData as any;
        console.log('Step data found:', stepData);
        
        // Map database stepData to session format with proper validation
        if (stepData.roles) {
          setStepDataRef.current(1, { roleSelection: stepData.roles }, true);
        }
        if (stepData.painPoints) {
          setStepDataRef.current(2, { areasForImprovement: stepData.painPoints }, true);
        }
        if (stepData.workVolume) {
          setStepDataRef.current(3, { workVolume: stepData.workVolume }, true);
        }
        if (stepData.techStack) {
          setStepDataRef.current(4, { dataSystems: stepData.techStack }, true);
        }
        if (stepData.adoption) {
          setStepDataRef.current(5, { readiness: stepData.adoption }, true);
        }
        if (stepData.roiTargets || initialAssessmentData.aiAdoptionScoreInputs) {
          const roiData = {
            ...(stepData.roiTargets || {}),
            ...(initialAssessmentData.aiAdoptionScoreInputs || {})
          };
          setStepDataRef.current(6, { roiTargets: roiData }, true);
        }
      }
    }
  }, [initialAssessmentData?.id]); // Only run when assessment ID changes

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