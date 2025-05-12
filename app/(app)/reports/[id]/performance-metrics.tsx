"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PerformanceMetric {
  name: string;
  unit: string;
  description: string;
  relevantStages: string[];
}

interface PerformanceMetricsTableProps {
  metrics?: PerformanceMetric[];
}

export const PerformanceMetricsTable: React.FC<PerformanceMetricsTableProps> = ({
  metrics = [
    {
      name: "Time to Resolution",
      unit: "hours",
      description: "Average time to resolve a customer ticket",
      relevantStages: ["Startup", "Early Growth", "Scaling", "Mature"]
    },
    {
      name: "Customer Satisfaction",
      unit: "%",
      description: "Percentage of customers rating service as satisfactory or above",
      relevantStages: ["Startup", "Early Growth", "Scaling", "Mature"]
    },
    {
      name: "Tickets Handled per Day",
      unit: "count",
      description: "Average number of tickets handled per agent per day",
      relevantStages: ["Startup", "Early Growth", "Scaling", "Mature"]
    },
    {
      name: "Report Generation Time",
      unit: "hours",
      description: "Time required to generate standard reports",
      relevantStages: ["Startup", "Early Growth", "Scaling", "Mature"]
    },
    {
      name: "Data Processing Volume",
      unit: "count",
      description: "Number of records processed per day",
      relevantStages: ["Startup", "Early Growth", "Scaling", "Mature"]
    },
    {
      name: "Error Rate",
      unit: "%",
      description: "Percentage of errors in processed data",
      relevantStages: ["Startup", "Early Growth", "Scaling", "Mature"]
    },
    {
      name: "Content Production Rate",
      unit: "count",
      description: "Number of content pieces produced per week",
      relevantStages: ["Startup", "Early Growth", "Scaling", "Mature"]
    },
    {
      name: "Engagement Rate",
      unit: "%",
      description: "Percentage of audience engaging with content",
      relevantStages: ["Startup", "Early Growth", "Scaling", "Mature"]
    },
    {
      name: "Time to Publish",
      unit: "days",
      description: "Average time from content creation to publication",
      relevantStages: ["Startup", "Early Growth", "Scaling", "Mature"]
    },
    {
      name: "Stockout Rate",
      unit: "%",
      description: "Percentage of items out of stock",
      relevantStages: ["Startup", "Early Growth", "Scaling", "Mature"]
    },
    {
      name: "Inventory Turnover",
      unit: "ratio",
      description: "Rate at which inventory is sold and replaced",
      relevantStages: ["Startup", "Early Growth", "Scaling", "Mature"]
    },
    {
      name: "Order Fulfillment Time",
      unit: "days",
      description: "Average time to fulfill customer orders",
      relevantStages: ["Startup", "Early Growth", "Scaling", "Mature"]
    },
    {
      name: "Time to Screen",
      unit: "days",
      description: "Average time to screen job applicants",
      relevantStages: ["Startup", "Early Growth", "Scaling", "Mature"]
    }
  ]
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
        <p className="text-sm text-gray-500">
          Key performance metrics tracked across different roles and departments
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Relevance by Stage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.map((metric, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {metric.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.unit}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                    {metric.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-wrap gap-1">
                      {metric.relevantStages.map(stage => (
                        <Badge
                          key={stage}
                          variant="outline"
                          className={`
                            ${stage === "Startup" ? "bg-orange-100 text-orange-800 border-orange-200" : ""}
                            ${stage === "Early Growth" ? "bg-pink-100 text-pink-800 border-pink-200" : ""}
                            ${stage === "Scaling" ? "bg-red-100 text-red-800 border-red-200" : ""}
                            ${stage === "Mature" ? "bg-purple-100 text-purple-800 border-purple-200" : ""}
                          `}
                        >
                          {stage}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}; 