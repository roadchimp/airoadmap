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
        {/* Current Systems */}
        <div>
          <Label htmlFor="currentSystems" className="text-base font-medium text-gray-900">
            Current Systems
          </Label>
          <Textarea
            id="currentSystems"
            placeholder="List key software, platforms, or databases currently in use (e.g., Salesforce, SAP, Snowflake, internal tools)..."
            value={currentData.currentSystems || ''}
            onChange={(e) => handleFieldChange('currentSystems', e.target.value)}
            className="mt-2"
            rows={4}
          />
          <p className="text-sm text-gray-600 mt-1">
            Describe your current technology stack and key systems
          </p>
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
              <SelectItem value="5">5 - Excellent (Accurate, complete, consistent)</SelectItem>
              <SelectItem value="4">4 - Good (Minor inconsistencies)</SelectItem>
              <SelectItem value="3">3 - Fair (Some gaps or inconsistencies)</SelectItem>
              <SelectItem value="2">2 - Poor (Significant issues)</SelectItem>
              <SelectItem value="1">1 - Very Poor (Inaccurate, incomplete, unreliable)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-600 mt-1">
            Rate the overall quality of your data (1-5 scale)
          </p>
        </div>

        {/* Integration Challenges */}
        <div>
          <Label htmlFor="integrationChallenges" className="text-base font-medium text-gray-900">
            Integration Challenges
          </Label>
          <Textarea
            id="integrationChallenges"
            placeholder="Describe any challenges with system integration, data silos, or technical limitations..."
            value={currentData.integrationChallenges || ''}
            onChange={(e) => handleFieldChange('integrationChallenges', e.target.value)}
            className="mt-2"
            rows={4}
          />
          <p className="text-sm text-gray-600 mt-1">
            What are the main challenges in integrating new AI tools with existing systems?
          </p>
        </div>

        {/* Security Requirements */}
        <div>
          <Label htmlFor="securityRequirements" className="text-base font-medium text-gray-900">
            Security Requirements
          </Label>
          <Textarea
            id="securityRequirements"
            placeholder="Describe security requirements, compliance needs, data privacy concerns..."
            value={currentData.securityRequirements || ''}
            onChange={(e) => handleFieldChange('securityRequirements', e.target.value)}
            className="mt-2"
            rows={4}
          />
          <p className="text-sm text-gray-600 mt-1">
            What security and compliance requirements must be considered?
          </p>
        </div>

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

        {/* Relevant Tools & Platforms (Legacy field - keeping for backward compatibility) */}
        <div>
          <Label htmlFor="relevantTools" className="text-base font-medium text-gray-900">
            Additional Tools & Platforms
          </Label>
          <Textarea
            id="relevantTools"
            placeholder="Any additional tools, platforms, or systems not mentioned above..."
            value={currentData.relevantTools || ''}
            onChange={(e) => handleFieldChange('relevantTools', e.target.value)}
            className="mt-2"
            rows={3}
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