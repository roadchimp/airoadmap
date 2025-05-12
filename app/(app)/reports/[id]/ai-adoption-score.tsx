"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface AIAdoptionScoreProps {
  aiAdoptionScoreDetails?: {
    score: number;
    components: {
      adoptionRate: number;
      timeSaved: number;
      costEfficiency: number;
      performanceImprovement: number;
      toolSprawl: number;
    };
  };
  roiDetails?: {
    annualRoi: number;
    costSavings: number;
    additionalRevenue: number;
    aiInvestment: number;
    roiRatio: number;
  };
  companyProfile?: {
    industry?: string;
    industryMaturity?: string;
    companyStage?: string;
    strategicFocus?: string[];
  };
}

export const AIAdoptionScoreTab: React.FC<AIAdoptionScoreProps> = ({
  aiAdoptionScoreDetails = {
    score: 78,
    components: {
      adoptionRate: 82,
      timeSaved: 75,
      costEfficiency: 68,
      performanceImprovement: 85,
      toolSprawl: 1, // On a scale from -2 to +2
    },
  },
  roiDetails = {
    annualRoi: 125000,
    costSavings: 85000,
    additionalRevenue: 65000,
    aiInvestment: 25000,
    roiRatio: 6.0,
  },
  companyProfile = {
    industry: "Technology",
    industryMaturity: "Mature",
    companyStage: "Scaling",
    strategicFocus: ["Growth Focused", "Product / R&D Focused"]
  }
}) => {
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Adoption Score Components Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-[#e84c2b]">📈</span>
              AI Adoption Score™ Components
            </CardTitle>
            <p className="text-sm text-gray-500">
              Breakdown of the factors contributing to the overall AI Adoption Score
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Circular Score Display */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-48 h-48">
                <div className="absolute inset-0 rounded-full border-8 border-gray-100"></div>
                <div 
                  className="absolute inset-0 rounded-full border-8 border-[#e84c2b]"
                  style={{ 
                    clipPath: `polygon(0 0, 100% 0, 100% 100%, 0% 100%)`,
                    background: `conic-gradient(#e84c2b ${aiAdoptionScoreDetails?.score || 0}%, transparent ${aiAdoptionScoreDetails?.score || 0}%, transparent 100%)`,
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl font-bold">{aiAdoptionScoreDetails?.score || 0}</span>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600">Overall AI Adoption Score</p>
            </div>

            {/* Component Breakdown */}
            <div className="space-y-6">
              {/* Adoption Rate */}
              <div className="space-y-1">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium">Adoption Rate</span>
                  <span className="text-sm font-bold">{aiAdoptionScoreDetails?.components?.adoptionRate || 0}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#e84c2b] rounded-full"
                    style={{ width: `${aiAdoptionScoreDetails?.components?.adoptionRate || 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">Percentage of users actively using AI tools on a monthly basis</p>
              </div>

              {/* Time Saved */}
              <div className="space-y-1">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium">Time Saved</span>
                  <span className="text-sm font-bold">{aiAdoptionScoreDetails?.components?.timeSaved || 0}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#e84c2b] rounded-full"
                    style={{ width: `${aiAdoptionScoreDetails?.components?.timeSaved || 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">Percentage of time saved per user due to AI implementation</p>
              </div>

              {/* Cost Efficiency */}
              <div className="space-y-1">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium">Cost Efficiency</span>
                  <span className="text-sm font-bold">{aiAdoptionScoreDetails?.components?.costEfficiency || 0}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#e84c2b] rounded-full"
                    style={{ width: `${aiAdoptionScoreDetails?.components?.costEfficiency || 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">Ratio of AI license cost vs. equivalent human labor cost</p>
              </div>

              {/* Performance Improvement */}
              <div className="space-y-1">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium">Performance Improvement</span>
                  <span className="text-sm font-bold">{aiAdoptionScoreDetails?.components?.performanceImprovement || 0}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#e84c2b] rounded-full"
                    style={{ width: `${aiAdoptionScoreDetails?.components?.performanceImprovement || 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">Aggregate improvement in key performance metrics</p>
              </div>

              {/* Tool Sprawl */}
              <div className="space-y-1">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium">Tool Sprawl</span>
                  <span className="text-sm font-bold">+{aiAdoptionScoreDetails?.components?.toolSprawl || 0}</span>
                </div>
                <div className="relative h-2 w-full bg-gray-200 rounded-full my-2">
                  <div className="absolute inset-y-0 left-1/2 w-0.5 bg-gray-400"></div>
                  {/* Slider indicator positioned based on the value (-2 to +2) */}
                  <div 
                    className="absolute inset-y-0 w-4 h-4 bg-[#e84c2b] rounded-full -mt-1"
                    style={{ 
                      left: `${(((aiAdoptionScoreDetails?.components?.toolSprawl || 0) + 2) / 4) * 100}%`,
                      transform: 'translateX(-50%)' 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Increased Sprawl</span>
                  <span>Reduced Sprawl</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Impact on tool consolidation vs. fragmentation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ROI Calculation Card */}
        <Card>
          <CardHeader>
            <CardTitle>ROI Calculation</CardTitle>
            <p className="text-sm text-gray-500">
              Breakdown of the return on investment calculation
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">Annual ROI: {formatCurrency(roiDetails?.annualRoi || 0)}</h3>
            </div>

            <div className="space-y-4 mt-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Cost Savings</span>
                <span className="font-medium">{formatCurrency(roiDetails?.costSavings || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Additional Revenue</span>
                <span className="font-medium">{formatCurrency(roiDetails?.additionalRevenue || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">AI Investment</span>
                <span className="font-medium">{formatCurrency(roiDetails?.aiInvestment || 0)}</span>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">ROI Ratio</span>
                <span className="font-bold">{(roiDetails?.roiRatio || 0).toFixed(2)}x</span>
              </div>
            </div>

            <div className="mt-8 bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-2">ROI Formula</h4>
              <div className="font-mono text-sm bg-gray-100 p-3 rounded">
                <p>ROI = (Cost Savings + Additional Revenue) / AI Investment</p>
                <p>= ({formatCurrency(roiDetails?.costSavings || 0)} + {formatCurrency(roiDetails?.additionalRevenue || 0)}) / {formatCurrency(roiDetails?.aiInvestment || 0)}</p>
                <p>= {formatCurrency((roiDetails?.costSavings || 0) + (roiDetails?.additionalRevenue || 0))} / {formatCurrency(roiDetails?.aiInvestment || 0)}</p>
                <p>= {(roiDetails?.roiRatio || 0).toFixed(2)}x</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Company Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Industry</h3>
              <p className="font-medium">
                {companyProfile.industry} {companyProfile.industryMaturity ? `(${companyProfile.industryMaturity})` : ''}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Stage of Growth</h3>
              <p className="font-medium">{companyProfile.companyStage || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Strategic Focus</h3>
              {companyProfile.strategicFocus && companyProfile.strategicFocus.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-1">
                  {companyProfile.strategicFocus.map((focus, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {focus}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-medium">Not specified</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 