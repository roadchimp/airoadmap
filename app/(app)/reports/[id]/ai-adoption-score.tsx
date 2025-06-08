"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export interface AIAdoptionScoreProps {
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
  // Fix: Check for actual data instead of default values
  const hasActualData = aiAdoptionScoreDetails && typeof aiAdoptionScoreDetails === 'object' && 
    ((aiAdoptionScoreDetails as any).overallScore !== undefined || 
     aiAdoptionScoreDetails.score !== undefined ||
     (aiAdoptionScoreDetails.components && Object.keys(aiAdoptionScoreDetails.components).length > 0));
  
  // Handle both possible data structures from the API
  const actualScore = (aiAdoptionScoreDetails as any)?.overallScore || aiAdoptionScoreDetails?.score || 0;
  
  console.log("AI Adoption Score Details:", aiAdoptionScoreDetails);
  console.log("Has actual data:", hasActualData);
  console.log("Actual score:", actualScore);
  
  // Ensure all required objects and properties exist to prevent errors
  const scoreDetails = aiAdoptionScoreDetails || {
    score: 0,
    components: {
      adoptionRate: 0,
      timeSaved: 0,
      costEfficiency: 0,
      performanceImprovement: 0,
      toolSprawl: 0,
    },
  };
  
  const roi = roiDetails || {
    annualRoi: 0,
    costSavings: 0,
    additionalRevenue: 0,
    aiInvestment: 0,
    roiRatio: 0,
  };
  
  const profile = companyProfile || {
    industry: "Not specified",
    industryMaturity: "Not specified",
    companyStage: "Not specified",
    strategicFocus: [],
  };

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Safely get component values
  const getComponentValue = (key: keyof typeof scoreDetails.components): number => {
    if (!scoreDetails.components) return 0;
    const value = scoreDetails.components[key];
    
    // More thorough type checking to handle different data structures
    if (typeof value === 'number') {
      return value;
    } else if (value && typeof value === 'object') {
      // Handle case where value is a CalculatedScoreComponent object 
      const objValue = value as any; // Cast to any to access potential properties
      if ('normalizedScore' in objValue && typeof objValue.normalizedScore === 'number') {
        return Math.round(objValue.normalizedScore * 100);
      } else if ('value' in objValue && typeof objValue.value === 'number') {
        return objValue.value;
      }
    }
    
    // Default fallback
    return 0;
  };

  // If we're using default data, show a message about no data being available
  if (!hasActualData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Adoption Score™</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 text-center mb-4">
              No AI Adoption Score data is available for this assessment yet.
            </p>
            <p className="text-sm text-gray-400 text-center max-w-md">
              This could be because AI Adoption Score inputs were not provided during the assessment, 
              or because the report was generated before this feature was available.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Company Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Industry</h3>
                <p className="font-medium">
                  {profile?.industry || 'Not specified'} {profile?.industryMaturity ? `(${profile.industryMaturity})` : ''}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Company Stage</h3>
                <p className="font-medium">{profile?.companyStage || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Strategic Focus</h3>
                <div>
                  {profile?.strategicFocus && Array.isArray(profile.strategicFocus) && profile.strategicFocus.length > 0 ? (
                    profile.strategicFocus.map((focus, index) => (
                      <Badge key={index} variant="outline" className="mr-1 mb-1">{focus}</Badge>
                    ))
                  ) : (
                    <p className="font-medium">No strategic focus specified</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#f1f1f1"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e84c2b"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * (actualScore) / 100)}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl font-bold">{actualScore}</span>
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
                  <span className="text-sm font-bold">{getComponentValue('adoptionRate')}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#e84c2b] rounded-full"
                    style={{ width: `${getComponentValue('adoptionRate')}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">Percentage of users actively using AI tools on a monthly basis</p>
              </div>

              {/* Time Saved */}
              <div className="space-y-1">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium">Time Saved</span>
                  <span className="text-sm font-bold">{getComponentValue('timeSaved')}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#e84c2b] rounded-full"
                    style={{ width: `${getComponentValue('timeSaved')}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">Percentage of time saved per user due to AI implementation</p>
              </div>

              {/* Cost Efficiency */}
              <div className="space-y-1">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium">Cost Efficiency</span>
                  <span className="text-sm font-bold">{getComponentValue('costEfficiency')}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#e84c2b] rounded-full"
                    style={{ width: `${getComponentValue('costEfficiency')}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">Ratio of AI license cost vs. equivalent human labor cost</p>
              </div>

              {/* Performance Improvement */}
              <div className="space-y-1">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium">Performance Improvement</span>
                  <span className="text-sm font-bold">{getComponentValue('performanceImprovement')}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#e84c2b] rounded-full"
                    style={{ width: `${getComponentValue('performanceImprovement')}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">Aggregate improvement in key performance metrics</p>
              </div>

              {/* Tool Sprawl */}
              <div className="space-y-1">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium">Tool Sprawl</span>
                  <span className="text-sm font-bold">+{getComponentValue('toolSprawl')}</span>
                </div>
                <div className="relative h-2 w-full bg-gray-200 rounded-full my-2">
                  <div className="absolute inset-y-0 left-1/2 w-0.5 bg-gray-400"></div>
                  {/* Slider indicator positioned based on the value (-2 to +2) */}
                  <div 
                    className="absolute inset-y-0 w-4 h-4 bg-[#e84c2b] rounded-full -mt-1"
                    style={{ 
                      left: `${((getComponentValue('toolSprawl') + 2) / 4) * 100}%`,
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
              <h3 className="text-2xl font-bold">Annual ROI: {formatCurrency(roi.annualRoi || 0)}</h3>
            </div>

            <div className="space-y-4 mt-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Cost Savings</span>
                <span className="font-medium">{formatCurrency(roi.costSavings || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Additional Revenue</span>
                <span className="font-medium">{formatCurrency(roi.additionalRevenue || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">AI Investment</span>
                <span className="font-medium">{formatCurrency(roi.aiInvestment || 0)}</span>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">ROI Ratio</span>
                <span className="font-bold">{((roi.roiRatio || 0)).toFixed(2)}x</span>
              </div>
            </div>

            <div className="mt-8 bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-2">ROI Formula</h4>
              <div className="font-mono text-sm bg-gray-100 p-3 rounded">
                <p>ROI = (Cost Savings + Additional Revenue) / AI Investment</p>
                <p>= ({formatCurrency(roi.costSavings || 0)} + {formatCurrency(roi.additionalRevenue || 0)}) / {formatCurrency(roi.aiInvestment || 0)}</p>
                <p>= {formatCurrency((roi.costSavings || 0) + (roi.additionalRevenue || 0))} / {formatCurrency(roi.aiInvestment || 0)}</p>
                <p>= {((roi.roiRatio || 0)).toFixed(2)}x</p>
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
                {profile?.industry || 'Not specified'} {profile?.industryMaturity ? `(${profile.industryMaturity})` : ''}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Company Stage</h3>
              <p className="font-medium">{profile?.companyStage || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Strategic Focus</h3>
              <div>
                {profile?.strategicFocus && Array.isArray(profile.strategicFocus) && profile.strategicFocus.length > 0 ? (
                  profile.strategicFocus.map((focus, index) => (
                    <Badge key={index} variant="outline" className="mr-1 mb-1">{focus}</Badge>
                  ))
                ) : (
                  <p className="font-medium">No strategic focus specified</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 