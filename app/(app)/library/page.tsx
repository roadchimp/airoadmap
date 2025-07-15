import React from 'react';
import { storage } from '@/server/storage';
import { AiTool, AICapability, JobRoleWithDepartment, JobDescription } from '@shared/schema';
import LibraryLayout from '@/components/library/LibraryLayout';

// Fetch all necessary data for the library view
async function getLibraryData() {
  try {
    const [aiTools, aiCapabilities, jobRoles, departments, jobDescriptions] = await Promise.all([
      storage.listAITools(),
      storage.listAICapabilities(),
      storage.listJobRoles(),
      storage.listDepartments(),
      storage.getJobDescriptions()
    ]);

    // Combine job roles with department names
    const jobRolesWithDept = jobRoles.map(role => {
      const dept = departments.find(d => d.id === role.departmentId);
      return { ...role, departmentName: dept?.name || 'Unknown' };
    });

    return {
      aiTools: Array.isArray(aiTools) ? aiTools : [],
      aiCapabilities: Array.isArray(aiCapabilities) ? aiCapabilities : [],
      jobRoles: jobRolesWithDept,
      jobDescriptions: Array.isArray(jobDescriptions) ? jobDescriptions : [],
    };
  } catch (error) {
    console.error("Error fetching library data:", error);
    return { aiTools: [], aiCapabilities: [], jobRoles: [], jobDescriptions: [] }; 
  }
}

export default async function LibraryPage() {
  const { aiTools, aiCapabilities, jobRoles, jobDescriptions } = await getLibraryData();

  return (
    <div className="container mx-auto py-8">
       <div className="mb-6">
         <h1 className="text-2xl font-bold">Library</h1>
         <p className="text-muted-foreground">Manage Job Roles, AI Capabilities, and AI Tools.</p>
       </div>
       
      <LibraryLayout 
        initialAiTools={aiTools}
        initialAiCapabilities={aiCapabilities}
        initialJobRoles={jobRoles}
        initialJobDescriptions={jobDescriptions}
      />
    </div>
  );
} 