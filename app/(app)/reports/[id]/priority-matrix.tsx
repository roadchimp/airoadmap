"use client"

import React, { useState, useMemo } from 'react';
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
  // Use assessment-specific scores if available, otherwise fall back to default scores, with final fallback to 50
  const feasibilityScore = Number(capability.feasibilityScore ?? capability.default_feasibility_score ?? 50);
  const valueScore = Number(capability.valueScore ?? capability.default_value_score ?? 50);
  const impactScore = Number(capability.impactScore ?? capability.default_impact_score ?? 50);
  
  // Log detailed debug info about the conversion
  console.debug(`Converting scores for ${capability.name}:`, {
    originalValueScore: capability.valueScore,
    originalFeasibilityScore: capability.feasibilityScore,
    originalImpactScore: capability.impactScore,
    defaultValueScore: capability.default_value_score,
    defaultFeasibilityScore: capability.default_feasibility_score,
    defaultImpactScore: capability.default_impact_score,
    finalValueScore: valueScore,
    finalFeasibilityScore: feasibilityScore,
    finalImpactScore: impactScore,
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
  
  // State for filters
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedPainPoints, setSelectedPainPoints] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

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
    defaultValueScore: c.default_value_score,
    defaultFeasibilityScore: c.default_feasibility_score,
    // Convert to check if any numeric value (either as string or number)
    hasValueScore: c.valueScore !== null && c.valueScore !== undefined || 
                  c.default_value_score !== null && c.default_value_score !== undefined,
    hasFeasibilityScore: c.feasibilityScore !== null && c.feasibilityScore !== undefined || 
                        c.default_feasibility_score !== null && c.default_feasibility_score !== undefined
  })));
  
  // Extract unique roles, pain points, and goals
  const roles = useMemo(() => {
    const roleSet = new Set<string>();
    capabilities.forEach(cap => {
      if (cap.role) roleSet.add(cap.role);
    });
    return Array.from(roleSet).sort();
  }, [capabilities]);
  
  const painPoints = useMemo(() => {
    const painPointSet = new Set<string>();
    capabilities.forEach(cap => {
      if (cap.painPoint) painPointSet.add(cap.painPoint);
    });
    return Array.from(painPointSet).sort();
  }, [capabilities]);
  
  const goals = useMemo(() => {
    const goalSet = new Set<string>();
    capabilities.forEach(cap => {
      if (cap.goal) goalSet.add(cap.goal);
    });
    return Array.from(goalSet).sort();
  }, [capabilities]);
  
  // Filter capabilities based on selected filters
  const filteredCapabilities = useMemo(() => {
    return capabilities.filter(cap => {
      // Apply role filter
      if (selectedRoles.length > 0 && (!cap.role || !selectedRoles.includes(cap.role))) {
        return false;
      }
      
      // Apply pain point filter
      if (selectedPainPoints.length > 0 && (!cap.painPoint || !selectedPainPoints.includes(cap.painPoint))) {
        return false;
      }
      
      // Apply goal filter
      if (selectedGoals.length > 0 && (!cap.goal || !selectedGoals.includes(cap.goal))) {
        return false;
      }
      
      return true;
    });
  }, [capabilities, selectedRoles, selectedPainPoints, selectedGoals]);
  
  // Filter out capabilities that don't have scores needed for plotting
  const plottableCapabilities = filteredCapabilities.filter(
    cap => {
      // Get the actual values we'll use for plotting, with fallbacks
      const valueScore = Number(cap.valueScore ?? cap.default_value_score ?? 50);
      const feasibilityScore = Number(cap.feasibilityScore ?? cap.default_feasibility_score ?? 50);
      
      // Check if we have valid numeric values
      const hasValidValueScore = !isNaN(valueScore) && valueScore >= 0 && valueScore <= 100;
      const hasValidFeasibilityScore = !isNaN(feasibilityScore) && feasibilityScore >= 0 && feasibilityScore <= 100;
      
      const result = hasValidValueScore && hasValidFeasibilityScore;
      
      // Enhanced debugging
      console.log(`Capability "${cap.name}":`, {
        originalValueScore: cap.valueScore,
        originalFeasibilityScore: cap.feasibilityScore,
        defaultValueScore: cap.default_value_score,
        defaultFeasibilityScore: cap.default_feasibility_score,
        finalValueScore: valueScore,
        finalFeasibilityScore: feasibilityScore,
        hasValidValueScore,
        hasValidFeasibilityScore,
        willInclude: result
      });
      
      if (!result) {
        console.log(`⚠️ Filtering out capability "${cap.name}" - invalid scores after fallbacks`);
      } else {
        console.log(`✅ Including capability "${cap.name}" for plotting`);
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
      {/* Filter Controls */}
      <div className="mb-6 flex flex-wrap gap-4">
        {/* Role Filter */}
        {roles.length > 0 && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Role:</label>
            <select 
              className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#e84c2b] focus:border-[#e84c2b]"
              multiple
              value={selectedRoles}
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedRoles(options);
              }}
            >
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            {selectedRoles.length > 0 && (
              <button 
                className="mt-1 text-xs text-[#e84c2b] hover:underline"
                onClick={() => setSelectedRoles([])}
              >
                Clear selection
              </button>
            )}
          </div>
        )}
        
        {/* Pain Point Filter */}
        {painPoints.length > 0 && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Pain Point:</label>
            <select 
              className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#e84c2b] focus:border-[#e84c2b]"
              multiple
              value={selectedPainPoints}
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedPainPoints(options);
              }}
            >
              {painPoints.map(painPoint => (
                <option key={painPoint} value={painPoint}>{painPoint}</option>
              ))}
            </select>
            {selectedPainPoints.length > 0 && (
              <button 
                className="mt-1 text-xs text-[#e84c2b] hover:underline"
                onClick={() => setSelectedPainPoints([])}
              >
                Clear selection
              </button>
            )}
          </div>
        )}
        
        {/* Goals Filter */}
        {goals.length > 0 && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Goal:</label>
            <select 
              className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#e84c2b] focus:border-[#e84c2b]"
              multiple
              value={selectedGoals}
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions, option => option.value);
                setSelectedGoals(options);
              }}
            >
              {goals.map(goal => (
                <option key={goal} value={goal}>{goal}</option>
              ))}
            </select>
            {selectedGoals.length > 0 && (
              <button 
                className="mt-1 text-xs text-[#e84c2b] hover:underline"
                onClick={() => setSelectedGoals([])}
              >
                Clear selection
              </button>
            )}
          </div>
        )}
      </div>

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