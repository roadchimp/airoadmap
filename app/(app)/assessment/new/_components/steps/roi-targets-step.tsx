'use client';

import React from 'react';
import { useSession } from '../../../../../../lib/session/SessionContext';
import  QuestionCard  from '../QuestionCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RoiTargetsData } from '../../../../../../lib/session/sessionTypes';

export const RoiTargetsStep = () => {
  const { session, setStepData } = useSession();
  const { currentStepIndex } = session;

  const data = session.steps[currentStepIndex]?.data.roiTargets || { costSavings: 0, revenueGrowth: 0 };

  const handleInputChange = (key: 'costSavings' | 'revenueGrowth', value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;

    const newData: RoiTargetsData = {
      ...data,
      [key]: numValue,
    };
    setStepData(currentStepIndex, { roiTargets: newData }, true);
  };

  return (
    <QuestionCard
      title="ROI Targets"
      description="Define your desired return on investment from implementing AI."
    >
      <div className="space-y-8">
        <div className="space-y-4">
          <Label htmlFor="costSavings" className="text-lg">Target Cost Savings ($)</Label>
          <p className="text-sm text-gray-600">
            Enter the amount of annual cost savings you are targeting.
          </p>
          <Input
            id="costSavings"
            type="number"
            value={data.costSavings || ''}
            onChange={(e) => handleInputChange('costSavings', e.target.value)}
            placeholder="e.g., 50000"
          />
        </div>
        
        <div className="space-y-4">
          <Label htmlFor="revenueGrowth" className="text-lg">Target Revenue Growth ($)</Label>
          <p className="text-sm text-gray-600">
            Enter the amount of annual revenue growth you are targeting.
          </p>
          <Input
            id="revenueGrowth"
            type="number"
            value={data.revenueGrowth || ''}
            onChange={(e) => handleInputChange('revenueGrowth', e.target.value)}
            placeholder="e.g., 100000"
          />
        </div>
      </div>
    </QuestionCard>
  );
};

export default RoiTargetsStep; 