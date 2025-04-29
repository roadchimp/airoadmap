import React from 'react';
import { storage } from '@/server/storage';
import { AiTool, AICapability, JobRole, Department } from '@shared/schema';
import LibraryLayout from '@/components/library/LibraryLayout'; // Assuming path/alias works
// import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/layout/PageHeader'; // Keep removed

// Fetch all necessary data for the library view
async function getLibraryData() {
  try {
    const [aiTools, aiCapabilities, jobRoles, departments] = await Promise.all([
      storage.listAITools?.() || [],
      storage.listAICapabilities?.() || [],
      storage.listJobRoles?.() || [],
      storage.listDepartments?.() || [] // Keep fetching departments here for SSR role mapping
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
      // No longer need to pass departments to Layout
    };
  } catch (error) {
    console.error("Error fetching library data:", error);
    // Return shape matches props expected by LibraryLayout
    return { aiTools: [], aiCapabilities: [], jobRoles: [] }; 
  }
}

export default async function LibraryPage() {
  // Destructure fetched data matching the naming convention expected by LibraryLayout
  const { aiTools, aiCapabilities, jobRoles } = await getLibraryData();

  return (
    <div className="container mx-auto py-8">
       <div className="mb-6">
         <h1 className="text-2xl font-bold">Library</h1>
         <p className="text-muted-foreground">Manage Job Roles, AI Capabilities, and AI Tools.</p>
       </div>
       
      {/* Pass data using the 'initial' prop names */}
      <LibraryLayout 
        initialAiTools={aiTools}
        initialAiCapabilities={aiCapabilities}
        initialJobRoles={jobRoles}
        // Removed departments prop
      />
    </div>
  );
} 