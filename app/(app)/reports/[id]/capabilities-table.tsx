"use client";

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { FullAICapability } from "@/server/storage"; // Corrected: FullAICapability comes from the storage layer context

interface CapabilitiesTableProps {
  capabilities: FullAICapability[];
  onCapabilityClick: (capability: FullAICapability) => void;
  itemsPerPage?: number;
  currentPage?: number;
}

export function CapabilitiesTable({
  capabilities,
  onCapabilityClick,
  itemsPerPage = 10, // Default items per page
  currentPage = 1,  // Default current page
}: CapabilitiesTableProps) {
  // Calculate paginated capabilities
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCapabilities = capabilities.slice(startIndex, endIndex);

  const getPriorityBadgeClass = (priority: string | null | undefined) => {
    // Use grayscale colors for priority badges
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-gray-800 text-white';
      case 'medium':
        return 'bg-gray-500 text-white';
      case 'low':
        return 'bg-gray-300 text-gray-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  // Helper to render score slider
  const renderScoreSlider = (score: number | string | null | undefined) => {
    // Convert score to number if it's a string
    const numericScore = score !== null && score !== undefined ? Number(score) : 0;
    const percentage = Math.min(100, Math.max(0, numericScore));
    
    return (
      <div className="flex items-center gap-2">
        <div className="w-full max-w-[100px] bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full bg-orange-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium">{numericScore}</span>
      </div>
    );
  };

  if (!paginatedCapabilities || paginatedCapabilities.length === 0) {
    return <p className="text-center text-gray-500 py-8">No AI capabilities match the current filters.</p>;
  }

  return (
    <Table className="min-w-full divide-y divide-gray-200">
      <TableHeader className="bg-gray-200">
        <TableRow>
          <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Rank</TableHead>
          <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</TableHead>
          <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Category</TableHead>
          <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Description</TableHead>
          <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Value</TableHead>
          <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Feasibility</TableHead>
          <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Impact</TableHead>
          <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Priority</TableHead>
          <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">Applicable Roles</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="bg-white divide-y divide-gray-200">
        {paginatedCapabilities.map((capability, index) => (
          <TableRow 
            key={capability.id} 
            onClick={() => onCapabilityClick(capability)} 
            className="hover:bg-gray-50 cursor-pointer"
          >
            <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{startIndex + index + 1}</TableCell>
            <TableCell className="px-4 py-3 text-sm font-medium text-gray-900">{capability.name}</TableCell>
            <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{capability.category}</TableCell>
            <TableCell className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
              {capability.description ? capability.description.substring(0, 100) + (capability.description.length > 100 ? '...' : '') : 'No description'}
            </TableCell>
            <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
              {renderScoreSlider(capability.valueScore ?? capability.default_value_score)}
            </TableCell>
            <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
              {renderScoreSlider(capability.feasibilityScore ?? capability.default_feasibility_score)}
            </TableCell>
            <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
              {renderScoreSlider(capability.impactScore ?? capability.default_impact_score)}
            </TableCell>
            <TableCell className="px-4 py-3 whitespace-nowrap text-sm">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeClass(capability.priority || 'Medium')}`}>
                {capability.priority || 'Medium'}
              </span>
            </TableCell>
            <TableCell className="px-4 py-3 text-sm text-gray-700">
              <div className="flex flex-wrap gap-1">
                {capability.applicableRoles && capability.applicableRoles.length > 0 ? (
                  capability.applicableRoles.map(role => (
                    <span 
                      key={role.id} 
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {role.title}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-400">No roles specified</span>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
