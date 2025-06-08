'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from '@/lib/session/SessionContext';
import { Department, JobRole } from '@/lib/session/sessionTypes';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import QuestionCard from '@/app/(app)/assessment/new/_components/QuestionCard';
import { Skeleton } from '@/components/ui/skeleton';

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

  const handleRoleSelection = (role: JobRole) => {
    const isSelected = selectedRoles.some((r: JobRole) => r.id === role.id);
    let newSelectedRoles: JobRole[];

    if (isSelected) {
      newSelectedRoles = selectedRoles.filter((r: JobRole) => r.id !== role.id);
    } else {
      newSelectedRoles = [...selectedRoles, role];
    }
    
    // We assume the schema is valid as we are just selecting roles.
    setStepData(currentStepIndex, { roleSelection: { selectedRoles: newSelectedRoles } }, true);
  };
  
  const renderSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-8 w-1/2" />
          <div className="pl-4 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <QuestionCard title="Role Selection" description="Select the job roles that you want to include in this assessment.">
      {isLoading ? (
        renderSkeleton()
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <Accordion type="multiple" defaultValue={departmentData.map((d) => String(d.id))} className="w-full">
          {departmentData.map((department) => (
            <AccordionItem value={String(department.id)} key={department.id}>
              <AccordionTrigger className="text-lg font-semibold">{department.name}</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {(department.roles || []).map((role: JobRole) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={selectedRoles.some((r: JobRole) => r.id === role.id)}
                        onCheckedChange={() => handleRoleSelection(role)}
                      />
                      <Label htmlFor={`role-${role.id}`} className="font-normal">
                        {role.title}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </QuestionCard>
  );
};

export default RoleSelectionStep;