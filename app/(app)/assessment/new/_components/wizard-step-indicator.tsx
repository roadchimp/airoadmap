import React from 'react';
import { WizardStep } from '@/lib/session/sessionTypes';

interface WizardStepIndicatorProps {
    steps: WizardStep[];
    currentStep: number;
    onStepClick: (stepIndex: number) => void;
}

const WizardStepIndicator: React.FC<WizardStepIndicatorProps> = ({ steps, currentStep, onStepClick }) => {
    const totalSteps = steps.length;
    const progressPercentage = Math.round(((currentStep + 1) / totalSteps) * 100);

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">
                    Step {currentStep + 1} of {totalSteps}
                </span>
                <span className="text-sm font-medium text-gray-600">
                    {progressPercentage}% complete
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                />
            </div>
        </div>
    );
};

export default WizardStepIndicator; 