// steps/assessment-config-step.tsx
import React from 'react';
import { useSession } from '@/lib/session/SessionContext';

export const AssessmentConfigStep = () => {
  const { session, updateStepData } = useSession();
  const stepData = session.steps.find(s => s.id === 'assessment-config')?.data || {};

  return (
    <div className="space-y-6">
      <div>
        <label className="block mb-2">Assessment Duration (minutes)</label>
        <input
          type="number"
          min="15"
          max="120"
          value={stepData.duration || 30}
          onChange={(e) => updateStepData('assessment-config', { duration: Number(e.target.value) })}
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
                checked={stepData.questionTypes?.includes(type) || false}
                onChange={(e) => {
                  const currentTypes = stepData.questionTypes || [];
                  const updatedTypes = e.target.checked
                    ? [...currentTypes, type]
                    : currentTypes.filter((t: string) => t !== type);
                  updateStepData('assessment-config', { questionTypes: updatedTypes });
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