'use client';

import React, { useState } from 'react';
import { useSession } from '../../../../../../lib/session/SessionContext';
import  QuestionCard  from '../QuestionCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { DataSystemsData } from '../../../../../../lib/session/sessionTypes';

export const DataSystemsStep = () => {
  const { session, setStepData } = useSession();
  const { currentStepIndex } = session;

  const data = session.steps[currentStepIndex]?.data.dataSystems || { dataSources: [], softwareSystems: [] };

  const [currentDataSource, setCurrentDataSource] = useState('');
  const [currentSoftware, setCurrentSoftware] = useState('');

  const handleAddTag = (type: 'dataSources' | 'softwareSystems') => {
    const value = type === 'dataSources' ? currentDataSource : currentSoftware;
    if (value && data[type] && !data[type].includes(value)) {
      const newData: DataSystemsData = {
        ...data,
        [type]: [...data[type], value],
      };
      setStepData(currentStepIndex, { dataSystems: newData }, true);
      if (type === 'dataSources') {
        setCurrentDataSource('');
      } else {
        setCurrentSoftware('');
      }
    }
  };

  const handleRemoveTag = (type: 'dataSources' | 'softwareSystems', tag: string) => {
    const newData: DataSystemsData = {
      ...data,
      [type]: data[type]?.filter((t: string) => t !== tag) || [],
    };
    setStepData(currentStepIndex, { dataSystems: newData }, true);
  };

  return (
    <QuestionCard
      title="Data & Systems"
      description="List the primary data sources and software systems used by the selected roles."
    >
      <div className="space-y-8">
        {/* Data Sources Input */}
        <div className="space-y-4">
          <label className="text-lg font-medium">Data Sources</label>
          <p className="text-sm text-gray-600">e.g., Salesforce, Internal DB, Google Analytics</p>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={currentDataSource}
              onChange={(e) => setCurrentDataSource(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag('dataSources')}
              placeholder="Add a data source..."
            />
            <Button onClick={() => handleAddTag('dataSources')}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.dataSources?.map((source: string) => (
              <div key={source} className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-sm">
                {source}
                <button onClick={() => handleRemoveTag('dataSources', source)} className="text-gray-500 hover:text-gray-800">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Software Systems Input */}
        <div className="space-y-4">
          <label className="text-lg font-medium">Software Systems</label>
          <p className="text-sm text-gray-600">e.g., SAP, Microsoft Office, Figma, Jira</p>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={currentSoftware}
              onChange={(e) => setCurrentSoftware(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag('softwareSystems')}
              placeholder="Add a software system..."
            />
            <Button onClick={() => handleAddTag('softwareSystems')}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.softwareSystems?.map((system: string) => (
              <div key={system} className="flex items-center gap-1 bg-gray-200 rounded-full px-3 py-1 text-sm">
                {system}
                <button onClick={() => handleRemoveTag('softwareSystems', system)} className="text-gray-500 hover:text-gray-800">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </QuestionCard>
  );
};

export default DataSystemsStep; 