'use client';

import React from 'react';
import { useSession } from '@/lib/session/SessionContext';
import { WizardStep } from '@/lib/session/sessionTypes';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import QuestionCard from '@/app/(app)/assessment/new/_components/QuestionCard';

const RoiTargetsStep = () => {
  const { session, setStepData } = useSession();
  const currentStepIndex = WizardStep.ROI_TARGETS;
  const currentData = session.steps[currentStepIndex]?.data.roiTargets || {};

  const handleFieldChange = (field: string, value: string | number) => {
    setStepData(currentStepIndex, {
      roiTargets: {
        ...currentData,
        [field]: value
      }
    }, true);
  };

  return (
    <QuestionCard 
      title="ROI Targets" 
      description="Provide inputs for AI Adoption Score calculation"
    >
      <div className="space-y-6">
        {/* Adoption Rate Forecast */}
        <div>
          <Label htmlFor="adoptionRateForecast" className="text-base font-medium text-gray-900">
            Adoption Rate Forecast (%)
          </Label>
          <Input
            id="adoptionRateForecast"
            type="number"
            placeholder="Enter percentage (e.g., 75)"
            value={currentData.adoptionRateForecast || ''}
            onChange={(e) => handleFieldChange('adoptionRateForecast', parseFloat(e.target.value) || 0)}
            className="mt-2"
          />
          <p className="text-sm text-gray-600 mt-1">
            Estimated percentage of potential users who will adopt the AI solution
          </p>
        </div>

        {/* Time Savings */}
        <div>
          <Label htmlFor="timeSavings" className="text-base font-medium text-gray-900">
            Time Savings (hours/week/user)
          </Label>
          <Input
            id="timeSavings"
            type="number"
            placeholder="Enter hours (e.g., 5)"
            value={currentData.timeSavings || ''}
            onChange={(e) => handleFieldChange('timeSavings', parseFloat(e.target.value) || 0)}
            className="mt-2"
          />
          <p className="text-sm text-gray-600 mt-1">
            Estimated hours saved per user per week
          </p>
        </div>

        {/* Affected Users */}
        <div>
          <Label htmlFor="affectedUsers" className="text-base font-medium text-gray-900">
            Affected Users (count)
          </Label>
          <Input
            id="affectedUsers"
            type="number"
            placeholder="Enter number of users (e.g., 50)"
            value={currentData.affectedUsers || ''}
            onChange={(e) => handleFieldChange('affectedUsers', parseInt(e.target.value) || 0)}
            className="mt-2"
          />
          <p className="text-sm text-gray-600 mt-1">
            Number of users who will be affected by the AI solution
          </p>
        </div>

        {/* Cost Efficiency Gains */}
        <div>
          <Label htmlFor="costEfficiencyGains" className="text-base font-medium text-gray-900">
            Cost Efficiency Gains ($)
          </Label>
          <Input
            id="costEfficiencyGains"
            type="number"
            placeholder="Enter dollar amount (e.g., 10000)"
            value={currentData.costEfficiencyGains || ''}
            onChange={(e) => handleFieldChange('costEfficiencyGains', parseFloat(e.target.value) || 0)}
            className="mt-2"
          />
          <p className="text-sm text-gray-600 mt-1">
            Estimated direct cost savings per year
          </p>
        </div>

        {/* Performance Improvement */}
        <div>
          <Label htmlFor="performanceImprovement" className="text-base font-medium text-gray-900">
            Performance Improvement (%)
          </Label>
          <Input
            id="performanceImprovement"
            type="number"
            placeholder="Enter percentage (e.g., 20)"
            value={currentData.performanceImprovement || ''}
            onChange={(e) => handleFieldChange('performanceImprovement', parseFloat(e.target.value) || 0)}
            className="mt-2"
          />
          <p className="text-sm text-gray-600 mt-1">
            Estimated percentage improvement in a key performance metric
          </p>
        </div>

        {/* Tool Sprawl Reduction */}
        <div>
          <Label className="text-base font-medium text-gray-900">Tool Sprawl Reduction (1-5)</Label>
          <Select 
            value={currentData.toolSprawlReduction ? String(currentData.toolSprawlReduction) : ''} 
            onValueChange={(value) => handleFieldChange('toolSprawlReduction', parseInt(value))}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select a value..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 - Minimal</SelectItem>
              <SelectItem value="2">2 - Below Average</SelectItem>
              <SelectItem value="3">3 - Average</SelectItem>
              <SelectItem value="4">4 - Above Average</SelectItem>
              <SelectItem value="5">5 - Significant</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-600 mt-1">
            Estimated benefit from consolidating or replacing existing tools
          </p>
          <p className="text-xs text-gray-500 mt-1">
            I = Impact factors (time savings, performance improvement)
          </p>
        </div>

        {/* AI Adoption Score Formula */}
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">AI Adoption Score Formula:</h3>
            <div className="bg-white p-4 rounded border font-mono text-sm">
              <p className="mb-2">
                AIAdoption Score = (α·U + β·I + γ·E + δ·S - ε·B) / IB
              </p>
              <p className="text-xs text-gray-600 mb-3">
                Where weights (α, β, γ, δ, ε) vary based on industry and company stage.
              </p>
              <div className="space-y-1 text-xs">
                <p><strong>U</strong> = User factors (adoption rate, affected users)</p>
                <p><strong>I</strong> = Impact factors (time savings, performance improvement)</p>
                <p><strong>E</strong> = Efficiency factors (cost savings)</p>
                <p><strong>S</strong> = Strategic factors (tool sprawl reduction)</p>
                <p><strong>B</strong> = Barriers</p>
                <p><strong>IB</strong> = Industry-specific normalization factor</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </QuestionCard>
  );
};

export default RoiTargetsStep; 