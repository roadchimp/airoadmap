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
import type { AiTool } from "@shared/schema"; // Ensure AiTool type is correctly imported

interface RecommendedToolsTableProps {
  tools: AiTool[];
}

export function RecommendedToolsTable({ tools }: RecommendedToolsTableProps) {
  if (!tools || tools.length === 0) {
    return <p className="text-sm text-gray-500">No specific tools recommended for this capability.</p>;
  }

  return (
    <div className="mt-4">
      <h4 className="text-md font-semibold mb-2">Recommended Tools</h4>
      <Table className="min-w-full divide-y divide-gray-200 border">
        <TableHeader>
          <TableRow>
            <TableHead className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tool Name</TableHead>
            <TableHead className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</TableHead>
            <TableHead className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</TableHead>
            <TableHead className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white divide-y divide-gray-200">
          {tools.map((tool) => (
            <TableRow key={tool.tool_id}>
              <TableCell className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{tool.tool_name}</TableCell>
              <TableCell className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{tool.primary_category}</TableCell>
              <TableCell className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{tool.license_type ?? 'N/A'}</TableCell>
              <TableCell className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">
                {tool.website_url ? (
                  <Button 
                    variant="link"
                    className="p-0 h-auto text-blue-600 hover:text-blue-800"
                    onClick={() => tool.website_url && window.open(tool.website_url, '_blank')}
                  >
                    Visit Site <ExternalLinkIcon className="ml-1 h-3 w-3" />
                  </Button>
                ) : (
                  'N/A'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 