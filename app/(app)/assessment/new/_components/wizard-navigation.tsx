import React from 'react';

interface WizardNavigationProps {
    canGoBack: boolean;
    canProceed: boolean;
    isLastStep: boolean;
    onBack: () => void;
    onNext: () => void;
    isLoading: boolean;
}

const WizardNavigation: React.FC<WizardNavigationProps> = ({
    canGoBack,
    canProceed,
    isLastStep,
    onBack,
    onNext,
    isLoading
}) => {
    return (
        <div className="flex justify-between items-center">
            {canGoBack ? (
                <button 
                    onClick={onBack} 
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                    Back
                </button>
            ) : (
                <div /> 
            )}

            <button 
                onClick={onNext}
                disabled={!canProceed || isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
                {isLoading ? 'Saving...' : isLastStep ? 'Finish Assessment' : 'Next Step'}
            </button>
        </div>
    );
};

export default WizardNavigation; 