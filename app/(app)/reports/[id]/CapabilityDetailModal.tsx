"use client";

import React from 'react';
import type { FullAICapability } from '@/server/storage'; // FullAICapability from storage context
import type { JobRole, AiTool } from '@shared/schema'; // Import AiTool and JobRole from shared schema
import { XIcon, ExternalLinkIcon } from 'lucide-react'; // Assuming lucide-react for icons as per project context
import { getRoleColor, getRoleName } from '@/lib/client/color-utils';
import { RecommendedToolsTable } from './RecommendedToolsTable'; // Import the new table

// --- Helper functions (Ideally move to a shared utility file e.g., lib/report-utils.ts or lib/color-utils.ts) ---

const implementationFactorColors = {
    technicalComplexity: '#e84c2b', // Primary Red
    dataReadiness: '#f8a97a',     // Secondary Orange
    changeManagement: '#e84c2b'   // Primary Red (as per spec for 2/3 bars)
};

interface CapabilityDetailModalProps {
  capability: FullAICapability | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CapabilityDetailModal({
  capability,
  isOpen,
  onClose,
}: CapabilityDetailModalProps) {
  if (!isOpen || !capability) return null;

  // Default implementation factors since they're no longer in the restructured schema
  const techComplexity = 50; // Default value
  const dataReadiness = 50; // Default value
  const changeManagement = 50; // Default value
  
  const quickImplementationText = "No"; // Default value after schema change
  const hasDependenciesText = "No"; // Default value after schema change

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[99] p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">{capability.name}</h3>
            {capability.category && (
              <p className="text-sm text-gray-500 mt-1">Category: {capability.category}</p>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mt-2 -mr-2"
            aria-label="Close modal"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-grow">
          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</h4>
            <p className="text-gray-700 leading-relaxed">{capability.description || 'No description provided.'}</p>
          </div>

          {capability.applicableRoles && capability.applicableRoles.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Role-Specific Impact</h4>
              <div className="space-y-2">
                {capability.applicableRoles.map((role: JobRole) => {
                  const roleIdStr = String(role.id);
                  const impactScore = capability.roleImpact?.[roleIdStr];
                  return (
                    <div key={role.id} className="flex items-center bg-gray-50 p-2 rounded-md">
                      <div 
                        className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                        style={{ backgroundColor: getRoleColor(role.title) }} 
                      />
                      <span className="font-medium text-gray-700 flex-grow">{getRoleName(role.title)}</span>
                      {typeof impactScore === 'number' && (
                        <span className="text-sm text-gray-600 ml-auto">Impact: {impactScore}/100</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fallback when applicableRoles is empty but we know what roles are from the assessment */}
          {(!capability.applicableRoles || capability.applicableRoles.length === 0) && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Role Impact</h4>
              <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600">
                <p>This capability has significant impact for the following roles:</p>
                <ul className="list-disc pl-5 mt-2">
                  {capability.role ? (
                    <li className="mt-1">{capability.role}</li>
                  ) : (
                    <>
                      <li className="mt-1">Sales Development Representative</li>
                      <li className="mt-1">Sales</li>
                      <li className="mt-1">Systems/IT/Infrastructure</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Implementation Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <span className="text-xs text-gray-500">Technical Complexity</span>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                  <div 
                    className="h-2.5 rounded-full"
                    style={{
                      width: `${techComplexity}%`,
                      backgroundColor: implementationFactorColors.technicalComplexity,
                    }}
                  />
                </div>
                 <span className="text-xs text-gray-600 float-right">{techComplexity}%</span>
              </div>
              <div>
                <span className="text-xs text-gray-500">Data Readiness</span>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                  <div 
                    className="h-2.5 rounded-full" 
                    style={{ 
                      width: `${dataReadiness}%`,
                      backgroundColor: implementationFactorColors.dataReadiness,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-600 float-right">{dataReadiness}%</span>
              </div>
              <div>
                <span className="text-xs text-gray-500">Change Management</span>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                  <div 
                    className="h-2.5 rounded-full" 
                    style={{ 
                      width: `${changeManagement}%`,
                      backgroundColor: implementationFactorColors.changeManagement,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-600 float-right">{changeManagement}%</span>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-gray-500 mr-2">Quick Implementation:</span>
                <span className="text-xs font-medium text-red-600">{quickImplementationText}</span>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-gray-500 mr-2">Has Dependencies:</span>
                <span className="text-xs font-medium text-green-600">{hasDependenciesText}</span>
              </div>
            </div>
          </div>

          {capability.recommendedTools && capability.recommendedTools.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Recommended AI Tools</h4>
              <div className="space-y-3">
                {capability.recommendedTools.map((tool) => (
                  <div key={tool.tool_id} className="bg-white border border-gray-200 rounded-md p-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-gray-800">{tool.tool_name}</h5>
                      {tool.website_url && (
                        <a 
                          href={tool.website_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        >
                          Visit <ExternalLinkIcon className="ml-1 h-3 w-3" />
                        </a>
                      )}
                    </div>
                    {tool.primary_category && (
                      <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded mt-1">
                        {tool.primary_category}
                      </span>
                    )}
                    {tool.description && (
                      <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer (Optional - can add actions here if needed) */}
        {/* <div className="p-4 bg-gray-50 border-t border-gray-200 text-right">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div> */}
      </div>
    </div>
  );
} 