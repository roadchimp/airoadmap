'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from 'lucide-react';
import type { Organization, OrganizationScoreWeights, InsertOrganizationScoreWeights } from '@shared/schema';

// API fetching functions
const fetchOrganizations = async (): Promise<Organization[]> => {
  console.log('Starting fetchOrganizations request');
  try {
    const response = await fetch('/api/organizations');
    console.log('Organizations API response status:', response.status);
    
    if (!response.ok) {
      console.warn('Organizations API failed, creating fallback demo organization');
      
      // Return a fallback demo organization for development
      return [{
        id: 1,
        name: "Demo Organization",
        industry: "Software & Technology",
        size: "Medium",
        description: "Demo organization for testing AI Adoption Score weights configuration.",
        created_at: new Date()
      }];
    }
    
    const data = await response.json();
    console.log('Organizations API raw response:', data);
    
    // Ensure we return an array
    const organizations = Array.isArray(data) ? data : data.organizations || [];
    
    // If we get an empty array, provide the fallback
    if (organizations.length === 0) {
      console.log('No organizations returned, providing demo organization');
      return [{
        id: 1,
        name: "Demo Organization",
        industry: "Software & Technology",
        size: "Medium",
        description: "Demo organization for testing AI Adoption Score weights configuration.",
        created_at: new Date()
      }];
    }
    
    return organizations;
  } catch (error) {
    console.error('Error in fetchOrganizations:', error);
    
    // Return a fallback demo organization if all else fails
    return [{
      id: 1,
      name: "Demo Organization",
      industry: "Software & Technology",
      size: "Medium",
      description: "Demo organization for testing AI Adoption Score weights configuration.",
      created_at: new Date()
    }];
  }
};

const fetchOrganizationScoreWeights = async (organizationId: number): Promise<OrganizationScoreWeights> => {
  console.log(`Fetching weights for organization ${organizationId}`);
  
  try {
    const response = await fetch(`/api/organizations/${organizationId}/weights`);
    
    // Get the response body regardless of status code
    const data = await response.json();
    console.log(`Weights API response (${response.status}):`, data);
    
    if (!response.ok) {
      console.warn(`Weights API failed (${response.status}), using default weights`);
      
      // Return default weights instead of throwing an error
      return {
        organizationId: organizationId,
        adoptionRateWeight: 0.2,
        timeSavedWeight: 0.2,
        costEfficiencyWeight: 0.2,
        performanceImprovementWeight: 0.2,
        toolSprawlReductionWeight: 0.2,
        updatedAt: new Date()
      };
    }
    
    // The API returns { success: true, weights: {...} } structure
    if (data && data.success && data.weights) {
      return {
        ...data.weights,
        organizationId: organizationId // Ensure the organizationId is set
      };
    }
    
    // Fallback to the original data with organizationId ensured
    return {
      ...data,
      organizationId: organizationId
    };
  } catch (error) {
    console.error(`Error fetching weights for org ${organizationId}:`, error);
    
    // Return default weights on any error
    return {
      organizationId: organizationId,
      adoptionRateWeight: 0.2,
      timeSavedWeight: 0.2,
      costEfficiencyWeight: 0.2,
      performanceImprovementWeight: 0.2,
      toolSprawlReductionWeight: 0.2,
      updatedAt: new Date()
    };
  }
};

const upsertOrganizationScoreWeights = async (weights: InsertOrganizationScoreWeights): Promise<OrganizationScoreWeights> => {
  const response = await fetch(`/api/organizations/${weights.organizationId}/weights`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(weights),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to update score weights' }));
    throw new Error(errorData.message || 'Failed to update score weights');
  }
  
  const data = await response.json();
  // The API returns { success: true, weights: {...} } structure
  return data.weights || data; // Handle both formats: with weights wrapper or direct object
};

export function OrganizationScoreWeightsForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(undefined);
  
  const [formState, setFormState] = useState<Partial<InsertOrganizationScoreWeights>>({
    adoptionRateWeight: 0.2,
    timeSavedWeight: 0.2,
    costEfficiencyWeight: 0.2,
    performanceImprovementWeight: 0.2,
    toolSprawlReductionWeight: 0.2,
  });

  const { 
    data: organizations, 
    isLoading: isLoadingOrgs, 
    error: orgsError,
    isError: isOrgsError,
    refetch: refetchOrgs
  } = useQuery<Organization[], Error>({
    queryKey: ['organizations'],
    queryFn: fetchOrganizations,
    retry: 3,
    retryDelay: 1000,
  });

  // Log query state for debugging
  useEffect(() => {
    console.log('Organization query state:', { 
      isLoading: isLoadingOrgs, 
      isError: isOrgsError, 
      error: orgsError, 
      data: organizations 
    });
    
    // Auto-select the first organization if available and no organization is selected
    if (organizations && organizations.length > 0 && !selectedOrgId) {
      console.log('Auto-selecting first organization:', organizations[0]);
      setSelectedOrgId(String(organizations[0].id));
    }
  }, [isLoadingOrgs, isOrgsError, orgsError, organizations, selectedOrgId]);

  const { 
    data: currentWeights,
    isLoading: isLoadingWeights,
    error: weightsError,
    refetch: refetchWeights
  } = useQuery<OrganizationScoreWeights, Error>({
    queryKey: ['organizationScoreWeights', selectedOrgId],
    queryFn: async () => {
      if (!selectedOrgId) throw new Error('No organization selected');
      return fetchOrganizationScoreWeights(Number(selectedOrgId));
    },
    enabled: !!selectedOrgId,
    retry: false, // Don't retry since we have fallbacks
    throwOnError: false, // Never throw errors, always return data
  });

  // Update form state when weights are loaded
  useEffect(() => {
    if (currentWeights) {
      setFormState({
        adoptionRateWeight: currentWeights.adoptionRateWeight,
        timeSavedWeight: currentWeights.timeSavedWeight,
        costEfficiencyWeight: currentWeights.costEfficiencyWeight,
        performanceImprovementWeight: currentWeights.performanceImprovementWeight,
        toolSprawlReductionWeight: currentWeights.toolSprawlReductionWeight,
      });
    }
  }, [currentWeights]);

  const mutation = useMutation<OrganizationScoreWeights, Error, InsertOrganizationScoreWeights>({
    mutationFn: upsertOrganizationScoreWeights,
    onSuccess: (data) => {
      toast({ title: "Success!", description: "Score weights updated successfully." });
      queryClient.invalidateQueries({ queryKey: ['organizationScoreWeights', data.organizationId] });
      // queryClient.setQueryData(['organizationScoreWeights', data.organizationId], data); // Optimistic update
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message || "Failed to update weights.", variant: "destructive" });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Omit<InsertOrganizationScoreWeights, 'organizationId'>) => {
    const value = e.target.value;
    // Allow empty string for UX purposes (user is clearing the field) or valid float
    if (value === '' || !isNaN(parseFloat(value))) {
      setFormState(prev => ({
        ...prev,
        [field]: value === '' ? 0 : parseFloat(value)
      }));
    }
  };

  const normalizeWeights = () => {
    const values = {
      adoptionRateWeight: Number(formState.adoptionRateWeight || 0),
      timeSavedWeight: Number(formState.timeSavedWeight || 0),
      costEfficiencyWeight: Number(formState.costEfficiencyWeight || 0),
      performanceImprovementWeight: Number(formState.performanceImprovementWeight || 0),
      toolSprawlReductionWeight: Number(formState.toolSprawlReductionWeight || 0),
    };
    
    const sum = Object.values(values).reduce((a, b) => a + b, 0);
    
    if (sum === 0) {
      // If all values are 0, set them to equal weights
      setFormState({
        adoptionRateWeight: 0.2,
        timeSavedWeight: 0.2,
        costEfficiencyWeight: 0.2,
        performanceImprovementWeight: 0.2,
        toolSprawlReductionWeight: 0.2,
      });
      return;
    }
    
    // Normalize values
    setFormState({
      adoptionRateWeight: Number((values.adoptionRateWeight / sum).toFixed(2)),
      timeSavedWeight: Number((values.timeSavedWeight / sum).toFixed(2)),
      costEfficiencyWeight: Number((values.costEfficiencyWeight / sum).toFixed(2)),
      performanceImprovementWeight: Number((values.performanceImprovementWeight / sum).toFixed(2)),
      toolSprawlReductionWeight: Number((values.toolSprawlReductionWeight / sum).toFixed(2)),
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOrgId) {
      toast({ title: "Error", description: "Please select an organization.", variant: "destructive" });
      return;
    }
    
    const submissionData: InsertOrganizationScoreWeights = {
      organizationId: Number(selectedOrgId),
      adoptionRateWeight: Number(formState.adoptionRateWeight ?? 0.2),
      timeSavedWeight: Number(formState.timeSavedWeight ?? 0.2),
      costEfficiencyWeight: Number(formState.costEfficiencyWeight ?? 0.2),
      performanceImprovementWeight: Number(formState.performanceImprovementWeight ?? 0.2),
      toolSprawlReductionWeight: Number(formState.toolSprawlReductionWeight ?? 0.2),
    };
    
    // Validate that weights sum to approximately 1.0
    const sum = submissionData.adoptionRateWeight + 
                submissionData.timeSavedWeight + 
                submissionData.costEfficiencyWeight + 
                submissionData.performanceImprovementWeight + 
                submissionData.toolSprawlReductionWeight;
                
    if (Math.abs(sum - 1.0) > 0.05) { // Allow a small margin of error
      toast({ 
        title: "Validation Error", 
        description: `Weights should sum to approximately 1.0. Current sum: ${sum.toFixed(2)}`, 
        variant: "destructive" 
      });
      return;
    }
    
    mutation.mutate(submissionData);
  };

  const handleOrganizationChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    // Form will be updated by useEffect when currentWeights are fetched for the new orgId
  };

  if (isLoadingOrgs) return <p>Loading organizations...</p>;
  if (orgsError) return <p>Error loading organizations: {(orgsError as Error)?.message || 'Unknown error'}</p>;

  const weightFields: Array<{key: keyof Omit<InsertOrganizationScoreWeights, 'organizationId'>; label: string}> = [
    { key: 'adoptionRateWeight', label: 'Adoption Rate Weight' },
    { key: 'timeSavedWeight', label: 'Time Saved Weight' },
    { key: 'costEfficiencyWeight', label: 'Cost Efficiency Weight' },
    { key: 'performanceImprovementWeight', label: 'Performance Improvement Weight' },
    { key: 'toolSprawlReductionWeight', label: 'Tool Sprawl Reduction Weight' },
  ];

  // Display error state if organizations can't be fetched
  if (isOrgsError) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Configuration Loading</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 p-4 bg-yellow-50 text-yellow-800 rounded-md">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Using Demo Configuration</p>
              <p className="text-sm">
                Unable to load organization data from the server. Using a demo organization with default AI Adoption Score weights.
              </p>
            </div>
          </div>
          <Button 
            onClick={() => (refetchOrgs as () => Promise<unknown>)()} 
            className="mt-4"
            variant="outline"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Configure AI Adoption Score Weights</CardTitle>
        <CardDescription>
          Select an organization and set the specific weights for its AI Adoption Score components.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} id="organization-score-weights-form" className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="organization-select">Organization</Label>
            <Select onValueChange={handleOrganizationChange} value={selectedOrgId}>
              <SelectTrigger id="organization-select">
                <SelectValue placeholder="Select an organization" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingOrgs ? (
                  <SelectItem value="loading" disabled>Loading organizations...</SelectItem>
                ) : organizations && organizations.length > 0 ? (
                  organizations.map(org => (
                    <SelectItem key={org.id} value={String(org.id)}>
                      {org.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No organizations available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedOrgId && (
            isLoadingWeights ? <p>Loading weights...</p> :
            weightsError ? (
              <div className="p-4 bg-red-50 text-red-800 rounded-md">
                <p className="font-medium">Error loading weights</p>
                <p className="text-sm">{(weightsError as Error)?.message || 'Unknown error'}</p>
                <Button 
                  onClick={() => (refetchWeights as () => Promise<unknown>)()} 
                  variant="outline" 
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {weightFields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={field.key}>{field.label}</Label>
                      <Input
                        id={field.key}
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={formState[field.key] !== undefined ? formState[field.key] : ''}
                        onChange={(e) => handleInputChange(e, field.key)}
                      />
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                    <p className="text-sm text-muted-foreground">
                        Note: Weights should ideally sum to 1. Current sum: 
                        {weightFields.reduce((acc, field) => acc + Number(formState[field.key] || 0), 0).toFixed(2)}
                    </p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="mt-2" 
                      onClick={normalizeWeights}
                    >
                      Normalize Weights to 1.0
                    </Button>
                </div>
              </>
            )
          )}
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          type="submit" 
          form="organization-score-weights-form" 
          disabled={!selectedOrgId || isLoadingWeights || mutation.isPending}
          className="bg-[#e84c2b] hover:bg-[#d13c1c]"
        >
          {mutation.isPending ? 'Saving...' : 'Save Weights'}
        </Button>
      </CardFooter>
    </Card>
  );
} 