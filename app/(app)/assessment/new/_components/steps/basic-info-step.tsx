import React from 'react';
import { useSession } from '@/lib/session/SessionContext';

const BasicInfoStep: React.FC = () => {
    const { session, updateStepData } = useSession();
    const currentStepData = session.steps.find(step => step.id === 'basic-info');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        updateStepData('basic-info', { [e.target.name]: e.target.value });
    };

    return (
        <div className="space-y-6">
            <div>
                <label htmlFor="assessmentName" className="block text-sm font-medium text-gray-700">
                    Assessment Name
                </label>
                <input
                    type="text"
                    id="assessmentName"
                    name="assessmentName"
                    value={currentStepData?.data.assessmentName || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., Q3 Sales Team AI Readiness"
                />
            </div>
            <div>
                <label htmlFor="assessmentDescription" className="block text-sm font-medium text-gray-700">
                    Description (Optional)
                </label>
                <textarea
                    id="assessmentDescription"
                    name="assessmentDescription"
                    value={currentStepData?.data.assessmentDescription || ''}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="A brief description of the assessment's goals."
                />
            </div>
        </div>
    );
};

export default BasicInfoStep; 