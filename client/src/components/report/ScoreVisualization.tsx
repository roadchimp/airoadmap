'use client';

import React from 'react';
import { type WizardStepData } from '@/shared/schema';
import { calculateRoleScores } from '@/lib/scoring';

interface ScoreVisualizationProps {
  stepData: WizardStepData;
  roleId: string;
}

export function ScoreVisualization({ stepData, roleId }: ScoreVisualizationProps) {
  const scores = calculateRoleScores(stepData, roleId);
  const finalScore = scores.finalScores[roleId];
  const valueScore = scores.valueScores[roleId];
  const easeScore = scores.easeScores[roleId];

  return (
    <div className="space-y-8">
      {/* Quadrant Chart */}
      <div className="relative h-96 w-full border border-gray-200 rounded-lg p-4">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-full w-full grid grid-cols-2 grid-rows-2 gap-4">
            {/* Quadrants */}
            <div className={`p-4 rounded-lg ${
              finalScore.quadrant === 'high-value-high-ease' 
                ? 'bg-green-100 border-2 border-green-500' 
                : 'bg-gray-50'
            }`}>
              <h3 className="text-sm font-medium text-gray-700">High Value, High Ease</h3>
              <p className="text-xs text-gray-500">Quick wins with high impact</p>
            </div>
            <div className={`p-4 rounded-lg ${
              finalScore.quadrant === 'high-value-low-ease' 
                ? 'bg-yellow-100 border-2 border-yellow-500' 
                : 'bg-gray-50'
            }`}>
              <h3 className="text-sm font-medium text-gray-700">High Value, Low Ease</h3>
              <p className="text-xs text-gray-500">Strategic initiatives</p>
            </div>
            <div className={`p-4 rounded-lg ${
              finalScore.quadrant === 'low-value-high-ease' 
                ? 'bg-blue-100 border-2 border-blue-500' 
                : 'bg-gray-50'
            }`}>
              <h3 className="text-sm font-medium text-gray-700">Low Value, High Ease</h3>
              <p className="text-xs text-gray-500">Efficiency improvements</p>
            </div>
            <div className={`p-4 rounded-lg ${
              finalScore.quadrant === 'low-value-low-ease' 
                ? 'bg-red-100 border-2 border-red-500' 
                : 'bg-gray-50'
            }`}>
              <h3 className="text-sm font-medium text-gray-700">Low Value, Low Ease</h3>
              <p className="text-xs text-gray-500">Consider alternatives</p>
            </div>
          </div>
        </div>
        
        {/* Score Dot */}
        <div 
          className="absolute w-4 h-4 rounded-full bg-indigo-600"
          style={{
            left: `${(valueScore.totalValueScore / 5) * 100}%`,
            bottom: `${(easeScore.totalEaseScore / 5) * 100}%`,
          }}
        />
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 gap-6">
        {/* Value Scores */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Value Score: {valueScore.totalValueScore.toFixed(1)}</h3>
          <div className="space-y-2">
            <ScoreBar 
              label="Time Savings" 
              score={valueScore.timeSavings} 
              max={5}
            />
            <ScoreBar 
              label="Quality Impact" 
              score={valueScore.qualityImpact} 
              max={5}
            />
            <ScoreBar 
              label="Strategic Alignment" 
              score={valueScore.strategicAlignment} 
              max={5}
            />
          </div>
        </div>

        {/* Ease Scores */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Ease Score: {easeScore.totalEaseScore.toFixed(1)}</h3>
          <div className="space-y-2">
            <ScoreBar 
              label="Data Readiness" 
              score={easeScore.dataReadiness} 
              max={5}
            />
            <ScoreBar 
              label="Technical Feasibility" 
              score={easeScore.technicalFeasibility} 
              max={5}
            />
            <ScoreBar 
              label="Adoption Risk" 
              score={easeScore.adoptionRisk} 
              max={5}
            />
          </div>
        </div>
      </div>

      {/* Implementation Details */}
      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700">Time to Implement</h4>
          <p className="text-2xl font-semibold">{finalScore.timeToImplement} weeks</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700">Visibility</h4>
          <p className="text-2xl font-semibold">{finalScore.visibility}/5</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700">Foundation Value</h4>
          <p className="text-2xl font-semibold">{finalScore.foundationValue}/5</p>
        </div>
      </div>
    </div>
  );
}

interface ScoreBarProps {
  label: string;
  score: number;
  max: number;
}

function ScoreBar({ label, score, max }: ScoreBarProps) {
  const percentage = (score / max) * 100;
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{score.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-indigo-600 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
} 