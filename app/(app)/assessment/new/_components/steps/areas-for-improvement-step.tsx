'use client';

import React from 'react';
import { useSession } from '../../../../../../lib/session/SessionContext';
import QuestionCard from '../QuestionCard';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreasForImprovement } from '../../../../../../lib/session/sessionTypes';

// Placeholder data for general areas of improvement
const generalImprovementAreas = [
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

  // Get selected roles from the role selection step
  const roleSelectionStep = session.steps.find(step => step.id === 'roleSelection');
  const selectedRoles = roleSelectionStep?.data.roleSelection?.selectedRoles || [];

  const currentData = session.steps[currentStepIndex]?.data.areasForImprovement || {};
  const selectedAreas = currentData.selectedAreas || [];
  const roleSpecificPainPoints = currentData.roleSpecificPainPoints || {};

  const handleGeneralAreaSelection = (areaId: string) => {
    const isSelected = selectedAreas.includes(areaId);
    let newSelectedAreas: string[];

    if (isSelected) {
      newSelectedAreas = selectedAreas.filter((id: string) => id !== areaId);
    } else {
      newSelectedAreas = [...selectedAreas, areaId];
    }

    const newData: AreasForImprovement = { 
      ...currentData, 
      selectedAreas: newSelectedAreas 
    };
    setStepData(currentStepIndex, { areasForImprovement: newData }, newSelectedAreas.length > 0 || selectedRoles.length > 0);
  };

  const handleRolePainPointChange = (roleId: string, field: string, value: any) => {
    const updatedRolePainPoints = {
      ...roleSpecificPainPoints,
      [roleId]: {
        ...roleSpecificPainPoints[roleId],
        [field]: value
      }
    };

    const newData: AreasForImprovement = {
      ...currentData,
      roleSpecificPainPoints: updatedRolePainPoints
    };

    setStepData(currentStepIndex, { areasForImprovement: newData }, true);
  };

  return (
    <QuestionCard
      title="Areas for Improvement"
      description="Identify pain points and challenges for the selected roles and organization."
    >
      <div className="space-y-8">
        {/* Role-specific pain points */}
        {selectedRoles.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Role-Specific Pain Points</h3>
            <p className="text-sm text-gray-600">
              For each selected role, describe the specific challenges and rate their severity, frequency, and impact.
            </p>
            
            {selectedRoles.map((role: any) => {
              const roleId = String(role.id);
              const rolePainPoints = roleSpecificPainPoints[roleId] || {};
              
              return (
                <Card key={role.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="text-base">{role.title}</CardTitle>
                    <CardDescription>
                      Describe the primary pain points or challenges for this role.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor={`description-${roleId}`}>Description</Label>
                      <Textarea
                        id={`description-${roleId}`}
                        className="mt-1"
                        value={rolePainPoints.description || ""}
                        onChange={(e) => handleRolePainPointChange(roleId, 'description', e.target.value)}
                        placeholder="e.g., Time spent on repetitive tasks, difficulty accessing data..."
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`severity-${roleId}`}>Severity (1-5)</Label>
                        <Input
                          id={`severity-${roleId}`}
                          className="mt-1"
                          type="number"
                          min="1"
                          max="5"
                          value={rolePainPoints.severity || ""}
                          onChange={(e) => handleRolePainPointChange(roleId, 'severity', parseInt(e.target.value) || undefined)}
                          placeholder="1-5"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`frequency-${roleId}`}>Frequency (1-5)</Label>
                        <Input
                          id={`frequency-${roleId}`}
                          className="mt-1"
                          type="number"
                          min="1"
                          max="5"
                          value={rolePainPoints.frequency || ""}
                          onChange={(e) => handleRolePainPointChange(roleId, 'frequency', parseInt(e.target.value) || undefined)}
                          placeholder="1-5"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`impact-${roleId}`}>Impact (1-5)</Label>
                        <Input
                          id={`impact-${roleId}`}
                          className="mt-1"
                          type="number"
                          min="1"
                          max="5"
                          value={rolePainPoints.impact || ""}
                          onChange={(e) => handleRolePainPointChange(roleId, 'impact', parseInt(e.target.value) || undefined)}
                          placeholder="1-5"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* General organizational areas for improvement */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">General Areas for Improvement</h3>
          <p className="text-sm text-gray-600">
            Select the primary areas your organization is looking to improve with AI.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generalImprovementAreas.map((area) => (
              <div key={area.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`area-${area.id}`}
                  checked={selectedAreas.includes(area.id)}
                  onCheckedChange={() => handleGeneralAreaSelection(area.id)}
                />
                <Label htmlFor={`area-${area.id}`} className="font-normal">
                  {area.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {selectedRoles.length === 0 && (
          <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-md">
            <p className="text-lg mb-2">No roles selected</p>
            <p>Please go back to Step 2 (Role Selection) and select roles to identify role-specific pain points.</p>
          </div>
        )}
      </div>

      {/* General Organizational Pain Points */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <Label htmlFor="generalPainPoints" className="text-base font-medium text-gray-900">
          General Organizational Pain Points
        </Label>
        <Textarea
          id="generalPainPoints"
          placeholder="Describe any broader challenges not specific to a single role (e.g., communication silos, outdated tools)..."
          value={currentData.generalPainPoints || ''}
          onChange={(e) => {
            setStepData(currentStepIndex, {
              areasForImprovement: {
                ...currentData,
                generalPainPoints: e.target.value
              }
            }, true);
          }}
          className="mt-2"
          rows={4}
        />
      </div>
    </QuestionCard>
  );
};

export default AreasForImprovementStep; 