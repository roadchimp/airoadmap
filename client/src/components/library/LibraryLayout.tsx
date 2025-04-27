import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataTable from "./DataTable";
import { 
  JobRole,
  AICapability,
  AITool
} from "@shared/schema";

interface LibraryLayoutProps {
  jobRoles: JobRole[];
  aiCapabilities: AICapability[];
  aiTools: AITool[];
  onAddJobRole?: () => void;
  onAddAICapability?: () => void;
  onAddAITool?: () => void;
  onEditJobRole?: (role: JobRole) => void;
  onEditAICapability?: (capability: AICapability) => void;
  onEditAITool?: (tool: AITool) => void;
  onDeleteJobRole?: (id: number) => void;
  onDeleteAICapability?: (id: number) => void;
  onDeleteAITool?: (id: number) => void;
}

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
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Library Management</h2>
        <div>
          <Button onClick={getAddButtonHandler()}>
            <span className="material-icons text-sm mr-1 align-text-bottom">add</span>
            Add New
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <Tabs defaultValue="jobRoles" onValueChange={setActiveTab}>
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
          
          <TabsContent value="jobRoles">
            <DataTable
              data={jobRoles}
              type="jobRole"
              onEdit={onEditJobRole}
              onDelete={onDeleteJobRole}
            />
          </TabsContent>
          
          <TabsContent value="aiCapabilities">
            <DataTable
              data={aiCapabilities}
              type="aiCapability"
              onEdit={onEditAICapability}
              onDelete={onDeleteAICapability}
            />
          </TabsContent>

          <TabsContent value="aiTools">
            <DataTable
              data={aiTools}
              type="aiTool"
              onEdit={onEditAITool}
              onDelete={onDeleteAITool}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LibraryLayout;
