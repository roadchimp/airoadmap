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
import { Button } from "@/components/ui/button";
import { ExternalLinkIcon } from 'lucide-react';
import type { ToolWithMappedCapabilities } from "@/server/storage";

interface AIToolsTableProps {
  tools: ToolWithMappedCapabilities[];
}

export function AIToolsTable({ tools }: AIToolsTableProps) {
  if (!tools || tools.length === 0) {
    return <p className="text-sm text-gray-500">No AI tools found.</p>;
  }

  return (
    <div className="w-full">
      <Table className="min-w-full divide-y divide-gray-200 border">
        <TableHeader className="bg-gray-200">
          <TableRow>
            <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Tool Name</TableHead>
            <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Category</TableHead>
            <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Description</TableHead>
            <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Mapped AI Capabilities</TableHead>
            <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Website</TableHead>
            <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">License</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white divide-y divide-gray-200">
          {tools.map((tool) => (
            <TableRow key={tool.tool_id} className="hover:bg-gray-50">
              <TableCell className="px-4 py-3 text-sm font-medium text-gray-900">
                {tool.tool_name}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm text-gray-700">
                {tool.primary_category}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                <div className="truncate" title={tool.description || 'No description'}>
                  {tool.description ? 
                    (tool.description.length > 100 ? `${tool.description.substring(0, 100)}...` : tool.description)
                    : 'No description'
                  }
                </div>
              </TableCell>
              <TableCell className="px-4 py-3 text-sm text-gray-700">
                <div className="flex flex-wrap gap-1 max-w-md">
                  {tool.mappedCapabilities && tool.mappedCapabilities.length > 0 ? (
                    tool.mappedCapabilities.map(capability => (
                      <span 
                        key={capability.id} 
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"
                        title={capability.description || capability.name}
                      >
                        {capability.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 italic">No capabilities mapped</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="px-4 py-3 text-sm text-gray-700">
                {tool.website_url ? (
                  <Button 
                    variant="link"
                    className="p-0 h-auto text-blue-600 hover:text-blue-800"
                    onClick={() => tool.website_url && window.open(tool.website_url, '_blank')}
                  >
                    <ExternalLinkIcon className="h-4 w-4" />
                  </Button>
                ) : (
                  'N/A'
                )}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm text-gray-700">
                {tool.license_type ?? 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 