'use client';

import React from 'react';
import { type WizardStepData, RoleScore } from '../../shared/schema';
import { calculateRoleScore } from '../../shared/scoring';

interface ScoreVisualizationProps {
  stepData: WizardStepData;
  roleId: string;
}

export function ScoreVisualization({ stepData, roleId }: ScoreVisualizationProps) {
  const numericRoleId = parseInt(roleId);
  if (isNaN(numericRoleId)) {
    return <div>Error: Invalid Role ID</div>;
  }

  const roleScoresInput = stepData.scores?.assessmentScores?.roleScores?.[numericRoleId];

  if (!roleScoresInput) {
    return <div>Scoring data not available for this role.</div>;
  }

  const scores: RoleScore = calculateRoleScore({
    timeSavings: roleScoresInput.valuePotential.timeSavings,
    qualityImpact: roleScoresInput.valuePotential.qualityImpact,
    strategicAlignment: roleScoresInput.valuePotential.strategicAlignment,
    dataReadiness: roleScoresInput.easeOfImplementation.dataReadiness,
    technicalFeasibility: roleScoresInput.easeOfImplementation.technicalFeasibility,
    adoptionRisk: roleScoresInput.easeOfImplementation.adoptionRisk,
  });

  const finalScore = scores.totalScore;
  const valueScoreDetails = scores.valuePotential;
  const easeScoreDetails = scores.easeOfImplementation;

  const getQuadrant = (value: number, ease: number): string => {
      if (value >= 3.5 && ease >= 3.5) return 'high-value-high-ease';
      if (value >= 3.5 && ease < 3.5) return 'high-value-low-ease';
      if (value < 3.5 && ease >= 3.5) return 'low-value-high-ease';
      return 'low-value-low-ease';
  };
  const quadrant = getQuadrant(valueScoreDetails.total, easeScoreDetails.total);

  const implementationDetails = {
    timeToImplement: 'N/A',
    visibility: 'N/A',
    foundationValue: 'N/A'
  };

  return (
    <div className="space-y-8">
      {/* Quadrant Chart */}
      <div className="relative h-96 w-full border border-gray-200 rounded-lg p-4">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-full w-full grid grid-cols-2 grid-rows-2 gap-4">
            {/* Quadrants */}
            <div className={`p-4 rounded-lg ${
              quadrant === 'high-value-high-ease'
                ? 'bg-green-100 border-2 border-green-500'
                : 'bg-gray-50'
            }`}>
              <h3 className="text-sm font-medium text-gray-700">High Value, High Ease</h3>
              <p className="text-xs text-gray-500">Quick wins with high impact</p>
            </div>
            <div className={`p-4 rounded-lg ${
              quadrant === 'high-value-low-ease'
                ? 'bg-yellow-100 border-2 border-yellow-500'
                : 'bg-gray-50'
            }`}>
              <h3 className="text-sm font-medium text-gray-700">High Value, Low Ease</h3>
              <p className="text-xs text-gray-500">Strategic initiatives</p>
            </div>
            <div className={`p-4 rounded-lg ${
              quadrant === 'low-value-high-ease'
                ? 'bg-blue-100 border-2 border-blue-500'
                : 'bg-gray-50'
            }`}>
              <h3 className="text-sm font-medium text-gray-700">Low Value, High Ease</h3>
              <p className="text-xs text-gray-500">Efficiency improvements</p>
            </div>
            <div className={`p-4 rounded-lg ${
              quadrant === 'low-value-low-ease'
                ? 'bg-red-100 border-2 border-red-500'
                : 'bg-gray-50'
            }`}>
              <h3 className="text-sm font-medium text-gray-700">Low Value, Low Ease</h3>
              <p className="text-xs text-gray-500">Consider alternatives</p>
            </div>
          </div>
        </div>

        {/* Score Dot - Use the calculated total value/ease scores */}
        <div
          className="absolute w-4 h-4 rounded-full bg-indigo-600 transition-all duration-500 ease-in-out"
          style={{
            left: `${Math.min(100, Math.max(0, (valueScoreDetails.total / 5) * 100))}%`,
            bottom: `${Math.min(100, Math.max(0, (easeScoreDetails.total / 5) * 100))}%`,
            transform: 'translate(-50%, 50%)'
          }}
        />
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 gap-6">
        {/* Value Scores */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Value Score: {valueScoreDetails.total.toFixed(1)}</h3>
          <div className="space-y-2">
            <ScoreBar
              label="Time Savings"
              score={valueScoreDetails.timeSavings}
              max={5}
            />
            <ScoreBar
              label="Quality Impact"
              score={valueScoreDetails.qualityImpact}
              max={5}
            />
            <ScoreBar
              label="Strategic Alignment"
              score={valueScoreDetails.strategicAlignment}
              max={5}
            />
          </div>
        </div>

        {/* Ease Scores */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Ease Score: {easeScoreDetails.total.toFixed(1)}</h3>
          <div className="space-y-2">
            <ScoreBar
              label="Data Readiness"
              score={easeScoreDetails.dataReadiness}
              max={5}
            />
            <ScoreBar
              label="Technical Feasibility"
              score={easeScoreDetails.technicalFeasibility}
              max={5}
            />
            <ScoreBar
              label="Adoption Risk"
              score={easeScoreDetails.adoptionRisk}
              max={5}
            />
          </div>
        </div>
      </div>

      {/* Implementation Details - Using placeholders as these are not in RoleScore */}
      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700">Time to Implement</h4>
          <p className="text-2xl font-semibold">{implementationDetails.timeToImplement}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700">Visibility</h4>
          <p className="text-2xl font-semibold">{implementationDetails.visibility}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700">Foundation Value</h4>
          <p className="text-2xl font-semibold">{implementationDetails.foundationValue}</p>
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