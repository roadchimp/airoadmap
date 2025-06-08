// steps/assessment-config-step.tsx
import React from 'react';
import { useSession } from '@/lib/session/SessionContext';

interface AssessmentConfigData {
  duration?: number;
  questionTypes?: string[];
}

export const AssessmentConfigStep = () => {
  const { session, setStepData } = useSession();
  const { currentStepIndex } = session;
  
  // Store assessment config data in reviewSubmit section which allows any properties
  const stepData = session.steps[currentStepIndex]?.data || {};
  const configData: AssessmentConfigData = stepData.reviewSubmit?.assessmentConfig || { 
    duration: 30, 
    questionTypes: [] 
  };

  const handleDurationChange = (duration: number) => {
    setStepData(currentStepIndex, { 
      reviewSubmit: { 
        ...stepData.reviewSubmit,
        assessmentConfig: { ...configData, duration } 
      }
    });
  };

  const handleQuestionTypesChange = (questionTypes: string[]) => {
    setStepData(currentStepIndex, { 
      reviewSubmit: { 
        ...stepData.reviewSubmit,
        assessmentConfig: { ...configData, questionTypes } 
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block mb-2">Assessment Duration (minutes)</label>
        <input
          type="number"
          min="15"
          max="120"
          value={configData.duration || 30}
          onChange={(e) => handleDurationChange(Number(e.target.value))}
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block mb-2">Question Types</label>
        <div className="space-y-2">
          {['Multiple Choice', 'Scenario Based', 'Technical Skills'].map(type => (
            <label key={type} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={configData.questionTypes?.includes(type) || false}
                onChange={(e) => {
                  const currentTypes = configData.questionTypes || [];
                  const updatedTypes = e.target.checked
                    ? [...currentTypes, type]
                    : currentTypes.filter((t: string) => t !== type);
                  handleQuestionTypesChange(updatedTypes);
                }}
              />
              <span>{type}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssessmentConfigStep;