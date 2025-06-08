'use client';

import React from 'react';
import { useSession } from '@/lib/session/SessionContext';
import  QuestionCard  from '../QuestionCard';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { WorkVolumeData } from '@/lib/session/sessionTypes';

export const WorkVolumeComplexityStep = () => {
  const { session, setStepData } = useSession();
  const { currentStepIndex } = session;

  const data = session.steps[currentStepIndex]?.data.workVolume || { taskVolume: 50, taskComplexity: 50 };

  const handleSliderChange = (key: 'taskVolume' | 'taskComplexity', value: number[]) => {
    const newData: WorkVolumeData = {
      ...data,
      [key]: value[0],
    };
    setStepData(currentStepIndex, { workVolume: newData }, true);
  };

  return (
    <QuestionCard
      title="Work Volume & Complexity"
      description="Estimate the average work volume and complexity for the selected roles."
    >
      <div className="space-y-8">
        <div className="space-y-4">
          <Label htmlFor="taskVolume" className="text-lg">Task Volume</Label>
          <p className="text-sm text-gray-600">
            On a scale of 1 to 100, how would you rate the volume of tasks? (e.g., low, medium, high)
          </p>
          <Slider
            id="taskVolume"
            min={0}
            max={100}
            step={1}
            value={[data.taskVolume || 50]}
            onValueChange={(value) => handleSliderChange('taskVolume', value)}
          />
          <div className="text-center font-semibold">{data.taskVolume}</div>
        </div>
        
        <div className="space-y-4">
          <Label htmlFor="taskComplexity" className="text-lg">Task Complexity</Label>
          <p className="text-sm text-gray-600">
            On a scale of 1 to 100, how would you rate the complexity of these tasks? (e.g., simple, moderate, complex)
          </p>
          <Slider
            id="taskComplexity"
            min={0}
            max={100}
            step={1}
            value={[data.taskComplexity || 50]}
            onValueChange={(value) => handleSliderChange('taskComplexity', value)}
          />
          <div className="text-center font-semibold">{data.taskComplexity}</div>
        </div>
      </div>
    </QuestionCard>
  );
};

export default WorkVolumeComplexityStep; 