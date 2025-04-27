import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataTable from "./DataTable";
import { 
  // JobRole, // Base type, not directly used in props
  AICapability, 
  AiTool, // snake_case DB type
  JobRoleWithDepartment // Combined type for display
} from "@shared/schema";

/**
 * Props for the LibraryLayout component.
 */
interface LibraryLayoutProps {
  /** Array of job roles including department names. */
  jobRoles: JobRoleWithDepartment[];
  /** Array of AI capabilities. */
  aiCapabilities: AICapability[];
  /** Array of AI tools (using snake_case schema type). */
  aiTools: AiTool[]; 
  /** Handler function to open the 'Add Job Role' dialog. */
  onAddJobRole?: () => void;
  /** Handler function to open the 'Add AI Capability' dialog. */
  onAddAICapability?: () => void;
  /** Handler function to open the 'Add AI Tool' dialog. */
  onAddAITool?: () => void;
  /** Handler function to open the 'Edit Job Role' dialog. */
  onEditJobRole?: (role: JobRoleWithDepartment) => void; 
  /** Handler function to open the 'Edit AI Capability' dialog. */
  onEditAICapability?: (capability: AICapability) => void;
  /** Handler function to open the 'Edit AI Tool' dialog. */
  onEditAITool?: (tool: AiTool) => void; 
  /** Handler function to delete a Job Role. */
  onDeleteJobRole?: (id: number) => void;
  /** Handler function to delete an AI Capability. */
  onDeleteAICapability?: (id: number) => void;
  /** Handler function to delete an AI Tool. */
  onDeleteAITool?: (id: number) => void;
}

/**
 * Provides the main layout structure for the Library Management page,
 * including tabs for Job Roles, AI Capabilities, and AI Tools, 
 * and renders the DataTable component for each tab.
 * 
 * @param {LibraryLayoutProps} props - The component props.
 */
const LibraryLayout: React.FC<LibraryLayoutProps> = ({
  jobRoles,
  aiCapabilities,
  aiTools,
  onAddJobRole,
  onAddAICapability,
  onAddAITool,
  onEditJobRole,
  onEditAICapability,
  onEditAITool,
  onDeleteJobRole,
  onDeleteAICapability,
  onDeleteAITool
}) => {
  const [activeTab, setActiveTab] = useState("jobRoles");
  
  /**
   * Determines the correct 'Add New' button handler based on the active tab.
   * @returns The appropriate add handler function or undefined.
   */
  const getAddButtonHandler = () => {
    switch (activeTab) {
      case "jobRoles":
        return onAddJobRole;
      case "aiCapabilities":
        return onAddAICapability;
      case "aiTools":
        return onAddAITool;
      default:
        return undefined;
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header section with title and Add New button */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Library Management</h2>
        <div>
          <Button onClick={getAddButtonHandler()}>
            {/* Consider using an Icon component if available */}
            <span className="material-icons text-sm mr-1 align-text-bottom">add</span>
            Add New
          </Button>
        </div>
      </div>
      
      {/* Main content area with Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <Tabs defaultValue="jobRoles" onValueChange={setActiveTab}>
          {/* Tab List container */}
          <div className="border-b border-neutral-200">
            <TabsList className="bg-transparent border-b">
              <TabsTrigger value="jobRoles" className="px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600">
                Job Roles
              </TabsTrigger>
              <TabsTrigger value="aiCapabilities" className="px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600">
                AI Capabilities
              </TabsTrigger>
              <TabsTrigger value="aiTools" className="px-6 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600">
                AI Tools
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Tab Content for Job Roles */}
          <TabsContent value="jobRoles">
            <DataTable
              data={jobRoles} // Pass JobRoleWithDepartment[]
              type="jobRole"
              onEdit={onEditJobRole ? (item) => onEditJobRole(item as JobRoleWithDepartment) : undefined}
              onDelete={onDeleteJobRole}
            />
          </TabsContent>
          
          {/* Tab Content for AI Capabilities */}
          <TabsContent value="aiCapabilities">
            <DataTable
              data={aiCapabilities} // Pass AICapability[]
              type="aiCapability"
              onEdit={onEditAICapability ? (item) => onEditAICapability(item as AICapability) : undefined}
              onDelete={onDeleteAICapability}
            />
          </TabsContent>

          {/* Tab Content for AI Tools */}
          <TabsContent value="aiTools">
            <DataTable
              data={aiTools} // Pass AiTool[] (snake_case)
              type="aiTool"
              onEdit={onEditAITool ? (item) => onEditAITool(item as AiTool) : undefined}
              onDelete={onDeleteAITool}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LibraryLayout;
