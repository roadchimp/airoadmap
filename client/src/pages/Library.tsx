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
import { JobRole, AICapability, insertJobRoleSchema, insertAICapabilitySchema, Department } from "@shared/schema";
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
  const [editingJobRole, setEditingJobRole] = useState<JobRole | null>(null);
  const [editingAICapability, setEditingAICapability] = useState<AICapability | null>(null);
  
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
      try {
        const response = await fetch("/api/capabilities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error("Failed to create capability");
        
        queryClient.invalidateQueries({ queryKey: ["/api/capabilities"] });
        toast({ title: "Success", description: "Capability created successfully" });
        form.reset();
      } catch (error) {
        console.error(error);
        toast({ 
          title: "Error", 
          description: error instanceof Error ? error.message : "Failed to create capability",
          variant: "destructive" 
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error creating AI capability",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle job role form submission
  const onSubmitJobRole = (data: z.infer<typeof insertJobRoleSchema>) => {
    // Convert string responsibilities to array if needed
    let keyResponsibilities = data.keyResponsibilities;
    if (typeof data.keyResponsibilities === 'string') {
      keyResponsibilities = (data.keyResponsibilities as string)
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }
    
    createJobRole.mutateAsync({
      ...data,
      keyResponsibilities
    });
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
  
  return (
    <>
      <LibraryLayout
        jobRoles={jobRoles}
        aiCapabilities={aiCapabilities}
        onAddJobRole={handleAddJobRole}
        onAddAICapability={handleAddAICapability}
        onEditJobRole={handleEditJobRole}
        onEditAICapability={handleEditAICapability}
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
                      <Textarea {...field} placeholder="Brief description of this role" />
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
                        value={Array.isArray(field.value) ? field.value.join('\n') : field.value}
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
                        value={field.value}
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
    </>
  );
};

export default Library;
