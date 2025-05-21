"use client"

import React, { useState } from 'react';
import { FullAICapability } from '@/server/storage'; // Adjust path as needed if server/storage.ts is not aliased to @/server
import { CapabilityDetailModal } from './CapabilityDetailModal'; // Import the actual modal
import { calculateBubbleSize, getValueBasedColor } from '@/lib/color-utils';
// import { CapabilityDetailModal } from './CapabilityDetailModal'; // Will be created later

// --- Utility Functions (potentially move to lib/report-utils.ts or lib/color-utils.ts) ---

// --- Sub-Components ---

interface CapabilityBubbleProps {
  capability: FullAICapability;
  onClick: () => void;
}

function CapabilityBubble({ capability, onClick }: CapabilityBubbleProps) {
  // Use assessment-specific scores if available, otherwise fall back to default scores
  // Convert to number safely (handles both string and number inputs)
  const feasibilityScore = Number(capability.feasibilityScore ?? capability.defaultFeasibilityScore ?? 0);
  const valueScore = Number(capability.valueScore ?? capability.defaultValueScore ?? 0);
  const impactScore = Number(capability.impactScore ?? capability.defaultImpactScore ?? 0);
  
  // Log detailed debug info about the conversion
  console.debug(`Converting scores for ${capability.name}:`, {
    originalValueScore: capability.valueScore,
    originalFeasibilityScore: capability.feasibilityScore,
    defaultValueScore: capability.defaultValueScore,
    defaultFeasibilityScore: capability.defaultFeasibilityScore,
    convertedValueScore: valueScore,
    convertedFeasibilityScore: feasibilityScore,
    convertedImpactScore: impactScore,
  });
  
  // Use the values directly now that they're properly converted to numbers
  const x = feasibilityScore;
  const y = valueScore;
  const size = calculateBubbleSize(impactScore || undefined);
  const color = getValueBasedColor(valueScore || undefined);

  // Ensure x and y are percentages for positioning
  // The scores are assumed to be 0-100.
  // If they are 1-5 or other scales, normalization is needed here.
  // For now, assuming 0-100 for direct percentage use.
  const positionX = Math.max(0, Math.min(100, x));
  const positionY = Math.max(0, Math.min(100, y));

  console.log(`Rendering bubble for ${capability.name}: x=${positionX}, y=${positionY}, size=${size}`);

  return (
    <div
      className="absolute rounded-full flex items-center justify-center 
                 cursor-pointer transition-all hover:scale-105 hover:shadow-lg group"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        left: `${positionX}%`, // position based on feasibility score
        bottom: `${positionY}%`, // Bottom based on value score (higher = higher up)
        transform: 'translate(-50%, 50%)', // Center bubble on the point
        backgroundColor: color,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        zIndex: 20, // Ensure bubbles are above quadrants/axes
      }}
      onClick={onClick}
      title={capability.name}
    >
      <span className="text-white font-medium text-xs px-2 text-center 
                    whitespace-nowrap overflow-hidden text-ellipsis group-hover:whitespace-normal">
        {capability.name}
      </span>
    </div>
  );
}

function MatrixAxes() {
  return (
    <>
      {/* Horizontal and vertical axes lines */}
      <div className="absolute inset-y-0 left-1/2 w-px bg-gray-300 transform -translate-x-1/2" style={{ zIndex: 10 }} />
      <div className="absolute inset-x-0 bottom-1/2 h-px bg-gray-300 transform -translate-y-1/2" style={{ zIndex: 10 }} />
      
      {/* Axis labels */}
      <div className="absolute left-1/2 bottom-2 transform -translate-x-1/2 text-sm font-medium text-gray-600">
        Feasibility
      </div>
      <div 
        className="absolute left-2 top-1/2 transform -translate-y-1/2 -rotate-90 text-sm font-medium text-gray-600" 
        style={{ transformOrigin: 'left center' }}
      >
        Value
      </div>
      
      {/* Corner labels for Value axis */}
      <div className="absolute top-4 left-4 text-xs font-medium text-gray-500">High</div>
      <div className="absolute bottom-4 left-4 text-xs font-medium text-gray-500">Low</div>
      
      {/* Corner labels for Feasibility axis */}
      <div className="absolute bottom-4 right-4 text-xs font-medium text-gray-500">High</div>
      <div className="absolute bottom-4 left-16 text-xs font-medium text-gray-500">Low</div>
    </>
  );
}

