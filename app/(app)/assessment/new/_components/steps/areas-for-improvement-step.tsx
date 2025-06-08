'use client';

import React from 'react';
import { useSession } from '../../../../../../lib/session/SessionContext';
import QuestionCard from '../QuestionCard';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AreasForImprovement } from '../../../../../../lib/session/sessionTypes';

// Placeholder data for areas of improvement
const improvementAreas = [
  { id: 'efficiency', label: 'Improve operational efficiency' },
  { id: 'quality', label: 'Enhance quality of work' },
  { id: 'innovation', label: 'Foster innovation and creativity' },
  { id: 'decision_making', label: 'Improve data-driven decision making' },
  { id: 'customer_experience', label: 'Enhance customer experience' },
  { id: 'employee_engagement', label: 'Increase employee engagement' },
];

export const AreasForImprovementStep = () => {
  const { session, setStepData } = useSession();
  const { currentStepIndex } = session;

  const selectedAreas = session.steps[currentStepIndex]?.data.areasForImprovement?.selectedAreas || [];

  const handleSelection = (areaId: string) => {
    const isSelected = selectedAreas.includes(areaId);
    let newSelectedAreas: string[];

    if (isSelected) {
      newSelectedAreas = selectedAreas.filter((id: string) => id !== areaId);
    } else {
      newSelectedAreas = [...selectedAreas, areaId];
    }

    const newData: AreasForImprovement = { ...session.steps[currentStepIndex].data.areasForImprovement, selectedAreas: newSelectedAreas };
    setStepData(currentStepIndex, { areasForImprovement: newData }, newSelectedAreas.length > 0);
  };

  return (
    <QuestionCard
      title="Areas for Improvement"
      description="Select the primary areas your organization is looking to improve with AI."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {improvementAreas.map((area) => (
          <div key={area.id} className="flex items-center space-x-2">
            <Checkbox
              id={`area-${area.id}`}
              checked={selectedAreas.includes(area.id)}
              onCheckedChange={() => handleSelection(area.id)}
            />
            <Label htmlFor={`area-${area.id}`} className="font-normal">
              {area.label}
            </Label>
          </div>
        ))}
      </div>
    </QuestionCard>
  );
};

export default AreasForImprovementStep; 