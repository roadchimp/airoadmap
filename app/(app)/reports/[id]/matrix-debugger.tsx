"use client";

import React, { useEffect } from 'react';
import { FullAICapability } from '@/server/storage';

interface MatrixDebuggerProps {
  capabilities: FullAICapability[];
}

export function MatrixDebugger({ capabilities }: MatrixDebuggerProps) {
  // Calculate stats for better debugging
  const capabilitiesWithValueScore = capabilities.filter(cap => 
    cap.valueScore !== null && cap.valueScore !== undefined
  );
  
  const capabilitiesWithFeasibilityScore = capabilities.filter(cap => 
    cap.feasibilityScore !== null && cap.feasibilityScore !== undefined
  );
  
  const capabilitiesWithDefaultValueScore = capabilities.filter(cap => 
    cap.defaultValueScore !== null && cap.defaultValueScore !== undefined
  );
  
  const capabilitiesWithDefaultFeasibilityScore = capabilities.filter(cap => 
    cap.defaultFeasibilityScore !== null && cap.defaultFeasibilityScore !== undefined
  );
  
  const capabilitiesWithScores = capabilities.filter(cap => 
    (cap.valueScore !== null && cap.valueScore !== undefined || 
     cap.defaultValueScore !== null && cap.defaultValueScore !== undefined) &&
    (cap.feasibilityScore !== null && cap.feasibilityScore !== undefined || 
     cap.defaultFeasibilityScore !== null && cap.defaultFeasibilityScore !== undefined)
  );
  
  useEffect(() => {
    console.log('MatrixDebugger: Analyzing capabilities data', {
      totalCount: capabilities.length,
      withValueScore: capabilitiesWithValueScore.length,
      withFeasibilityScore: capabilitiesWithFeasibilityScore.length,
      withDefaultValueScore: capabilitiesWithDefaultValueScore.length,
      withDefaultFeasibilityScore: capabilitiesWithDefaultFeasibilityScore.length,
      withBothScores: capabilitiesWithScores.length,
    });
    
    // Log sample data for first few capabilities
    capabilities.slice(0, 3).forEach((cap, i) => {
      console.log(`Capability ${i+1}: ${cap.name}`, {
        valueScore: cap.valueScore,
        defaultValueScore: cap.defaultValueScore, 
        feasibilityScore: cap.feasibilityScore,
        defaultFeasibilityScore: cap.defaultFeasibilityScore,
        impactScore: cap.impactScore,
        defaultImpactScore: cap.defaultImpactScore,
        priority: cap.priority,
        // Add additional debug information about type
        valueScoreType: cap.valueScore !== undefined ? typeof cap.valueScore : 'undefined',
        defaultValueScoreType: cap.defaultValueScore !== undefined ? typeof cap.defaultValueScore : 'undefined',
      });
    });
  }, [capabilities, capabilitiesWithValueScore.length, capabilitiesWithFeasibilityScore.length, 
      capabilitiesWithDefaultValueScore.length, capabilitiesWithDefaultFeasibilityScore.length, 
      capabilitiesWithScores.length]);

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
      <h3 className="font-medium mb-2">Prioritization Matrix Debugger</h3>
      <div className="text-sm space-y-1">
        <p>Total capabilities: {capabilities.length}</p>
        <p>Capabilities with value score: {capabilitiesWithValueScore.length}</p>
        <p>Capabilities with feasibility score: {capabilitiesWithFeasibilityScore.length}</p>
        <p>Capabilities with default value score: {capabilitiesWithDefaultValueScore.length}</p>
        <p>Capabilities with default feasibility score: {capabilitiesWithDefaultFeasibilityScore.length}</p>
        <p className="font-medium">Capabilities eligible for plotting: {capabilitiesWithScores.length}</p>
        
        {capabilitiesWithScores.length === 0 && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p>No capabilities have both value and feasibility scores needed for plotting.</p>
          </div>
        )}
        
        {capabilitiesWithScores.length > 0 && (
          <div className="mt-2">
            <p className="font-medium">Sample Capability Data:</p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs mt-1">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-1 border">Name</th>
                    <th className="p-1 border">Value</th>
                    <th className="p-1 border">Feasibility</th>
                    <th className="p-1 border">Default Value</th>
                    <th className="p-1 border">Default Feasibility</th>
                  </tr>
                </thead>
                <tbody>
                  {capabilitiesWithScores.slice(0, 3).map((cap) => (
                    <tr key={cap.id}>
                      <td className="p-1 border">{cap.name}</td>
                      <td className="p-1 border">{cap.valueScore ?? 'N/A'}</td>
                      <td className="p-1 border">{cap.feasibilityScore ?? 'N/A'}</td>
                      <td className="p-1 border">{cap.defaultValueScore ?? 'N/A'}</td>
                      <td className="p-1 border">{cap.defaultFeasibilityScore ?? 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 