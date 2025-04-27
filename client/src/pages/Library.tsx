import React, { useState } from "react";
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
import { JobRole, AICapability, AITool, insertJobRoleSchema, insertAICapabilitySchema, Department } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getDepartments } from "@/lib/api";

type FormValues = {
  name: string;
  category: string;
  description: string;
  implementationEffort: "Low" | "Medium" | "High";
  businessValue: "Low" | "Medium" | "High" | "Very High";
};

const Library: React.FC = () => {
  const { toast } = useToast();
  
  // Dialog state
  const [jobRoleDialogOpen, setJobRoleDialogOpen] = useState(false);
  const [aiCapabilityDialogOpen, setAICapabilityDialogOpen] = useState(false);
  const [aiToolDialogOpen, setAIToolDialogOpen] = useState(false);
  const [editingJobRole, setEditingJobRole] = useState<JobRole | null>(null);
  const [editingAICapability, setEditingAICapability] = useState<AICapability | null>(null);
  const [editingAITool, setEditingAITool] = useState<AITool | null>(null);
  
  // Type for departments state
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Fetch job roles
  const { 
    data: jobRoles = [], 
    isLoading: isLoadingJobRoles 
  } = useQuery<JobRole[]>({
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
  } = useQuery<AITool[]>({
    queryKey: ["/api/tools"],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch departments for the job role form
  const { 
    data: departmentsData = [] as Department[], 
    isLoading: isLoadingDepartments 
  } = useQuery({
    queryKey: ['/api/departments'],
    queryFn: () => getDepartments()
  });
  
  // Job Role form setup
  const jobRoleForm = useForm<z.infer<typeof insertJobRoleSchema>>({
    resolver: zodResolver(insertJobRoleSchema),
    defaultValues: {
      title: "",
      departmentId: 1,
      description: "",
      keyResponsibilities: [],
      aiPotential: "Medium"
    }
  });
  
  // AI Capability form setup
  const form = useForm<FormValues>({
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
  const createJobRole = useMutation({
    mutationFn: async (data: z.infer<typeof insertJobRoleSchema>) => {
      const response = await apiRequest("POST", "/api/job-roles", data);
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
  const createAICapability = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("POST", "/api/capabilities", {
        name: data.name,
        category: data.category,
        description: data.description,
        implementation_effort: data.implementationEffort,
        business_value: data.businessValue
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "AI capability created successfully"
      });
        queryClient.invalidateQueries({ queryKey: ["/api/capabilities"] });
      setAICapabilityDialogOpen(false);
        form.reset();
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
  const createAITool = useMutation({
    mutationFn: async (data: Omit<AITool, "id" | "created_at" | "updated_at">) => {
      const response = await apiRequest("POST", "/api/tools", data);
      return response.json();
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
  
  // Delete mutations
  const deleteJobRole = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/job-roles/${id}`);
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

  const deleteAICapability = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/capabilities/${id}`);
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

  const deleteAITool = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tools/${id}`);
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
    createJobRole.mutateAsync(data);
  };
  
  // Handle AI capability form submission
  const onSubmit = (values: FormValues) => {
    createAICapability.mutateAsync(values);
  };
  
  // Open job role dialog
  const handleAddJobRole = () => {
    jobRoleForm.reset({
      title: "",
      departmentId: 1,
      description: "",
      keyResponsibilities: [],
      aiPotential: "Medium"
    });
    setEditingJobRole(null);
    setJobRoleDialogOpen(true);
  };
  
  // Open AI capability dialog
  const handleAddAICapability = () => {
    form.reset({
      name: "",
      category: "",
      description: "",
      implementationEffort: "Medium",
      businessValue: "Medium"
    });
    setEditingAICapability(null);
    setAICapabilityDialogOpen(true);
  };
  
  // Edit job role
  const handleEditJobRole = (role: JobRole) => {
    jobRoleForm.reset({
      title: role.title,
      departmentId: role.departmentId,
      description: role.description || "",
      keyResponsibilities: role.keyResponsibilities || [],
      aiPotential: role.aiPotential || "Medium"
    });
    setEditingJobRole(role);
    setJobRoleDialogOpen(true);
  };
  
  // Edit AI capability
  const handleEditAICapability = (capability: AICapability) => {
    form.reset({
      name: capability.name || "",
      category: capability.category || "",
      description: capability.description || "",
      implementationEffort: capability.implementationEffort as "Low" | "Medium" | "High",
      businessValue: capability.businessValue as "Low" | "Medium" | "High" | "Very High"
    });
    setEditingAICapability(capability);
    setAICapabilityDialogOpen(true);
  };
  
  // Open AI tool dialog
  const handleAddAITool = () => {
    setEditingAITool(null);
    setAIToolDialogOpen(true);
  };
  
  // Edit AI tool
  const handleEditAITool = (tool: AITool) => {
    setEditingAITool(tool);
    setAIToolDialogOpen(true);
  };
  
  // Handle AI tool submission
  const handleAIToolSubmit = (data: Omit<AITool, "id" | "created_at" | "updated_at">) => {
    if (editingAITool) {
      // Handle edit - use PUT request for update
      const response = apiRequest("PUT", `/api/tools/${editingAITool.id}`, data);
      toast({
        title: "Success",
        description: "AI tool updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tools"] });
      setAIToolDialogOpen(false);
      setEditingAITool(null);
    } else {
      // Handle create
      createAITool.mutate(data);
    }
  };
  
  // Delete handlers
  const handleDeleteJobRole = (id: number) => {
    if (confirm("Are you sure you want to delete this job role?")) {
      deleteJobRole.mutate(id);
    }
  };

  const handleDeleteAICapability = (id: number) => {
    if (confirm("Are you sure you want to delete this AI capability?")) {
      deleteAICapability.mutate(id);
    }
  };

  const handleDeleteAITool = (id: number) => {
    if (confirm("Are you sure you want to delete this AI tool?")) {
      deleteAITool.mutate(id);
    }
  };
  
  return (
    <>
      <LibraryLayout
        jobRoles={jobRoles}
        aiCapabilities={aiCapabilities}
        aiTools={aiTools}
        onAddJobRole={handleAddJobRole}
        onAddAICapability={handleAddAICapability}
        onAddAITool={handleAddAITool}
        onEditJobRole={handleEditJobRole}
        onEditAICapability={handleEditAICapability}
        onEditAITool={handleEditAITool}
        onDeleteJobRole={handleDeleteJobRole}
        onDeleteAICapability={handleDeleteAICapability}
        onDeleteAITool={handleDeleteAITool}
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
                        value={field.value.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
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
                <Button type="submit" disabled={createJobRole.isPending}>
                  {createJobRole.isPending ? 'Saving...' : editingJobRole ? 'Update' : 'Create'}
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
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                <Button type="submit" disabled={createAICapability.isPending}>
                  {createAICapability.isPending ? 'Saving...' : editingAICapability ? 'Update' : 'Create'}
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
