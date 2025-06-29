'use client';

import React from 'react';
import { useSession } from '@/lib/session/SessionContext';
import { WizardStep } from '@/lib/session/sessionTypes';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
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

  const handleArrayFieldChange = (field: string, values: string[]) => {
    setStepData(currentStepIndex, {
      roiTargets: {
        ...currentData,
        [field]: values
      }
    }, true);
  };

  const handleObjectArrayFieldChange = (field: string, values: Array<{ name: string }>) => {
    setStepData(currentStepIndex, {
      roiTargets: {
        ...currentData,
        [field]: values
      }
    }, true);
  };

  const addPrimaryGoal = () => {
    const currentGoals = currentData.primaryGoals || [];
    handleArrayFieldChange('primaryGoals', [...currentGoals, '']);
  };

  const updatePrimaryGoal = (index: number, value: string) => {
    const currentGoals = currentData.primaryGoals || [];
    const updatedGoals = [...currentGoals];
    updatedGoals[index] = value;
    handleArrayFieldChange('primaryGoals', updatedGoals);
  };

  const removePrimaryGoal = (index: number) => {
    const currentGoals = currentData.primaryGoals || [];
    const updatedGoals = currentGoals.filter((_, i) => i !== index);
    handleArrayFieldChange('primaryGoals', updatedGoals);
  };

  const addKeyMetric = () => {
    const currentMetrics = currentData.keyMetrics || [];
    handleObjectArrayFieldChange('keyMetrics', [...currentMetrics, { name: '' }]);
  };

  const updateKeyMetric = (index: number, value: string) => {
    const currentMetrics = currentData.keyMetrics || [];
    const updatedMetrics = [...currentMetrics];
    updatedMetrics[index] = { name: value };
    handleObjectArrayFieldChange('keyMetrics', updatedMetrics);
  };

  const removeKeyMetric = (index: number) => {
    const currentMetrics = currentData.keyMetrics || [];
    const updatedMetrics = currentMetrics.filter((_, i) => i !== index);
    handleObjectArrayFieldChange('keyMetrics', updatedMetrics);
  };

  return (
    <QuestionCard 
      title="ROI Targets" 
      description="Define your expected return on investment and success metrics"
    >
      <div className="space-y-8">
        {/* ROI Expectations Section */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">ROI Expectations</h3>
            <div className="space-y-4">
              {/* Expected ROI */}
              <div>
                <Label htmlFor="expectedROI" className="text-base font-medium text-gray-900">
                  Expected ROI
                </Label>
                <Input
                  id="expectedROI"
                  placeholder="e.g., 300% over 2 years, $500K annual savings"
                  value={currentData.expectedROI || ''}
                  onChange={(e) => handleFieldChange('expectedROI', e.target.value)}
                  className="mt-2"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Describe your expected return on investment from AI implementation
                </p>
              </div>

              {/* Time to Value */}
              <div>
                <Label htmlFor="timeToValue" className="text-base font-medium text-gray-900">
                  Time to Value
                </Label>
                <Input
                  id="timeToValue"
                  placeholder="e.g., 6 months, 1 year, 18 months"
                  value={currentData.timeToValue || ''}
                  onChange={(e) => handleFieldChange('timeToValue', e.target.value)}
                  className="mt-2"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Expected timeline to see meaningful returns from AI investment
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Primary Goals Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Primary Goals</h3>
              <Button onClick={addPrimaryGoal} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            </div>
            <div className="space-y-3">
              {(currentData.primaryGoals || []).map((goal: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="e.g., Increase productivity by 30%"
                    value={goal}
                    onChange={(e) => updatePrimaryGoal(index, e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => removePrimaryGoal(index)} 
                    size="sm" 
                    variant="outline"
                    className="px-3"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {(!currentData.primaryGoals || currentData.primaryGoals.length === 0) && (
                <p className="text-gray-500 text-sm">No goals added yet. Click "Add Goal" to get started.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Key Metrics</h3>
              <Button onClick={addKeyMetric} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Metric
              </Button>
            </div>
            <div className="space-y-3">
              {(currentData.keyMetrics || []).map((metric: { name: string }, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="e.g., Customer response time, Deal closure rate"
                    value={metric.name}
                    onChange={(e) => updateKeyMetric(index, e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => removeKeyMetric(index)} 
                    size="sm" 
                    variant="outline"
                    className="px-3"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {(!currentData.keyMetrics || currentData.keyMetrics.length === 0) && (
                <p className="text-gray-500 text-sm">No metrics added yet. Click "Add Metric" to get started.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Adoption Score Inputs Section */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">AI Adoption Score Inputs</h3>
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
              </div>
            </div>
          </CardContent>
        </Card>

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