'use client';

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PrioritizedItem } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, X } from "lucide-react";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface OpportunitiesTabProps {
  prioritizedItems: PrioritizedItem[];
  title?: string;
  description?: string;
}

// Interface for the metrics shown in the detailed view
interface PerformanceMetric {
  name: string;
  value: string;
  improvement: number;
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
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedPainPoints, setSelectedPainPoints] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  
  // State for detailed view
  const [selectedItem, setSelectedItem] = useState<PrioritizedItem | null>(null);

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

  // Extract roles, pain points, and goals
  const { roles, painPoints, goals } = useMemo(() => {
    const rolesSet = new Set<string>();
    const painPointsSet = new Set<string>();
    const goalsSet = new Set<string>();
    
    prioritizedItems.forEach(item => {
      if (item.role) rolesSet.add(item.role);
      if (item.painPoint) painPointsSet.add(item.painPoint);
      if (item.goal) goalsSet.add(item.goal);
    });
    
    return {
      roles: Array.from(rolesSet).sort(),
      painPoints: Array.from(painPointsSet).sort(),
      goals: Array.from(goalsSet).sort()
    };
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
        const valueScore = item.valueScore;
        return selectedValueRanges.some(range => {
          const [min, max] = range.split('-').map(Number);
          return valueScore >= min && valueScore <= max;
        });
      }
      
      // Apply role filter
      if (selectedRoles.length > 0 && (!item.role || !selectedRoles.includes(item.role))) {
        return false;
      }
      
      // Apply pain point filter
      if (selectedPainPoints.length > 0 && (!item.painPoint || !selectedPainPoints.includes(item.painPoint))) {
        return false;
      }
      
      // Apply goal filter
      if (selectedGoals.length > 0 && (!item.goal || !selectedGoals.includes(item.goal))) {
        return false;
      }
      
      return true;
    });
  }, [prioritizedItems, selectedDepartments, selectedPriorities, selectedValueRanges, selectedRoles, selectedPainPoints, selectedGoals]);

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

  // Sample metrics data generator based on the selected item
  const getMetricsForItem = (item: PrioritizedItem): PerformanceMetric[] => {
    // You would normally fetch this from the API or it would be included in the item data
    // This is just sample data based on department type
    if (item.department === "Support") {
      return [
        { name: "Time to Resolution", value: "2.5 hours", improvement: -35 },
        { name: "Customer Satisfaction", value: "92%", improvement: 15 },
        { name: "Tickets Handled per Day", value: "45", improvement: 28 }
      ];
    } else if (item.department === "Operations") {
      return [
        { name: "Report Generation Time", value: "1.2 hours", improvement: -65 },
        { name: "Data Processing Volume", value: "2500 records/day", improvement: 120 },
        { name: "Error Rate", value: "0.5%", improvement: -75 }
      ];
    } else if (item.department === "Marketing") {
      return [
        { name: "Content Production Rate", value: "12 pieces/week", improvement: 100 },
        { name: "Engagement Rate", value: "4.8%", improvement: 15 },
        { name: "Time to Publish", value: "1.5 days", improvement: -50 }
      ];
    } else if (item.department === "Logistics") {
      return [
        { name: "Stockout Rate", value: "1.2%", improvement: -40 },
        { name: "Inventory Turnover", value: "12.5", improvement: 15 },
        { name: "Order Fulfillment Time", value: "1.8 days", improvement: -25 }
      ];
    } else if (item.department === "Human Resources") {
      return [
        { name: "Time to Screen", value: "1.2 days", improvement: -60 },
        { name: "Quality of Hire", value: "85%", improvement: 12 },
        { name: "Candidate Experience Score", value: "4.6/5", improvement: 15 }
      ];
    }
    // Default metrics for other departments
    return [
      { name: "Efficiency", value: "75%", improvement: 25 },
      { name: "Quality", value: "82%", improvement: 15 },
      { name: "Cost", value: "$1200/month", improvement: -30 }
    ];
  };

  // Handle row click to show detailed view
  const handleRowClick = (item: PrioritizedItem) => {
    setSelectedItem(item);
  };

  // Render detailed view for a selected item
  const renderDetailedView = () => {
    if (!selectedItem) return null;

    const metrics = getMetricsForItem(selectedItem);
    const aiAdoptionScore = selectedItem.aiAdoptionScore || 75; // Default score if not provided

    return (
      <Card className="mb-6 relative">
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-2 top-2 z-10" 
          onClick={() => setSelectedItem(null)}
        >
          <X className="h-4 w-4" />
        </Button>
        <CardHeader className="pb-2">
          <CardTitle>{selectedItem.title} - Detailed View</CardTitle>
          <CardDescription>{selectedItem.department}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Adoption Score Components */}
            <div>
              <h3 className="text-lg font-medium mb-2">AI Adoption Score Components</h3>
              <div className="mb-4">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-medium">Overall Score</span>
                  <span className="text-sm font-bold">{aiAdoptionScore}</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#e84c2b] rounded-full"
                    style={{ width: `${aiAdoptionScore}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Implementation Details */}
            <div>
              <h3 className="text-lg font-medium mb-2">Implementation Details</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-500">Value Score:</span>
                  <span className="text-sm font-bold float-right">{selectedItem.valueScore}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Effort Score:</span>
                  <span className="text-sm font-bold float-right">{selectedItem.effortScore}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Priority:</span>
                  <span className="text-sm font-bold float-right">
                    {priorityLabels[selectedItem.priority as keyof typeof priorityLabels] || selectedItem.priority}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Performance Metrics</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Current Value</TableHead>
                  <TableHead>Improvement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((metric, index) => (
                  <TableRow key={index}>
                    <TableCell>{metric.name}</TableCell>
                    <TableCell>{metric.value}</TableCell>
                    <TableCell>
                      <span className={metric.improvement >= 0 ? "text-green-600" : "text-red-600"}>
                        {metric.improvement >= 0 ? '+' : ''}{metric.improvement}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
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
                {selectedPriorities.length === 0 
                  ? "All Priorities" 
                  : `Priorities (${selectedPriorities.length})`}
                <ChevronDown className="ml-2 h-4 w-4" />
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
                {selectedValueRanges.length === 0 
                  ? "All Values" 
                  : `Values (${selectedValueRanges.length})`}
                <ChevronDown className="ml-2 h-4 w-4" />
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
          
          {/* Role Filter */}
          {roles.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {selectedRoles.length === 0 
                    ? "All Roles" 
                    : `Roles (${selectedRoles.length})`}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {roles.map(role => (
                  <DropdownMenuCheckboxItem
                    key={role}
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRoles(prev => [...prev, role]);
                      } else {
                        setSelectedRoles(prev => prev.filter(r => r !== role));
                      }
                    }}
                  >
                    {role}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Pain Point Filter */}
          {painPoints.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {selectedPainPoints.length === 0 
                    ? "All Pain Points" 
                    : `Pain Points (${selectedPainPoints.length})`}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {painPoints.map(painPoint => (
                  <DropdownMenuCheckboxItem
                    key={painPoint}
                    checked={selectedPainPoints.includes(painPoint)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPainPoints(prev => [...prev, painPoint]);
                      } else {
                        setSelectedPainPoints(prev => prev.filter(p => p !== painPoint));
                      }
                    }}
                  >
                    {painPoint}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Goals Filter */}
          {goals.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {selectedGoals.length === 0 
                    ? "All Goals" 
                    : `Goals (${selectedGoals.length})`}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {goals.map(goal => (
                  <DropdownMenuCheckboxItem
                    key={goal}
                    checked={selectedGoals.includes(goal)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedGoals(prev => [...prev, goal]);
                      } else {
                        setSelectedGoals(prev => prev.filter(g => g !== goal));
                      }
                    }}
                  >
                    {goal}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="overflow-auto">
          <Table>
            <TableHeader className="bg-gray-200">
              <TableRow>
                <TableHead className="w-[60px]">Rank</TableHead>
                <TableHead>Role/Function</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Value Score</TableHead>
                <TableHead>Effort Score</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>AI Adoption Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item, index) => (
                <TableRow 
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  className="cursor-pointer hover:bg-slate-50"
                  data-state={selectedItem?.id === item.id ? "selected" : undefined}
                >
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell className="text-neutral-600">{item.department}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden mr-2">
                        <div 
                          className="h-full bg-red-500" 
                          style={{ width: `${item.valueScore}%` }} 
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
                          style={{ width: `${item.effortScore}%` }} 
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
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden mr-2">
                        <div 
                          className="h-full bg-[#e84c2b]" 
                          style={{ width: `${item.aiAdoptionScore || 0}%` }} 
                        />
                      </div>
                      {item.aiAdoptionScore || 'N/A'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-neutral-500">
                    No opportunities match the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Render detailed view if an item is selected */}
        {selectedItem && renderDetailedView()}
      </CardContent>
    </Card>
  );
};

export default OpportunitiesTab; 