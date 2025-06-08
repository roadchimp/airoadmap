'use client';

import React from 'react';
import { useSession } from '@/lib/session/SessionContext';
import  QuestionCard  from '../QuestionCard';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ReadinessData } from '@/lib/session/sessionTypes';

export const ReadinessExpectationsStep = () => {
  const { session, setStepData } = useSession();
  const { currentStepIndex } = session;

  const data = session.steps[currentStepIndex]?.data.readiness || { changeReadiness: 5, aiExpectations: 5 };

  const handleSliderChange = (key: 'changeReadiness' | 'aiExpectations', value: number[]) => {
    const newData: ReadinessData = {
      ...data,
      [key]: value[0],
    };
    setStepData(currentStepIndex, { readiness: newData }, true);
  };

  return (
    <QuestionCard
      title="Readiness & Expectations"
      description="Assess your organization's readiness for change and expectations for AI."
    >
      <div className="space-y-8">
        <div className="space-y-4">
          <Label htmlFor="changeReadiness" className="text-lg">Change Readiness</Label>
          <p className="text-sm text-gray-600">
            On a scale of 1 to 10, how prepared is your organization to adopt new technologies and processes?
          </p>
          <Slider
            id="changeReadiness"
            min={1}
            max={10}
            step={1}
            value={[data.changeReadiness || 5]}
            onValueChange={(value) => handleSliderChange('changeReadiness', value)}
          />
          <div className="text-center font-semibold">{data.changeReadiness}</div>
        </div>
        
        <div className="space-y-4">
          <Label htmlFor="aiExpectations" className="text-lg">AI Expectations</Label>
          <p className="text-sm text-gray-600">
            On a scale of 1 to 10, what are the expectations for the impact of AI in the short term (1-2 years)?
          </p>
          <Slider
            id="aiExpectations"
            min={1}
            max={10}
            step={1}
            value={[data.aiExpectations || 5]}
            onValueChange={(value) => handleSliderChange('aiExpectations', value)}
          />
          <div className="text-center font-semibold">{data.aiExpectations}</div>
        </div>
      </div>
    </QuestionCard>
  );
};

export default ReadinessExpectationsStep; 