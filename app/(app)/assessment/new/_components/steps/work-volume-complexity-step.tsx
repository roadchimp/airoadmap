'use client';

import React from 'react';
import { useSession } from '@/lib/session/SessionContext';
import  QuestionCard  from '../QuestionCard';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkVolumeData } from '@/lib/session/sessionTypes';

export const WorkVolumeComplexityStep = () => {
  const { session, setStepData } = useSession();
  const { currentStepIndex } = session;

  // Get selected roles from the role selection step
  const roleSelectionStep = session.steps.find(step => step.id === 'roleSelection');
  const selectedRoles = roleSelectionStep?.data.roleSelection?.selectedRoles || [];

  const data = session.steps[currentStepIndex]?.data.workVolume || { 
    taskVolume: 50, 
    taskComplexity: 50,
    roleWorkVolume: {}
  };

  const handleGeneralSliderChange = (key: 'taskVolume' | 'taskComplexity', value: number[]) => {
    const newData: WorkVolumeData = {
      ...data,
      [key]: value[0],
    };
    setStepData(currentStepIndex, { workVolume: newData }, true);
  };

  const handleRoleWorkVolumeChange = (roleId: string, field: string, value: any) => {
    const updatedRoleWorkVolume = {
      ...data.roleWorkVolume,
      [roleId]: {
        ...data.roleWorkVolume?.[roleId],
        [field]: value
      }
    };

    const newData: WorkVolumeData = {
      ...data,
      roleWorkVolume: updatedRoleWorkVolume
    };

    setStepData(currentStepIndex, { workVolume: newData }, true);
  };

  return (
    <QuestionCard
      title="Work Volume & Complexity"
      description="Assess work patterns for the selected roles and provide general estimates."
    >
      <div className="space-y-8">
        {/* Role-specific work volume assessment */}
        {selectedRoles.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Role-Specific Work Assessment</h3>
            <p className="text-sm text-gray-600">
              For each selected role, assess the typical work patterns and characteristics.
            </p>
            
            {selectedRoles.map((role: any) => {
              const roleId = String(role.id);
              const roleWorkVolume = data.roleWorkVolume?.[roleId] || {};
              
              return (
                <Card key={role.id} className="border-l-4 border-l-green-500" data-role-name={role.title?.replace(/\s+/g, '-').toLowerCase()}>
                  <CardHeader>
                    <CardTitle className="text-base">{role.title}</CardTitle>
                    <CardDescription>
                      Assess the typical work patterns for this role.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`volume-${roleId}`}>Task Volume</Label>
                        <Select
                          value={roleWorkVolume.volume || ''}
                          onValueChange={(value) => handleRoleWorkVolumeChange(roleId, 'volume', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select volume..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`complexity-${roleId}`}>Task Complexity</Label>
                        <Select
                          value={roleWorkVolume.complexity || ''}
                          onValueChange={(value) => handleRoleWorkVolumeChange(roleId, 'complexity', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select complexity..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`repetitiveness-${roleId}`}>Repetitiveness (1-5)</Label>
                        <Input
                          id={`repetitiveness-${roleId}`}
                          type="number"
                          min="1"
                          max="5"
                          className="mt-1"
                          value={roleWorkVolume.repetitiveness || ""}
                          onChange={(e) => handleRoleWorkVolumeChange(roleId, 'repetitiveness', parseInt(e.target.value) || undefined)}
                          placeholder="1-5"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`dataDescription-${roleId}`}>Data Description</Label>
                      <Textarea
                        id={`dataDescription-${roleId}`}
                        className="mt-1"
                        value={roleWorkVolume.dataDescription || ""}
                        onChange={(e) => handleRoleWorkVolumeChange(roleId, 'dataDescription', e.target.value)}
                        placeholder="Describe the types of data this role works with (e.g., customer data, pricing information, sales forecasts)..."
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        What types of data does this role typically work with?
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* General work volume and complexity sliders */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">General Assessment</h3>
          <p className="text-sm text-gray-600">
            Provide overall estimates for task volume and complexity across the organization.
          </p>
          
          <div className="space-y-4">
            <Label htmlFor="taskVolume" className="text-base">Overall Task Volume</Label>
            <p className="text-sm text-gray-600">
              On a scale of 1 to 100, how would you rate the overall volume of tasks?
            </p>
            <Slider
              id="taskVolume"
              min={0}
              max={100}
              step={1}
              value={[data.taskVolume || 50]}
              onValueChange={(value) => handleGeneralSliderChange('taskVolume', value)}
            />
            <div className="text-center font-semibold">{data.taskVolume}</div>
          </div>
          
          <div className="space-y-4">
            <Label htmlFor="taskComplexity" className="text-base">Overall Task Complexity</Label>
            <p className="text-sm text-gray-600">
              On a scale of 1 to 100, how would you rate the overall complexity of tasks?
            </p>
            <Slider
              id="taskComplexity"
              min={0}
              max={100}
              step={1}
              value={[data.taskComplexity || 50]}
              onValueChange={(value) => handleGeneralSliderChange('taskComplexity', value)}
            />
            <div className="text-center font-semibold">{data.taskComplexity}</div>
          </div>
        </div>

        {selectedRoles.length === 0 && (
          <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-md">
            <p className="text-lg mb-2">No roles selected</p>
            <p>Please go back to Step 2 (Role Selection) and select roles to assess role-specific work patterns.</p>
          </div>
        )}
      </div>
    </QuestionCard>
  );
};

export default WorkVolumeComplexityStep; 