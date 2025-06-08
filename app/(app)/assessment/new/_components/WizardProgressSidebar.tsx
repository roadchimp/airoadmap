'use client';

import React from 'react';
import { useSession } from '../../../../../lib/session/SessionContext';
import { wizardStepMap } from '../../../../../lib/session/wizardStepMap';
import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/session/utils.ts';

export const WizardProgressSidebar = () => {
  const { session, goToStep } = useSession();
  const { currentStepIndex, steps } = session;

  const stepsArray = React.useMemo(() => Object.values(wizardStepMap), []);

  return (
    <div className="flex flex-col w-64 p-4 bg-gray-50 border-r border-gray-200">
      <h2 className="text-lg font-semibold mb-4">Assessment Steps</h2>
      <nav>
        <ul>
          {stepsArray.map((stepConfig, index) => {
            const stepState = steps[index];
            const isCurrent = index === currentStepIndex;
            const isCompleted = stepState?.isCompleted || false;

            return (
              <li key={stepConfig.id} className="mb-2">
                <button
                  onClick={() => goToStep(index)}
                  disabled={index > currentStepIndex && !steps[index - 1]?.isCompleted}
                  className={cn(
                    'flex items-center w-full text-left p-2 rounded-md transition-colors',
                    {
                      'bg-blue-100 text-blue-700': isCurrent,
                      'hover:bg-gray-100': !isCurrent,
                      'text-gray-400 cursor-not-allowed': index > currentStepIndex && !steps[index-1]?.isCompleted,
                    }
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 mr-3 text-green-500" />
                  ) : (
                    <div
                      className={cn(
                        'w-5 h-5 mr-3 rounded-full flex items-center justify-center border-2',
                        isCurrent ? 'border-blue-500' : 'border-gray-300'
                      )}
                    >
                      {!isCurrent && <Circle className="h-2 w-2 text-gray-400" />}
                    </div>
                  )}
                  <span className="font-medium">{stepConfig.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}; 