function MatrixQuadrants() {
  return (
    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none z-0">
      {/* Bottom-left: Strategic Investments (High Value, Low Feasibility) */}
      <div className="border-r border-b border-dashed border-gray-300 flex items-center justify-center p-4">
        <span className="text-lg font-semibold text-red-700 opacity-50">Strategic Investments</span>
      </div>
      {/* Bottom-right: Quick Wins (High Value, High Feasibility) */}
      <div className="border-l border-b border-dashed border-gray-300 flex items-center justify-center p-4">
        <span className="text-lg font-semibold text-orange-700 opacity-50">Quick Wins</span>
      </div>
      {/* Top-left: Deprioritize (Low Value, Low Feasibility) */}
      <div className="border-r border-t border-dashed border-gray-300 flex items-center justify-center p-4">
        <span className="text-lg font-semibold text-blue-700 opacity-50">Deprioritize</span>
      </div>
      {/* Top-right: Low-Hanging Fruit (Low Value, High Feasibility) */}
      <div className="border-l border-t border-dashed border-gray-300 flex items-center justify-center p-4">
        <span className="text-lg font-semibold text-gray-600 opacity-50">Low-Hanging Fruit</span>
      </div>
    </div>
  );
}

// --- Main Priority Matrix Component ---
interface PriorityMatrixProps {
  capabilities?: FullAICapability[]; // Data passed from parent
  // onCapabilityClick: (capability: FullAICapability) => void; // To open modal
}

export function PriorityMatrix({ capabilities }: PriorityMatrixProps) {
  const [selectedCapability, setSelectedCapability] = useState<FullAICapability | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCapabilityClick = (capability: FullAICapability) => {
    setSelectedCapability(capability);
    setIsModalOpen(true);
    // console.log("Selected capability:", capability); // For debugging
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCapability(null);
  };

  if (!capabilities || capabilities.length === 0) {
    return <div className="p-4 text-center text-gray-500">No capabilities data available for the matrix.</div>;
  }
  
  // Debug: Log sample data for capabilities
  console.log('Sample capability data:', capabilities.slice(0, 3).map(c => ({
    name: c.name,
    valueScore: c.valueScore,
    feasibilityScore: c.feasibilityScore,
    defaultValueScore: c.defaultValueScore,
    defaultFeasibilityScore: c.defaultFeasibilityScore,
    // Convert to check if any numeric value (either as string or number)
    hasValueScore: c.valueScore !== null && c.valueScore !== undefined || 
                  c.defaultValueScore !== null && c.defaultValueScore !== undefined,
    hasFeasibilityScore: c.feasibilityScore !== null && c.feasibilityScore !== undefined || 
                        c.defaultFeasibilityScore !== null && c.defaultFeasibilityScore !== undefined
  })));
  
  // Filter out capabilities that don't have scores needed for plotting
  const plottableCapabilities = capabilities.filter(
    cap => {
      // First check assessment-specific scores, fall back to default scores
      const hasValueScore = cap.valueScore !== null && cap.valueScore !== undefined || 
                          cap.defaultValueScore !== null && cap.defaultValueScore !== undefined;
      const hasFeasibilityScore = cap.feasibilityScore !== null && cap.feasibilityScore !== undefined || 
                                cap.defaultFeasibilityScore !== null && cap.defaultFeasibilityScore !== undefined;
      const result = hasValueScore && hasFeasibilityScore;
      
      // Log for debugging
      if (!result) {
        console.log(`Filtering out capability "${cap.name}" - missing scores:`, { 
          valueScore: cap.valueScore, 
          defaultValueScore: cap.defaultValueScore,
          feasibilityScore: cap.feasibilityScore, 
          defaultFeasibilityScore: cap.defaultFeasibilityScore 
        });
      }
      
      return result;
    }
  );
  
  console.log(`Found ${plottableCapabilities.length} capabilities with valid scores out of ${capabilities.length} total`);

  if (plottableCapabilities.length === 0) {
    return <div className="p-4 text-center text-gray-500">No capabilities have the required scores for plotting.</div>;
  }

  return (
    <div className="w-full">
      <div className="relative h-[500px] md:h-[600px] w-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden p-4 md:p-6">
        <MatrixQuadrants />
        <MatrixAxes />
        
        {plottableCapabilities.map((capability) => (
          <CapabilityBubble
            key={capability.id}
            capability={capability}
            onClick={() => handleCapabilityClick(capability)}
          />
        ))}
      </div>

      {isModalOpen && selectedCapability && (
        <CapabilityDetailModal
          capability={selectedCapability}
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      )}
    </div>
  );
} 