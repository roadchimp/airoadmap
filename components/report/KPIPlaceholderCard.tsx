import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceImpact } from "@shared/schema";

interface KPIPlaceholderCardProps {
  performanceImpact: PerformanceImpact;
  title: string;
}

const KPIPlaceholderCard: React.FC<KPIPlaceholderCardProps> = ({ performanceImpact, title }) => {
  return (
    <Card className="mb-6 border-l-4 border-accent-500">
      <CardHeader className="flex flex-row items-start space-x-2 pb-2">
        <span className="material-icons text-accent-500">trending_up</span>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {performanceImpact.roleImpacts.map((impact, index) => (
            <div key={index}>
              <h4 className="text-sm font-medium mb-1">{impact.roleTitle}</h4>
              {Array.isArray(impact.metrics) &&
                impact.metrics.map((metric: any, metricIndex: number) => (
                  <div key={metricIndex}>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-neutral-500">{metric.name}</div>
                      <div className="text-sm font-medium text-secondary-500">-{metric.improvement}%</div>
                    </div>
                    <div className="mt-1 h-2 w-full bg-neutral-200 rounded-full">
                      <div 
                        className="h-full bg-secondary-500 rounded-full" 
                        style={{ width: `${metric.improvement}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              }
            </div>
          ))}
          
          <div className="pt-4 mt-4 border-t border-neutral-200">
            <h4 className="text-sm font-medium mb-2">Estimated Annual ROI</h4>
            <div className="text-3xl font-bold text-accent-500">
              ${performanceImpact.estimatedRoi.toLocaleString()}
            </div>
            <div className="text-xs text-neutral-500 mt-1">Based on time savings and increased throughput</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KPIPlaceholderCard;
