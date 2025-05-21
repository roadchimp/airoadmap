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

  const getPriorityBadgeVariant = (priority: string | null | undefined) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (!paginatedCapabilities || paginatedCapabilities.length === 0) {
    return <p className="text-center text-gray-500 py-8">No AI capabilities match the current filters.</p>;
  }

  return (
    <Table className="min-w-full divide-y divide-gray-200">
      <TableHeader>
        <TableRow>
          <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Rank</TableHead>
          <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</TableHead>
          <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Category</TableHead>
          <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</TableHead>
          <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Value</TableHead>
          <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Feasibility</TableHead>
          <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Impact</TableHead>
          <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Priority</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="bg-white divide-y divide-gray-200">
        {paginatedCapabilities.map((capability, index) => (
          <TableRow 
            key={capability.id} 
            onClick={() => onCapabilityClick(capability)} 
            className="hover:bg-gray-50 cursor-pointer"
          >
            <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{capability.rank || index + 1}</TableCell>
            <TableCell className="px-4 py-3 text-sm font-medium text-gray-900">{capability.name}</TableCell>
            <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{capability.category}</TableCell>
            <TableCell className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
              {capability.description ? capability.description.substring(0, 100) + (capability.description.length > 100 ? '...' : '') : 'No description'}
            </TableCell>
            <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{capability.valueScore ?? capability.defaultValueScore ?? 'N/A'}</TableCell>
            <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{capability.feasibilityScore ?? capability.defaultFeasibilityScore ?? 'N/A'}</TableCell>
            <TableCell className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{capability.impactScore ?? capability.defaultImpactScore ?? 'N/A'}</TableCell>
            <TableCell className="px-4 py-3 whitespace-nowrap text-sm">
              <Badge variant={getPriorityBadgeVariant(capability.priority || 'Medium')}>{capability.priority || 'Medium'}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
