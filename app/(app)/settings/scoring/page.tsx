import React from 'react';
// import { PageTitle } from '@/components/ui/PageTitle'; // Assuming PageTitle component exists - REMOVED
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // For later use

// TODO: Import components for:
// - Performance Metrics Management
// - Metric Relevance Rules Management
// - AI Adoption Score Weightings Management
import { OrganizationScoreWeightsForm } from './_components/organization-score-weights-form';

export default async function ScoringSettingsPage() {
  // Fetch any necessary initial data here if required for the parent page or tabs
  // e.g., list of organizations if weights are per org and you want to show a selector

  return (
    <div className="container mx-auto py-10">
      {/* <PageTitle title="Scoring Settings" description="Manage performance metrics, relevance rules, and AI adoption score weightings." /> REMOVED */}
      {/* Placeholder for a dynamic title if needed, or handled by layout */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Scoring Settings
        </h1>
        <p className="mt-2 text-lg leading-8 text-gray-600">
          Manage performance metrics, relevance rules, and AI adoption score weightings.
        </p>
      </div>

      <div className="mt-8">
        {/* 
          Placeholder for future tabbed interface or sectioned content.
          You can use Shadcn Tabs here later.
          Example:
          <Tabs defaultValue="performance-metrics" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="performance-metrics">Performance Metrics</TabsTrigger>
              <TabsTrigger value="metric-rules">Metric Relevance Rules</TabsTrigger>
              <TabsTrigger value="adoption-score-weights">Adoption Score Weights</TabsTrigger>
            </TabsList>
            <TabsContent value="performance-metrics">
              <p className="text-sm text-muted-foreground mt-2">
                Manage the library of performance metrics used in assessments.
              </p>
              {/* <PerformanceMetricsAdminComponent /> * /}
            </TabsContent>
            <TabsContent value="metric-rules">
              <p className="text-sm text-muted-foreground mt-2">
                Define rules for how performance metrics are weighted or considered based on factors like project stage or focus.
              </p>
              {/* <MetricRulesAdminComponent /> * /}
            </TabsContent>
            <TabsContent value="adoption-score-weights">
              <p className="text-sm text-muted-foreground mt-2">
                Configure the component weightings for the AI Adoption Score™ for each organization.
              </p>
              {/* <AdoptionScoreWeightsAdminComponent /> * /}
            </TabsContent>
          </Tabs>
        */}
        
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Configuration Area</h2>
          <p className="text-muted-foreground">
            This section will provide interfaces to manage various aspects of scoring:
          </p>
          <ul className="list-disc list-inside mt-2 text-muted-foreground">
            <li>Performance Metrics Library</li>
            <li>Metric Relevance Rules (e.g., by stage, focus area)</li>
            {/* <li>AI Adoption Score Component Weights (per organization)</li> // Replaced by the actual component below */}
          </ul>
          {/* <p className="mt-4 text-sm text-blue-600">
            (Components for these features will be implemented here.)
          </p> */}
        </div>

        {/* AI Adoption Score Component Weightings Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold tracking-tight mb-4">AI Adoption Score™ Component Weights</h2>
          <OrganizationScoreWeightsForm />
        </div>

      </div>
    </div>
  );
} 