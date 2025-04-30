import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import LibraryLayout from "@/components/library/LibraryLayout";
import AIToolDialog from "@/components/library/AIToolDialog";
import { 
  JobRole, 
  AICapability, 
  AiTool,
  insertJobRoleSchema, 
  insertAICapabilitySchema, 
  Department,
  JobRoleWithDepartment,
  InsertAiTool
} from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getDepartments } from "@/lib/api";

/**
 * Type definition for the AI Capability form values.
 */
type AICapabilityFormValues = {
  name: string;
  category: string;
  description: string;
  implementationEffort: "Low" | "Medium" | "High";
  businessValue: "Low" | "Medium" | "High" | "Very High";
};

/**
 * The main Library page component.
 * Handles fetching data for Job Roles, AI Capabilities, and AI Tools, 
 * manages dialog states for adding/editing items, and coordinates 
 * interactions with the LibraryLayout and dialog components.
 */
const Library: React.FC = () => {
  const { toast } = useToast();
  
  // Dialog state
  const [jobRoleDialogOpen, setJobRoleDialogOpen] = useState(false);
  const [aiCapabilityDialogOpen, setAICapabilityDialogOpen] = useState(false);
  const [aiToolDialogOpen, setAIToolDialogOpen] = useState(false);
  const [editingJobRole, setEditingJobRole] = useState<JobRole | null>(null);
  const [editingAICapability, setEditingAICapability] = useState<AICapability | null>(null);
  const [editingAITool, setEditingAITool] = useState<AiTool | null>(null);
  
  // Type for departments state
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Fetch job roles
  const { 
    data: jobRoles = [], 
    isLoading: isLoadingJobRoles 
  } = useQuery<JobRoleWithDepartment[]>({
    queryKey: ["/api/job-roles"],
  });
  
  // Fetch AI capabilities from new endpoint
  const { 
    data: aiCapabilities = [], 
    isLoading: isLoadingAICapabilities 
  } = useQuery<AICapability[]>({
    queryKey: ["/api/capabilities"],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch AI tools
  const {
    data: aiTools = [],
    isLoading: isLoadingAITools
  } = useQuery<AiTool[]>({
    queryKey: ["/api/tools"],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch departments for the job role form
  const { 
    data: departmentsData = [], 
    isLoading: isLoadingDepartments 
  } = useQuery({
    queryKey: ['/api/departments'],
    queryFn: getDepartments
  });
  
  // Update departments state when data is fetched
  useEffect(() => {
    if (departmentsData) {
      setDepartments(departmentsData);
    }
  }, [departmentsData]);
  
  // Job Role form setup
  const jobRoleForm = useForm<z.infer<typeof insertJobRoleSchema>>({
    resolver: zodResolver(insertJobRoleSchema),
    defaultValues: {
      title: "",
      departmentId: departmentsData.length > 0 ? departmentsData[0].id : undefined,
      description: "",
      keyResponsibilities: [],
      aiPotential: "Medium"
    }
  });
  
  // Update default departmentId when departments load
  useEffect(() => {
    if (departmentsData.length > 0 && !jobRoleForm.formState.isDirty) {
        jobRoleForm.reset({ 
            ...jobRoleForm.getValues(),
            departmentId: departmentsData[0].id 
        });
    }
  }, [departmentsData, jobRoleForm]);
  
  // AI Capability form setup
  const aiCapabilityForm = useForm<AICapabilityFormValues>({
    resolver: zodResolver(insertAICapabilitySchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      implementationEffort: "Medium",
      businessValue: "Medium"
    }
  });
  
  // Create job role mutation
  const createJobRoleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertJobRoleSchema>) => {
      const apiData = { ...data, departmentId: Number(data.departmentId) };
      const response = await apiRequest("POST", "/api/job-roles", apiData);
      if (!response.ok) throw new Error('Failed to create job role');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job Role created",
        description: "The job role has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/job-roles"] });
      setJobRoleDialogOpen(false);
      jobRoleForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error creating job role",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Create AI capability mutation
  const createAICapabilityMutation = useMutation({
    mutationFn: async (data: AICapabilityFormValues) => {
      const apiData = {
        name: data.name,
        category: data.category,
        description: data.description,
        implementation_effort: data.implementationEffort,
        business_value: data.businessValue
      };
      const response = await apiRequest("POST", "/api/capabilities", apiData);
      if (!response.ok) throw new Error('Failed to create AI capability');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "AI capability created successfully"
      });
        queryClient.invalidateQueries({ queryKey: ["/api/capabilities"] });
      setAICapabilityDialogOpen(false);
        aiCapabilityForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error creating AI capability",
        description: error instanceof Error ? error.message : "Failed to create AI capability",
        variant: "destructive",
      });
    }
  });
  
  // Create AI tool mutation
  const createAIToolMutation = useMutation({
    mutationFn: async (data: InsertAiTool) => {
      const response = await apiRequest("POST", "/api/tools", data);
      if (!response.ok) throw new Error('Failed to create AI tool');
      return response.json() as Promise<AiTool>;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "AI tool created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      setAIToolDialogOpen(false);
      setEditingAITool(null);
    },
    onError: (error) => {
      toast({
        title: "Error creating AI tool",
        description: error instanceof Error ? error.message : "Failed to create AI tool",
        variant: "destructive",
      });
    }
  });
  
  // Update AI tool mutation
  const updateAIToolMutation = useMutation({
      mutationFn: async ({ id, data }: { id: number, data: Partial<InsertAiTool> }) => {
          const response = await apiRequest("PUT", `/api/tools/${id}`, data);
          if (!response.ok) {
              const errData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
              throw new Error(errData?.message || `Request failed with status ${response.status}`);
          }
          return response.json() as Promise<AiTool>;
      },
      onSuccess: () => {
          toast({ title: "Success", description: "AI tool updated successfully" });
          queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
          setAIToolDialogOpen(false);
          setEditingAITool(null);
      },
      onError: (error) => {
          toast({ title: "Error updating AI tool", description: error.message, variant: "destructive" });
      }
  });
  
  // Delete mutations
  const deleteJobRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/job-roles/${id}`);
      if (!response.ok) throw new Error('Failed to delete job role');
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Job role deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/job-roles"] });
    },
    onError: (error) => {
      toast({
        title: "Error deleting job role",
        description: error instanceof Error ? error.message : "Failed to delete job role",
        variant: "destructive",
      });
    }
  });

  const deleteAICapabilityMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/capabilities/${id}`);
      if (!response.ok) throw new Error('Failed to delete AI capability');
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "AI capability deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/capabilities"] });
    },
    onError: (error) => {
      toast({
        title: "Error deleting AI capability",
        description: error instanceof Error ? error.message : "Failed to delete AI capability",
        variant: "destructive",
      });
    }
  });

  const deleteAIToolMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/tools/${id}`);
      if (!response.ok) throw new Error('Failed to delete AI tool');
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "AI tool deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
    },
    onError: (error) => {
      toast({
        title: "Error deleting AI tool",
        description: error instanceof Error ? error.message : "Failed to delete AI tool",
        variant: "destructive",
      });
    }
  });
  
  // Handle job role form submission
  const onSubmitJobRole = (data: z.infer<typeof insertJobRoleSchema>) => {
    createJobRoleMutation.mutate(data);
  };
  
  // Handle AI capability form submission
  const onSubmitAICapability = (values: AICapabilityFormValues) => {
    createAICapabilityMutation.mutate(values);
  };
  
  // Open job role dialog
  const handleAddJobRole = () => {
    setEditingJobRole(null);
    const defaultDeptId = departmentsData.length > 0 ? departmentsData[0].id : undefined;
    jobRoleForm.reset({ 
        title: "", 
        departmentId: defaultDeptId,
        description: "",
        keyResponsibilities: [],
        aiPotential: "Medium"
    });
    setJobRoleDialogOpen(true);
  };
  
  // Open AI capability dialog
  const handleAddAICapability = () => {
    setEditingAICapability(null);
    aiCapabilityForm.reset();
    setAICapabilityDialogOpen(true);
  };
  
  // Edit job role
  const handleEditJobRole = (role: JobRoleWithDepartment) => {
    setEditingJobRole(role);
    jobRoleForm.reset({
      title: role.title,
      departmentId: role.departmentId,
      description: role.description || "",
      keyResponsibilities: Array.isArray(role.keyResponsibilities) ? role.keyResponsibilities : [],
      aiPotential: role.aiPotential || "Medium"
    });
    setJobRoleDialogOpen(true);
  };
  
  // Edit AI capability
  const handleEditAICapability = (capability: AICapability) => {
    setEditingAICapability(capability);
    aiCapabilityForm.reset({
      name: capability.name || "",
      category: capability.category || "",
      description: capability.description || "",
      implementationEffort: (capability.implementationEffort || "Medium") as AICapabilityFormValues['implementationEffort'],
      businessValue: (capability.businessValue || "Medium") as AICapabilityFormValues['businessValue']
    });
    setAICapabilityDialogOpen(true);
  };
  
  // Open AI tool dialog
  const handleAddAITool = () => {
    setEditingAITool(null);
    setAIToolDialogOpen(true);
  };
  
  // Edit AI tool
  const handleEditAITool = (tool: AiTool) => {
    setEditingAITool(tool);
    setAIToolDialogOpen(true);
  };
  
  // Handle AI tool submission
  const handleAIToolSubmit = (data: Partial<InsertAiTool>) => {
    if (editingAITool) {
      const apiUpdateData = { ...data };
      updateAIToolMutation.mutate({ id: editingAITool.tool_id, data: apiUpdateData });
    } else {
      if (!data.tool_name) {
         toast({ title: "Error", description: "Tool Name is required.", variant: "destructive" });
         return; 
      }
      createAIToolMutation.mutate(data as InsertAiTool);
    }
  };
  
  // Delete handlers
  const handleDeleteJobRole = (id: number) => {
    if (confirm("Are you sure you want to delete this job role?")) {
      deleteJobRoleMutation.mutate(id);
    }
  };

  const handleDeleteAICapability = (id: number) => {
    if (confirm("Are you sure you want to delete this AI capability?")) {
      deleteAICapabilityMutation.mutate(id);
    }
  };

  const handleDeleteAITool = (id: number) => {
    if (confirm("Are you sure you want to delete this AI tool?")) {
      deleteAIToolMutation.mutate(id);
    }
  };
  
  return (
    <>
      <LibraryLayout
        initialJobRoles={jobRoles}
        initialAiCapabilities={aiCapabilities}
        initialAiTools={aiTools}
      />
      
      {/* Job Role Dialog */}
      <Dialog open={jobRoleDialogOpen} onOpenChange={setJobRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingJobRole ? 'Edit Job Role' : 'Add New Job Role'}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...jobRoleForm}>
            <form onSubmit={jobRoleForm.handleSubmit(onSubmitJobRole)} className="space-y-4">
              <FormField
                control={jobRoleForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Sales Operations Specialist" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={jobRoleForm.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value?.toString() ?? ''}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        disabled={isLoadingDepartments}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departmentsData.map((dept: Department) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={jobRoleForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Brief description of this role" value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={jobRoleForm.control}
                name="keyResponsibilities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Responsibilities</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Enter each responsibility on a new line"
                        value={Array.isArray(field.value) ? field.value.join('\n') : field.value || ""}
                        onChange={(e) => field.onChange(e.target.value.split('\n'))}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter each responsibility on a new line
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={jobRoleForm.control}
                name="aiPotential"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AI Potential</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value || "Medium"}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select AI potential" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setJobRoleDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createJobRoleMutation.isPending}>
                  {createJobRoleMutation.isPending ? 'Saving...' : editingJobRole ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* AI Capability Dialog */}
      <Dialog open={aiCapabilityDialogOpen} onOpenChange={setAICapabilityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAICapability ? 'Edit AI Capability' : 'Add New AI Capability'}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...aiCapabilityForm}>
            <form onSubmit={aiCapabilityForm.handleSubmit(onSubmitAICapability)} className="space-y-4">
              <FormField
                control={aiCapabilityForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capability Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Natural Language Understanding" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={aiCapabilityForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. NLP, Document Processing" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={aiCapabilityForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ""} 
                        placeholder="Enter capability description" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={aiCapabilityForm.control}
                name="implementationEffort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Implementation Effort</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select implementation effort" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={aiCapabilityForm.control}
                name="businessValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Value</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select business value" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Very High">Very High</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAICapabilityDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createAICapabilityMutation.isPending}>
                  {createAICapabilityMutation.isPending ? 'Saving...' : editingAICapability ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* AI Tool Dialog */}
      <AIToolDialog
        isOpen={aiToolDialogOpen}
        onClose={() => setAIToolDialogOpen(false)}
        onSubmit={handleAIToolSubmit}
        initialData={editingAITool || undefined}
      />
    </>
  );
};

export default Library;
