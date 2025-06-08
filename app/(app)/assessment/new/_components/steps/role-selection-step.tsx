'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSession } from '@/lib/session/SessionContext';
import { Department, JobRole } from '@/lib/session/sessionTypes';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import QuestionCard from '@/app/(app)/assessment/new/_components/QuestionCard';
import { Skeleton } from '@/components/ui/skeleton';
import RoleCard from '@/components/ui/role-card';

// Extend the base Department type to include the roles array from the API
interface DepartmentWithRoles extends Department {
  roles: JobRole[];
}

interface DepartmentRoleResponse {
  hierarchical: DepartmentWithRoles[];
  roles: JobRole[];
}

export const RoleSelectionStep = () => {
  const { session, setStepData } = useSession();
  const { currentStepIndex } = session;

  const [departmentData, setDepartmentData] = useState<DepartmentWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);

  const selectedRoles = session.steps[currentStepIndex]?.data.roleSelection?.selectedRoles || [];

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/roles-departments');
        if (!response.ok) {
          throw new Error('Failed to fetch roles');
        }
        const data: DepartmentRoleResponse = await response.json();
        setDepartmentData(data.hierarchical);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoles();
  }, []);

  const handleDepartmentToggle = (departmentId: number) => {
    const isSelected = selectedDepartments.includes(departmentId);
    if (isSelected) {
      setSelectedDepartments(prev => prev.filter(id => id !== departmentId));
    } else {
      setSelectedDepartments(prev => [...prev, departmentId]);
    }
  };

  const handleRoleSelection = (role: JobRole) => {
    const isSelected = selectedRoles.some((r: JobRole) => r.id === role.id);
    let newSelectedRoles: JobRole[];

    if (isSelected) {
      newSelectedRoles = selectedRoles.filter((r: JobRole) => r.id !== role.id);
    } else {
      newSelectedRoles = [...selectedRoles, role];
    }
    
    setStepData(currentStepIndex, { 
      roleSelection: { selectedRoles: newSelectedRoles } 
    }, true);
  };
  
  const renderSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-8 w-1/2" />
          <div className="pl-4 space-y-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      ))}
    </div>
  );

  const getTotalRoleCount = () => {
    return departmentData.reduce((total, dept) => total + (dept.roles || []).length, 0);
  };

  // Filter departments to show roles only for selected departments
  const filteredDepartments = useMemo(() => {
    if (!selectedDepartments.length) {
      return [];
    }
    return departmentData.filter(dept => selectedDepartments.includes(dept.id));
  }, [departmentData, selectedDepartments]);

  return (
    <QuestionCard 
      title="Role Selection" 
      description={`Select the job roles that you want to include in this assessment. ${selectedRoles.length} of ${getTotalRoleCount()} roles selected.`}
    >
      {isLoading ? (
        renderSkeleton()
      ) : error ? (
        <div className="text-red-500 p-4 bg-red-50 rounded-md">
          <p className="font-medium">Error loading roles</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {selectedRoles.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="font-medium text-blue-900 mb-2">Selected Roles ({selectedRoles.length}):</h3>
              <div className="flex flex-wrap gap-2">
                {selectedRoles.map((role) => (
                  <Badge key={role.id} variant="secondary" className="bg-blue-100 text-blue-800">
                    {role.title}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Department Selection */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">Select Departments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {departmentData.map((department) => (
                <Label
                  key={department.id}
                  className="flex items-center space-x-2 p-3 border rounded-md has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedDepartments.includes(department.id)}
                    onCheckedChange={() => handleDepartmentToggle(department.id)}
                  />
                  <span className="flex-1">{department.name}</span>
                  <span className="text-sm text-gray-500">
                    {department.roles?.length || 0} roles
                  </span>
                </Label>
              ))}
            </div>
          </div>
          
          {/* Role Selection - Only show if departments are selected */}
          <div className="space-y-4">
            {filteredDepartments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Select departments above to see available roles.</p>
              </div>
            ) : (
              filteredDepartments.map((department) => (
                <Accordion type="single" collapsible key={department.id} defaultValue={String(department.id)}>
                  <AccordionItem value={String(department.id)}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center justify-between w-full mr-4">
                        <span className="text-lg font-medium">{department.name}</span>
                        <span className="text-sm text-gray-500">
                          {department.roles?.length || 0} role{department.roles?.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-4">
                          {department.roles?.map((role) => (
                            <Card 
                              key={role.id} 
                              className={`cursor-pointer transition-all hover:shadow-md border-2 h-fit ${
                                selectedRoles.some(r => r.id === role.id)
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => handleRoleSelection(role)}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-gray-900 break-words leading-tight">
                                      {role.title}
                                    </h4>
                                    {role.level && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {role.level}
                                      </p>
                                    )}
                                  </div>
                                  <Checkbox
                                    checked={selectedRoles.some(r => r.id === role.id)}
                                    onChange={() => handleRoleSelection(role)}
                                    className="flex-shrink-0 mt-0.5"
                                  />
                                </div>
                              </CardContent>
                            </Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))
            )}
          </div>
          
          {departmentData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No departments or roles found.</p>
              <p className="text-sm mt-1">Please contact support if this persists.</p>
            </div>
          )}
        </div>
      )}
    </QuestionCard>
  );
};

export default RoleSelectionStep;