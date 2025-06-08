import React from 'react';
import { WizardStep } from '@/lib/session/sessionTypes';

interface WizardStepIndicatorProps {
    steps: WizardStep[];
    currentStep: number;
    onStepClick: (stepIndex: number) => void;
}

const WizardStepIndicator: React.FC<WizardStepIndicatorProps> = ({ steps, currentStep, onStepClick }) => {
    return (
        <div className="flex items-center justify-center space-x-4">
            {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                    <button
                        onClick={() => onStepClick(index)}
                        disabled={!step.isCompleted && index > currentStep}
                        className="flex items-center space-x-2 focus:outline-none"
                    >
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                                index === currentStep ? 'bg-blue-600' : step.isCompleted ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                        >
                            {step.isCompleted && index < currentStep ? '✓' : index + 1}
                        </div>
                        <span className={`hidden md:block ${index === currentStep ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                            {step.name}
                        </span>
                    </button>
                    {index < steps.length - 1 && (
                        <div className="w-16 h-1 bg-gray-200 mx-2">
                             <div
                                style={{ width: index < currentStep ? '100%' : '0%' }}
                                className="h-full bg-blue-600 transition-all duration-300"
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default WizardStepIndicator; 