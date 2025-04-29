import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HeatmapData, ValueLevel, EffortLevel } from "@shared/schema";
import { useTheme } from "@/components/ui/theme-provider";

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
                    const cell = heatmapData.matrix[valueLevel][effortLevel];
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
