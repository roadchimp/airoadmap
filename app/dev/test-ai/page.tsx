"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface TestResult {
  status: 'success' | 'error';
  [key: string]: any;
}

interface TestResults {
  environment: {
    NODE_ENV: string;
    VERCEL_ENV: string;
    openaiKeyPresent: boolean;
    openaiKeyLength: number;
  };
  tests: {
    executiveSummary?: TestResult;
    aiCapabilityRecommendations?: TestResult;
    performanceImpact?: TestResult;
  };
}

export default function TestAIPage() {
  const [results, setResults] = useState<TestResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTests = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/test-ai');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'success' ? (
      <Badge variant="default" className="bg-green-500">Success</Badge>
    ) : (
      <Badge variant="destructive">Error</Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">AI Service Test</h1>
        <p className="text-muted-foreground">
          Test OpenAI integration and AI service functionality in the deployed environment.
        </p>
      </div>

      <div className="mb-6">
        <Button 
          onClick={runTests} 
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? 'Running Tests...' : 'Run AI Service Tests'}
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Test Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {results && (
        <div className="space-y-6">
          {/* Environment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Environment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Environment:</span>
                  <Badge variant="outline" className="ml-2">
                    {results.environment.NODE_ENV}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Vercel Environment:</span>
                  <Badge variant="outline" className="ml-2">
                    {results.environment.VERCEL_ENV || 'local'}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">OpenAI Key Present:</span>
                  {results.environment.openaiKeyPresent ? (
                    <Badge className="ml-2 bg-green-500">Yes</Badge>
                  ) : (
                    <Badge variant="destructive" className="ml-2">No</Badge>
                  )}
                </div>
                <div>
                  <span className="font-medium">Key Length:</span>
                  <span className="ml-2">{results.environment.openaiKeyLength} chars</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {/* Executive Summary Test */}
            {results.tests.executiveSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Executive Summary
                    {getStatusBadge(results.tests.executiveSummary.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {results.tests.executiveSummary.status === 'success' ? (
                    <div className="space-y-2">
                      <p><strong>Length:</strong> {results.tests.executiveSummary.summaryLength} chars</p>
                      <p><strong>Preview:</strong></p>
                      <p className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                        {results.tests.executiveSummary.summaryPreview}
                      </p>
                    </div>
                  ) : (
                    <p className="text-red-600 text-sm">
                      {results.tests.executiveSummary.error}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* AI Capability Recommendations Test */}
            {results.tests.aiCapabilityRecommendations && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    AI Capabilities
                    {getStatusBadge(results.tests.aiCapabilityRecommendations.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {results.tests.aiCapabilityRecommendations.status === 'success' ? (
                    <div className="space-y-2">
                      <p><strong>Count:</strong> {results.tests.aiCapabilityRecommendations.recommendationCount}</p>
                      <p><strong>First:</strong> {results.tests.aiCapabilityRecommendations.firstRecommendation}</p>
                    </div>
                  ) : (
                    <p className="text-red-600 text-sm">
                      {results.tests.aiCapabilityRecommendations.error}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Performance Impact Test */}
            {results.tests.performanceImpact && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Performance Impact
                    {getStatusBadge(results.tests.performanceImpact.status)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {results.tests.performanceImpact.status === 'success' ? (
                    <div className="space-y-2">
                      <p><strong>ROI:</strong> ${results.tests.performanceImpact.impact.estimatedAnnualRoi.toLocaleString()}</p>
                      <p><strong>Metrics:</strong></p>
                      <ul className="text-sm space-y-1">
                        {results.tests.performanceImpact.impact.metrics.map((metric: any, idx: number) => (
                          <li key={idx} className="flex justify-between">
                            <span>{metric.name}:</span>
                            <span>{metric.improvement}%</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-red-600 text-sm">
                      {results.tests.performanceImpact.error}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 