'use client';

import React from 'react';
import { useSession } from '@/lib/session/SessionContext';
import { WizardStep } from '@/lib/session/sessionTypes';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import QuestionCard from '@/app/(app)/assessment/new/_components/QuestionCard';

const DataSystemsStep = () => {
  const { session, setStepData } = useSession();
  const currentStepIndex = WizardStep.DATA_SYSTEMS;
  const currentData = session.steps[currentStepIndex]?.data.dataSystems || {};

  const handleFieldChange = (field: string, value: string) => {
    setStepData(currentStepIndex, {
      dataSystems: {
        ...currentData,
        [field]: value
      }
    }, true);
  };

  return (
    <QuestionCard 
      title="Data & Systems" 
      description="Tell us about your current data and technology landscape."
    >
      <div className="space-y-6">
        {/* Data Accessibility */}
        <div>
          <Label className="text-base font-medium text-gray-900">Data Accessibility</Label>
          <Select 
            value={currentData.dataAccessibility || ''} 
            onValueChange={(value) => handleFieldChange('dataAccessibility', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select accessibility level..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Easy (Well-documented, readily available)">
                Easy (Well-documented, readily available)
              </SelectItem>
              <SelectItem value="Moderate (Requires some effort/cleanup)">
                Moderate (Requires some effort/cleanup)
              </SelectItem>
              <SelectItem value="Difficult (Siloed, requires significant effort)">
                Difficult (Siloed, requires significant effort)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data Quality */}
        <div>
          <Label className="text-base font-medium text-gray-900">Data Quality</Label>
          <Select 
            value={currentData.dataQuality || ''} 
            onValueChange={(value) => handleFieldChange('dataQuality', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select data quality level..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Good (Accurate, complete, consistent)">
                Good (Accurate, complete, consistent)
              </SelectItem>
              <SelectItem value="Fair (Some inconsistencies or gaps)">
                Fair (Some inconsistencies or gaps)
              </SelectItem>
              <SelectItem value="Poor (Inaccurate, incomplete, unreliable)">
                Poor (Inaccurate, incomplete, unreliable)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Systems Integration */}
        <div>
          <Label className="text-base font-medium text-gray-900">Systems Integration</Label>
          <Select 
            value={currentData.systemsIntegration || ''} 
            onValueChange={(value) => handleFieldChange('systemsIntegration', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select integration ease..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Easy (APIs available, modern systems)">
                Easy (APIs available, modern systems)
              </SelectItem>
              <SelectItem value="Moderate (Some custom work needed)">
                Moderate (Some custom work needed)
              </SelectItem>
              <SelectItem value="Difficult (Legacy systems, lack of APIs)">
                Difficult (Legacy systems, lack of APIs)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Relevant Tools & Platforms */}
        <div>
          <Label htmlFor="relevantTools" className="text-base font-medium text-gray-900">
            Relevant Tools & Platforms
          </Label>
          <Textarea
            id="relevantTools"
            placeholder="List key software, platforms, or databases currently in use (e.g., Salesforce, SAP, Snowflake, internal tools)..."
            value={currentData.relevantTools || ''}
            onChange={(e) => handleFieldChange('relevantTools', e.target.value)}
            className="mt-2"
            rows={4}
          />
        </div>

        {/* Notes (Optional) */}
        <div>
          <Label htmlFor="notes" className="text-base font-medium text-gray-900">
            Notes (Optional)
          </Label>
          <Textarea
            id="notes"
            placeholder="Add any other relevant details about the current tech stack or data landscape..."
            value={currentData.notes || ''}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            className="mt-2"
            rows={4}
          />
        </div>
      </div>
    </QuestionCard>
  );
};

export default DataSystemsStep; 