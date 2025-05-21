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
  const x = capability.feasibilityScore ? parseFloat(String(capability.feasibilityScore)) : 0; // Normalize to 0-100 if not already
  const y = capability.valueScore ? parseFloat(String(capability.valueScore)) : 0; // Normalize to 0-100 if not already
  const size = calculateBubbleSize(capability.impactScore ? parseFloat(String(capability.impactScore)) : undefined);
  const color = getValueBasedColor(capability.valueScore ? parseFloat(String(capability.valueScore)) : undefined);

  // Ensure x and y are percentages for positioning
  // The scores are assumed to be 0-100.
  // If they are 1-5 or other scales, normalization is needed here.
  // For now, assuming 0-100 for direct percentage use.
  const positionX = Math.max(0, Math.min(100, x));
  const positionY = Math.max(0, Math.min(100, y));

  return (
    <div
      className="absolute rounded-full flex items-center justify-center 
                 cursor-pointer transition-all hover:scale-105 hover:shadow-lg group"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        left: `${positionX}%`, // position based on feasibility score
        bottom: `${positionY}%`, // position based on value score
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
      {/* Low Feasibility label (already covered by Low on Value Axis if placed at bottom-left) */}
    </>
  );
}

function MatrixQuadrants() {
  return (
    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none z-0">
      {/* Top-left: Quick Wins (High Value, Low Feasibility) */}
      <div className="border-r border-b border-dashed border-gray-300 flex items-center justify-center p-4">
        <span className="text-lg font-semibold text-red-700 opacity-50">Quick Wins</span>
      </div>
      {/* Top-right: Strategic Investments (High Value, High Feasibility) */}
      <div className="border-l border-b border-dashed border-gray-300 flex items-center justify-center p-4">
        <span className="text-lg font-semibold text-orange-700 opacity-50">Strategic Investments</span>
      </div>
      {/* Bottom-left: Low-Hanging Fruit (Low Value, Low Feasibility) */}
      <div className="border-r border-t border-dashed border-gray-300 flex items-center justify-center p-4">
        <span className="text-lg font-semibold text-blue-700 opacity-50">Low-Hanging Fruit</span>
      </div>
      {/* Bottom-right: Deprioritize (Low Value, High Feasibility) */}
      <div className="border-l border-t border-dashed border-gray-300 flex items-center justify-center p-4">
        <span className="text-lg font-semibold text-gray-600 opacity-50">Deprioritize</span>
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
  
  // Filter out capabilities that don't have scores needed for plotting
  const plottableCapabilities = capabilities.filter(
    cap => typeof cap.valueScore === 'number' && typeof cap.feasibilityScore === 'number'
  );

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