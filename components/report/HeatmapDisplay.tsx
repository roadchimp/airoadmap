import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HeatmapData, ValueLevel, EffortLevel } from "@shared/schema";
import { useTheme } from "@/components/ui/theme-provider";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface HeatmapDisplayProps {
  heatmapData: HeatmapData;
  title: string;
  description?: string;
}

const HeatmapDisplay: React.FC<HeatmapDisplayProps> = ({ 
  heatmapData, 
  title, 
  description 
}) => {
  const { theme } = useTheme();
  
  // State for filters
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedPainPoints, setSelectedPainPoints] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  
  // Extract unique roles, pain points, and goals from the heatmap data
  const { roles, painPoints, goals } = useMemo(() => {
    const rolesSet = new Set<string>();
    const painPointsSet = new Set<string>();
    const goalsSet = new Set<string>();
    
    // Iterate through all cells in the matrix
    Object.values(heatmapData.matrix).forEach(valueLevel => {
      Object.values(valueLevel).forEach(effortLevel => {
        effortLevel.items.forEach(item => {
          // Assuming these properties exist in the item metadata
          // In a real implementation, you would need to ensure these properties exist
          if (item.role) rolesSet.add(item.role);
          if (item.painPoint) painPointsSet.add(item.painPoint);
          if (item.goal) goalsSet.add(item.goal);
        });
      });
    });
    
    return {
      roles: Array.from(rolesSet).sort(),
      painPoints: Array.from(painPointsSet).sort(),
      goals: Array.from(goalsSet).sort()
    };
  }, [heatmapData]);
  
  // Filter the heatmap data based on selected filters
  const filteredHeatmapData = useMemo(() => {
    if (selectedRoles.length === 0 && selectedPainPoints.length === 0 && selectedGoals.length === 0) {
      return heatmapData;
    }
    
    // Create a deep copy of the heatmap data
    const filtered: HeatmapData = {
      matrix: JSON.parse(JSON.stringify(heatmapData.matrix))
    };
    
    // Filter items in each cell
    Object.keys(filtered.matrix).forEach(valueLevel => {
      Object.keys(filtered.matrix[valueLevel as ValueLevel]).forEach(effortLevel => {
        filtered.matrix[valueLevel as ValueLevel][effortLevel as EffortLevel].items = 
          filtered.matrix[valueLevel as ValueLevel][effortLevel as EffortLevel].items.filter(item => {
            const roleMatch = selectedRoles.length === 0 || (item.role && selectedRoles.includes(item.role));
            const painPointMatch = selectedPainPoints.length === 0 || (item.painPoint && selectedPainPoints.includes(item.painPoint));
            const goalMatch = selectedGoals.length === 0 || (item.goal && selectedGoals.includes(item.goal));
            
            return roleMatch && painPointMatch && goalMatch;
          });
      });
    });
    
    return filtered;
  }, [heatmapData, selectedRoles, selectedPainPoints, selectedGoals]);
  
  // Define the priority colors
  const priorityColors = {
    high: "bg-destructive/20",
    medium: "bg-warning/20",
    low: "bg-success/20",
    not_recommended: "bg-muted"
  };
  
  // Define the value levels and effort levels in order
  const valueLevels: ValueLevel[] = ["high", "medium", "low"];
  const effortLevels: EffortLevel[] = ["high", "medium", "low"];
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
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
        
        <div className="pb-8">
          <div className="relative">
            {/* Y-axis label */}
            <div className="absolute -left-10 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-medium text-foreground">
              Business Value
            </div>
            
            {/* Heatmap Grid */}
            <div className="w-full aspect-square max-w-xl mx-auto border border-neutral-300 rounded">
              <div className="grid grid-cols-3 grid-rows-3 h-full">
                {/* Generate the heatmap cells */}
                {valueLevels.map((valueLevel, valueIndex) => (
                  effortLevels.map((effortLevel, effortIndex) => {
                    const cell = filteredHeatmapData.matrix[valueLevel][effortLevel];
                    return (
                      <div 
                        key={`${valueLevel}-${effortLevel}`}
                        className={`
                          ${priorityColors[cell.priority]} 
                          ${valueIndex < 2 ? 'border-b' : ''} 
                          ${effortIndex < 2 ? 'border-r' : ''} 
                          border-neutral-300 p-2 flex items-center justify-center
                        `}
                      >
                        <div className="text-center">
                          <div className="text-xs font-medium">
                            {cell.priority === "high" ? "Transform" : 
                             cell.priority === "medium" ? "Monitor" : 
                             cell.priority === "low" ? "Consider" : "Deprioritize"}
                          </div>
                          {cell.items.length > 0 && (
                            <div className="text-xs text-foreground mt-1">
                              {cell.items.map(item => item.title).join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ))}
              </div>
            </div>
            
            {/* X-axis label */}
            <div className="text-center text-sm font-medium text-foreground mt-2">
              Implementation Effort
            </div>
            
            {/* X-axis markers */}
            <div className="flex justify-between mt-1 px-1 text-xs text-muted-foreground">
              <div>High Effort</div>
              <div>Medium Effort</div>
              <div>Low Effort</div>
            </div>
            
            {/* Y-axis markers */}
            <div className="absolute -left-1 top-0 h-full flex flex-col justify-between py-1 text-xs text-muted-foreground">
              <div>High Value</div>
              <div>Medium Value</div>
              <div>Low Value</div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-6 flex justify-center space-x-6">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-destructive/20 mr-2"></div>
              <span className="text-xs text-foreground">High Priority</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-warning/20 mr-2"></div>
              <span className="text-xs text-foreground">Medium Priority</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-success/20 mr-2"></div>
              <span className="text-xs text-foreground">Low Priority</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-muted mr-2"></div>
              <span className="text-xs text-foreground">Not Recommended</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeatmapDisplay;
