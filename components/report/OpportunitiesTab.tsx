'use client';

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PrioritizedItem } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface OpportunitiesTabProps {
  prioritizedItems: PrioritizedItem[];
  title?: string;
  description?: string;
}

const OpportunitiesTab: React.FC<OpportunitiesTabProps> = ({
  prioritizedItems,
  title = "Prioritized Opportunities",
  description = "Ranked list of roles and functions based on transformation potential."
}) => {
  // State for tracking selected filters
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedValueRanges, setSelectedValueRanges] = useState<string[]>([]);

  // Extract unique departments from items
  const departments = useMemo(() => {
    const uniqueDepartments = new Set<string>();
    prioritizedItems.forEach(item => {
      if (item.department && item.department.trim() !== "" && item.department !== "General") {
        uniqueDepartments.add(item.department);
      }
    });
    return Array.from(uniqueDepartments).sort();
  }, [prioritizedItems]);

  // Extract priority levels
  const priorities = useMemo(() => {
    const uniquePriorities = new Set<string>();
    prioritizedItems.forEach(item => uniquePriorities.add(item.priority));
    return Array.from(uniquePriorities);
  }, [prioritizedItems]);

  // Define value score ranges
  const valueRanges = ["80-100", "60-79", "40-59", "0-39"];

  // Filter items based on selections
  const filteredItems = useMemo(() => {
    return prioritizedItems.filter(item => {
      // Apply department filter
      if (selectedDepartments.length > 0 && !selectedDepartments.includes(item.department)) {
        return false;
      }
      
      // Apply priority filter
      if (selectedPriorities.length > 0 && !selectedPriorities.includes(item.priority)) {
        return false;
      }
      
      // Apply value range filter
      if (selectedValueRanges.length > 0) {
        const valueScore = item.valueScore * 20; // Convert 1-5 scale to 0-100
        return selectedValueRanges.some(range => {
          const [min, max] = range.split('-').map(Number);
          return valueScore >= min && valueScore <= max;
        });
      }
      
      return true;
    });
  }, [prioritizedItems, selectedDepartments, selectedPriorities, selectedValueRanges]);

  // Define priority badge styling
  const priorityBadges = {
    high: "bg-red-100 text-red-800",
    medium: "bg-orange-100 text-orange-800",
    low: "bg-yellow-100 text-yellow-800",
    not_recommended: "bg-green-100 text-green-800"
  };
  
  const priorityLabels = {
    high: "High",
    medium: "Medium",
    low: "Low",
    not_recommended: "Not Recommended"
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Department Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {selectedDepartments.length === 0 
                  ? "All Departments" 
                  : `Departments (${selectedDepartments.length})`}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {departments.map(department => (
                <DropdownMenuCheckboxItem
                  key={department}
                  checked={selectedDepartments.includes(department)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedDepartments(prev => [...prev, department]);
                    } else {
                      setSelectedDepartments(prev => prev.filter(d => d !== department));
                    }
                  }}
                >
                  {department}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Priority Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                All Priorities <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {priorities.map(priority => (
                <DropdownMenuCheckboxItem
                  key={priority}
                  checked={selectedPriorities.includes(priority)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedPriorities(prev => [...prev, priority]);
                    } else {
                      setSelectedPriorities(prev => prev.filter(p => p !== priority));
                    }
                  }}
                >
                  {priorityLabels[priority as keyof typeof priorityLabels] || priority}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Value Score Range Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                All Values <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {valueRanges.map(range => (
                <DropdownMenuCheckboxItem
                  key={range}
                  checked={selectedValueRanges.includes(range)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedValueRanges(prev => [...prev, range]);
                    } else {
                      setSelectedValueRanges(prev => prev.filter(r => r !== range));
                    }
                  }}
                >
                  {range} Value
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Rank</TableHead>
                <TableHead>Role/Function</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Value Score</TableHead>
                <TableHead>Effort Score</TableHead>
                <TableHead>Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell className="text-neutral-600">{item.department}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden mr-2">
                        <div 
                          className="h-full bg-red-500" 
                          style={{ width: `${item.valueScore * 20}%` }} 
                        />
                      </div>
                      {item.valueScore}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden mr-2">
                        <div 
                          className="h-full bg-amber-500" 
                          style={{ width: `${item.effortScore * 20}%` }} 
                        />
                      </div>
                      {item.effortScore}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityBadges[item.priority as keyof typeof priorityBadges]}`}>
                      {priorityLabels[item.priority as keyof typeof priorityLabels] || item.priority}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-neutral-500">
                    No opportunities match the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default OpportunitiesTab; 