'use client';

import React from 'react';
import { useSession } from '@/lib/session/SessionContext';
import { WizardStep } from '@/lib/session/sessionTypes';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
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

  const addSuccessMetric = () => {
    const currentMetrics = currentData.successMetrics || [];
    setStepData(currentStepIndex, {
      readiness: {
        ...currentData,
        successMetrics: [...currentMetrics, { name: '' }]
      }
    }, true);
  };

  const updateSuccessMetric = (index: number, value: string) => {
    const currentMetrics = currentData.successMetrics || [];
    const updatedMetrics = [...currentMetrics];
    updatedMetrics[index] = { name: value };
    setStepData(currentStepIndex, {
      readiness: {
        ...currentData,
        successMetrics: updatedMetrics
      }
    }, true);
  };

  const removeSuccessMetric = (index: number) => {
    const currentMetrics = currentData.successMetrics || [];
    const updatedMetrics = currentMetrics.filter((_, i) => i !== index);
    setStepData(currentStepIndex, {
      readiness: {
        ...currentData,
        successMetrics: updatedMetrics
      }
    }, true);
  };

  return (
    <QuestionCard 
      title="Readiness & Expectations" 
      description="Help us understand your organization's readiness for AI adoption and expected challenges."
    >
      <div className="space-y-6">
        {/* Timeline Expectation */}
        <div>
          <Label htmlFor="timelineExpectation" className="text-base font-medium text-gray-900">
            Timeline Expectation
          </Label>
          <Input
            id="timelineExpectation"
            placeholder="e.g., 6 months, 1 year, 18 months"
            value={currentData.timelineExpectation || ''}
            onChange={(e) => handleFieldChange('timelineExpectation', e.target.value)}
            className="mt-2"
          />
          <p className="text-sm text-gray-600 mt-1">
            Expected timeline for AI implementation and initial results
          </p>
        </div>

        {/* Budget Range */}
        <div>
          <Label htmlFor="budgetRange" className="text-base font-medium text-gray-900">
            Budget Range
          </Label>
          <Input
            id="budgetRange"
            placeholder="e.g., $50K-$100K, $100K-$500K, $500K+"
            value={currentData.budgetRange || ''}
            onChange={(e) => handleFieldChange('budgetRange', e.target.value)}
            className="mt-2"
          />
          <p className="text-sm text-gray-600 mt-1">
            Estimated budget range for AI implementation
          </p>
        </div>

        {/* Risk Tolerance */}
        <div>
          <Label className="text-base font-medium text-gray-900">Risk Tolerance</Label>
          <Select 
            value={currentData.riskTolerance || ''} 
            onValueChange={(value) => handleFieldChange('riskTolerance', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select risk tolerance level..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low (Conservative approach, proven solutions only)">
                Low (Conservative approach, proven solutions only)
              </SelectItem>
              <SelectItem value="Medium (Balanced approach, some experimentation)">
                Medium (Balanced approach, some experimentation)
              </SelectItem>
              <SelectItem value="High (Aggressive adoption, willing to try cutting-edge solutions)">
                High (Aggressive adoption, willing to try cutting-edge solutions)
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-600 mt-1">
            Organization's appetite for risk in AI adoption
          </p>
        </div>

        {/* Success Metrics */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className="text-base font-medium text-gray-900">Success Metrics</Label>
            <Button onClick={addSuccessMetric} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Metric
            </Button>
          </div>
          <div className="space-y-3">
            {(currentData.successMetrics || []).map((metric: { name: string }, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="e.g., 30% reduction in processing time, 95% user adoption rate"
                  value={metric.name}
                  onChange={(e) => updateSuccessMetric(index, e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={() => removeSuccessMetric(index)} 
                  size="sm" 
                  variant="outline"
                  className="px-3"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {(!currentData.successMetrics || currentData.successMetrics.length === 0) && (
              <p className="text-gray-500 text-sm">No metrics added yet. Click "Add Metric" to get started.</p>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            How will the success of AI adoption be measured?
          </p>
        </div>

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

        {/* Key Success Metrics (Legacy field - keeping for backward compatibility) */}
        <div>
          <Label htmlFor="keySuccessMetrics" className="text-base font-medium text-gray-900">
            Additional Notes on Success Metrics
          </Label>
          <Textarea
            id="keySuccessMetrics"
            placeholder="Any additional details about how success will be measured..."
            value={currentData.keySuccessMetrics || ''}
            onChange={(e) => handleFieldChange('keySuccessMetrics', e.target.value)}
            className="mt-2"
            rows={3}
          />
        </div>
      </div>
    </QuestionCard>
  );
};

export default ReadinessExpectationsStep; 