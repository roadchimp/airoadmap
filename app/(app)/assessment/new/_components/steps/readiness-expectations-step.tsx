'use client';

import React from 'react';
import { useSession } from '@/lib/session/SessionContext';
import { WizardStep } from '@/lib/session/sessionTypes';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import QuestionCard from '@/app/(app)/assessment/new/_components/QuestionCard';

const ReadinessExpectationsStep = () => {
  const { session, setStepData } = useSession();
  const currentStepIndex = WizardStep.READINESS_EXPECTATIONS;
  const currentData = session.steps[currentStepIndex]?.data.readiness || {};

  const handleFieldChange = (field: string, value: string) => {
    setStepData(currentStepIndex, {
      readiness: {
        ...currentData,
        [field]: value
      }
    }, true);
  };

  return (
    <QuestionCard 
      title="Readiness & Expectations" 
      description="Help us understand your organization's readiness for AI adoption and expected challenges."
    >
      <div className="space-y-6">
        {/* Organizational Readiness for Change */}
        <div>
          <Label className="text-base font-medium text-gray-900">Organizational Readiness for Change</Label>
          <Select 
            value={currentData.organizationalReadiness || ''} 
            onValueChange={(value) => handleFieldChange('organizationalReadiness', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select readiness level..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High (Proactive, adaptable culture)">
                High (Proactive, adaptable culture)
              </SelectItem>
              <SelectItem value="Medium (Some resistance, needs clear communication)">
                Medium (Some resistance, needs clear communication)
              </SelectItem>
              <SelectItem value="Low (Resistant to change, requires significant effort)">
                Low (Resistant to change, requires significant effort)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stakeholder Alignment on AI Goals */}
        <div>
          <Label className="text-base font-medium text-gray-900">Stakeholder Alignment on AI Goals</Label>
          <Select 
            value={currentData.stakeholderAlignment || ''} 
            onValueChange={(value) => handleFieldChange('stakeholderAlignment', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select alignment level..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High (Clear consensus, shared vision)">
                High (Clear consensus, shared vision)
              </SelectItem>
              <SelectItem value="Medium (General agreement, some differing priorities)">
                Medium (General agreement, some differing priorities)
              </SelectItem>
              <SelectItem value="Low (Significant disagreement or lack of clarity)">
                Low (Significant disagreement or lack of clarity)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Anticipated Training Needs */}
        <div>
          <Label htmlFor="anticipatedTrainingNeeds" className="text-base font-medium text-gray-900">
            Anticipated Training Needs
          </Label>
          <Textarea
            id="anticipatedTrainingNeeds"
            placeholder="Describe potential training requirements for employees to adopt new AI tools or processes..."
            value={currentData.anticipatedTrainingNeeds || ''}
            onChange={(e) => handleFieldChange('anticipatedTrainingNeeds', e.target.value)}
            className="mt-2"
            rows={4}
          />
        </div>

        {/* Expected Adoption Challenges */}
        <div>
          <Label htmlFor="expectedAdoptionChallenges" className="text-base font-medium text-gray-900">
            Expected Adoption Challenges
          </Label>
          <Textarea
            id="expectedAdoptionChallenges"
            placeholder="List potential hurdles to successful AI adoption (e.g., technical integration, user resistance, budget constraints)..."
            value={currentData.expectedAdoptionChallenges || ''}
            onChange={(e) => handleFieldChange('expectedAdoptionChallenges', e.target.value)}
            className="mt-2"
            rows={4}
          />
        </div>

        {/* Key Success Metrics for AI Initiatives */}
        <div>
          <Label htmlFor="keySuccessMetrics" className="text-base font-medium text-gray-900">
            Key Success Metrics for AI Initiatives
          </Label>
          <Textarea
            id="keySuccessMetrics"
            placeholder="How will the success of AI adoption be measured? (e.g., % time saved, cost reduction, improved quality score)..."
            value={currentData.keySuccessMetrics || ''}
            onChange={(e) => handleFieldChange('keySuccessMetrics', e.target.value)}
            className="mt-2"
            rows={4}
          />
        </div>
      </div>
    </QuestionCard>
  );
};

export default ReadinessExpectationsStep; 