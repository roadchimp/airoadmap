'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Organization, OrganizationScoreWeights, InsertOrganizationScoreWeights } from '@shared/schema';

// API fetching functions
const fetchOrganizations = async (): Promise<Organization[]> => {
  const response = await fetch('/api/organizations');
  if (!response.ok) {
    throw new Error('Failed to fetch organizations');
  }
  return response.json();
};

const fetchOrganizationScoreWeights = async (organizationId: number): Promise<OrganizationScoreWeights> => {
  const response = await fetch(`/api/organizations/${organizationId}/weights`);
  
  // Get the response body regardless of status code
  const data = await response.json();
  
  if (!response.ok) {
    // Log detailed error information to help with debugging
    console.error(`Error response from weights API (${response.status}):`, data);
    
    if (response.status === 404) {
      console.warn(`No specific score weights found for org ${organizationId}, defaults should apply.`);
    }
    
    // If the API returns an error message, use it
    if (data && data.error) {
      throw new Error(data.error);
    }
    
    throw new Error('Failed to fetch score weights');
  }
  
  // The API returns { success: true, weights: {...} } structure
  if (data && data.success && data.weights) {
    return data.weights;
  }
  
  // Fallback to the original data
  return data;
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

  const { data: organizations, isLoading: isLoadingOrgs, error: orgsError } = useQuery<Organization[]>({
    queryKey: ['organizations'],
    queryFn: async () => {
      console.log('Fetching organizations...');
      try {
        const result = await fetchOrganizations();
        console.log('Organizations fetched successfully:', result);
        return result;
      } catch (error) {
        console.error('Error fetching organizations:', error);
        throw error;
      }
    },
  });

  const { 
    data: currentWeights,
    isLoading: isLoadingWeights,
    error: weightsError,
    refetch: refetchWeights // to refetch when org changes
  } = useQuery<OrganizationScoreWeights>({
    queryKey: ['organizationScoreWeights', selectedOrgId],
    queryFn: async () => {
      console.log(`Fetching weights for organization ${selectedOrgId}...`);
      try {
        const result = await fetchOrganizationScoreWeights(Number(selectedOrgId!));
        console.log('Weights fetched successfully:', result);
        return result;
      } catch (error) {
        console.error(`Error fetching weights for organization ${selectedOrgId}:`, error);
        throw error;
      }
    },
    enabled: !!selectedOrgId, // Only run query if selectedOrgId is truthy
  });

  // Effect to update form when currentWeights are fetched or change
  useEffect(() => {
    if (currentWeights) {
      setFormState({
        organizationId: currentWeights.organizationId, // This comes from DB, not directly editable in this form
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: parseFloat(value) })); // Ensure values are numbers
  };

  const normalizeWeights = () => {
    const weightKeys: Array<keyof Omit<InsertOrganizationScoreWeights, 'organizationId'>> = [
      'adoptionRateWeight', 
      'timeSavedWeight', 
      'costEfficiencyWeight', 
      'performanceImprovementWeight', 
      'toolSprawlReductionWeight'
    ];
    
    // Calculate the current sum of all weights
    const sum = weightKeys.reduce((acc, key) => acc + Number(formState[key] || 0), 0);
    
    if (sum === 0) {
      // Cannot normalize if all weights are zero
      toast({ 
        title: "Cannot Normalize", 
        description: "All weights are zero. Please enter at least one non-zero weight.", 
        variant: "destructive" 
      });
      return;
    }
    
    // Normalize each weight proportionally
    const normalizedState = { ...formState };
    weightKeys.forEach(key => {
      normalizedState[key] = Number(((Number(formState[key] || 0) / sum)).toFixed(4));
    });
    
    setFormState(normalizedState);
    
    toast({ 
      title: "Weights Normalized", 
      description: "All weights have been adjusted to sum to 1.0."
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
  if (orgsError) return <p>Error loading organizations: {orgsError.message}</p>;

  const weightFields: Array<{key: keyof Omit<InsertOrganizationScoreWeights, 'organizationId'>; label: string}> = [
    { key: 'adoptionRateWeight', label: 'Adoption Rate Weight' },
    { key: 'timeSavedWeight', label: 'Time Saved Weight' },
    { key: 'costEfficiencyWeight', label: 'Cost Efficiency Weight' },
    { key: 'performanceImprovementWeight', label: 'Performance Improvement Weight' },
    { key: 'toolSprawlReductionWeight', label: 'Tool Sprawl Reduction Weight' },
  ];

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
                {organizations?.map(org => (
                  <SelectItem key={org.id} value={String(org.id)}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedOrgId && (
            isLoadingWeights ? <p>Loading weights...</p> :
            weightsError ? <p className="text-red-500">Error loading weights: {weightsError.message}</p> :
            currentWeights ? (
              <>
                {weightFields.map(field => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <Input 
                      id={field.key} 
                      name={field.key} 
                      type="number" 
                      value={formState[field.key] || ''} 
                      onChange={handleInputChange} 
                      step="0.01" 
                      min="0" 
                      max="1"
                      required 
                    />
                    <p className="text-xs text-muted-foreground">
                      {field.key === 'adoptionRateWeight' && "Influences how heavily the AI adoption rate impacts the overall score. Higher values prioritize wide user adoption."}
                      {field.key === 'timeSavedWeight' && "Influences how heavily time savings impact the overall score. Higher values prioritize solutions that save more time."}
                      {field.key === 'costEfficiencyWeight' && "Influences how heavily cost efficiency impacts the overall score. Higher values prioritize cost-saving solutions."}
                      {field.key === 'performanceImprovementWeight' && "Influences how heavily performance improvements impact the overall score. Higher values prioritize productivity gains."}
                      {field.key === 'toolSprawlReductionWeight' && "Influences how heavily tool consolidation impacts the overall score. Higher values prioritize reducing tool sprawl."}
                    </p>
                  </div>
                ))}
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
            ) : <p>Select an organization to see its weights.</p>
          )}
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          type="submit" 
          form="organization-score-weights-form" 
          disabled={!selectedOrgId || isLoadingWeights || mutation.isPending}
        >
          {mutation.isPending ? 'Saving...' : 'Save Weights'}
        </Button>
      </CardFooter>
    </Card>
  );
} 