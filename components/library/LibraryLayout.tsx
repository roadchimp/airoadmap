'use client'; // Needs client directive for useState and event handlers

import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query"; // Import mutation hook
import { apiRequest } from "@/lib/queryClient"; // Corrected import path
import { queryClient } from "@/lib/queryClient"; // Import queryClient
import { useToast } from "@/hooks/use-toast"; // Use our custom hook
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  VisibilityState,
  Row, // Import Row type
  CellContext, // Import CellContext
  HeaderContext, // Import HeaderContext
  Column, // Import Column type
  Cell // Import Cell type
} from "@tanstack/react-table"; // Ensure this package is installed
import { ArrowUpDown, ChevronDown, MoveVertical, Edit, Trash2 } from "lucide-react"; // Correct icon name

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Import Input
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    DropdownMenu, 
    DropdownMenuCheckboxItem, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"; // Import Dropdown components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Import Table components
import DataTable from "./DataTable"; // Assuming this exists and handles generics correctly
import { 
  AICapability, 
  AiTool, 
  JobRoleWithDepartment, 
  Department, 
  InsertAiTool,
  InsertAICapability,
  InsertJobRole,
  AiToolFormData // Import the shared type
} from "@shared/schema";
import AIToolDialog from "./AIToolDialog"; // Assuming this exists and props match
import ConfirmationDialog from "@/components/shared/ConfirmationDialog"; // Corrected path assuming standard structure
import { Badge } from "@/components/ui/badge"; // Import Badge for status rendering
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

/**
 * Props for the LibraryLayout component.
 */
interface LibraryLayoutProps {
  /** Array of job roles including department names. */
  initialJobRoles: JobRoleWithDepartment[];
  /** Array of AI capabilities. */
  initialAiCapabilities: AICapability[];
  /** Array of AI tools (using snake_case schema type). */
  initialAiTools: AiTool[]; 
}

// --- Helper Function for Status Badges (moved/adapted from old DataTable) ---
const renderStatusBadge = (value: string | null | undefined, type: 'value' | 'effort' | 'license') => {
    // This function implementation remains the same as before,
    // handling different types and returning a styled span/Badge.
    // We'll include it here for completeness in the cell renderers.
    if (type === 'license') {
      const getColorClasses = (licenseType: string) => {
        switch (licenseType?.toLowerCase()) {
          case 'open source': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
          case 'commercial': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
          case 'freemium': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
          default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
      };
      return (
        <Badge variant="secondary" className={`${getColorClasses(value || 'Unknown')} border-none`}>
          {value || 'Unknown'}
        </Badge>
      );
    }

    // For value/effort
    const defaultValue = type === 'value' ? 'Medium' : 'Medium'; // Default to Medium maybe?
    const actualValue = value || defaultValue;
    
    const getColorClasses = () => {
      switch (actualValue?.toLowerCase()) {
        case 'very high':
        case 'high': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        case 'low': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      }
    };

    return (
      <Badge variant="secondary" className={`${getColorClasses()} border-none`}>
        {actualValue}
      </Badge>
    );
  };

/**
 * Provides the main layout structure for the Library Management page,
 * including tabs for Job Roles, AI Capabilities, and AI Tools, 
 * and renders the DataTable component for each tab.
 * 
 * @param {LibraryLayoutProps} props - The component props.
 */
const LibraryLayout: React.FC<LibraryLayoutProps> = ({ // Explicitly type props
  initialJobRoles,
  initialAiCapabilities,
  initialAiTools,
}) => {
  const { toast } = useToast(); // Use the hook to get the toast function
  const [activeTab, setActiveTab] = useState("jobRoles"); // Change default to Job Roles

  // --- Internal State for Displayed Data --- 
  const [jobRoles, setJobRoles] = useState<JobRoleWithDepartment[]>(initialJobRoles);
  const [aiCapabilities, setAiCapabilities] = useState<AICapability[]>(initialAiCapabilities);
  const [aiTools, setAiTools] = useState<AiTool[]>(initialAiTools); // This state is now used by the react-table instance
  
  // --- Fetch Departments for Forms --- 
   const { data: departments = [], isLoading: isLoadingDepartments } = useQuery<Department[]>({ // Explicit type for query
     queryKey: ["/api/departments"], // Use appropriate query key
     queryFn: async () => {
        const response = await apiRequest("GET", "/api/departments"); // Remove <Department[]>
        // Ensure apiRequest returns a standard Response or throws on error
        if (!response.ok) throw new Error('Failed to fetch departments'); 
        const data = await response.json();
        return data as Department[]; // Add type assertion here
     },
     staleTime: Infinity, // Departments likely don't change often within the session
   });

  // --- Dialog State --- 
  const [jobRoleDialogOpen, setJobRoleDialogOpen] = useState(false);
  const [aiCapabilityDialogOpen, setAICapabilityDialogOpen] = useState(false);
  const [aiToolDialogOpen, setAIToolDialogOpen] = useState(false); // Use this for the AIToolDialog
  const [editingJobRole, setEditingJobRole] = useState<JobRoleWithDepartment | null>(null);
  const [editingAICapability, setEditingAICapability] = useState<AICapability | null>(null);
  const [editingAITool, setEditingAITool] = useState<AiTool | null>(null); // Use this for the AIToolDialog

  // --- Update internal state if initial props change (e.g., after SSR) --- 
  useEffect(() => setJobRoles(initialJobRoles), [initialJobRoles]);
  useEffect(() => setAiCapabilities(initialAiCapabilities), [initialAiCapabilities]);
  // useEffect(() => setAiTools(initialAiTools), [initialAiTools]); // Remove this, table state handles it

  // --- TODO: Implement Actual Mutations using TanStack Query --- 
  const createToolMutation = useMutation({
    mutationFn: async (newTool: InsertAiTool) => {
      const response = await apiRequest("POST", "/api/ai-tools", newTool);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
        throw new Error(errData?.message || `Failed to create tool`);
      }
      return response.json() as Promise<AiTool>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-tools"] });
      toast({ title: "Success", description: "AI Tool created successfully" });
      setAIToolDialogOpen(false);
      setEditingAITool(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: `Failed to create tool: ${error.message}`, variant: 'destructive' });
    },
  });

  const updateToolMutation = useMutation({
    mutationFn: async ({ tool_id, toolData }: { tool_id: number; toolData: Partial<InsertAiTool> }) => {
      const response = await apiRequest("PUT", `/api/ai-tools/${tool_id}`, toolData);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
        throw new Error(errData?.message || `Request failed with status ${response.status}`);
      }
      return response.json() as Promise<AiTool>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-tools"] });
      toast({ title: "Success", description: "AI Tool updated successfully" });
      setAIToolDialogOpen(false);
      setEditingAITool(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: `Failed to update tool: ${error.message}`, variant: 'destructive' });
    },
  });

  const deleteToolMutation = useMutation({
    mutationFn: async (tool_id: number) => {
      const response = await apiRequest("DELETE", `/api/ai-tools/${tool_id}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
        throw new Error(errData?.message || `Request failed with status ${response.status}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-tools"] });
      toast({ title: "Success", description: "AI Tool deleted successfully" });
      setToolToDelete(null); // Close confirmation dialog
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: `Failed to delete tool: ${error.message}`, variant: 'destructive' });
      setToolToDelete(null); // Close confirmation dialog on error too
    },
  });

  // -- Job Role Mutations -- 
  const createJobRoleMutation = useMutation({
    mutationFn: async (data: InsertJobRole) => {
      const response = await apiRequest("POST", "/api/job-roles", data);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
        throw new Error(errData?.message || `Failed to create job role`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-roles"] });
      toast({ title: "Success", description: "Job Role created successfully" });
      setJobRoleDialogOpen(false);
      setEditingJobRole(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: `Failed to create job role: ${error.message}`, variant: 'destructive' });
    },
  });

  const updateJobRoleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertJobRole> }) => {
      const response = await apiRequest("PUT", `/api/job-roles/${id}`, data);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
        throw new Error(errData?.message || `Failed to update job role`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-roles"] });
      toast({ title: "Success", description: "Job Role updated successfully" });
      setJobRoleDialogOpen(false);
      setEditingJobRole(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: `Failed to update job role: ${error.message}`, variant: 'destructive' });
    },
  });

  const deleteJobRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/job-roles/${id}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
        throw new Error(errData?.message || `Failed to delete job role`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-roles"] });
      toast({ title: "Success", description: "Job Role deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: `Failed to delete job role: ${error.message}`, variant: 'destructive' });
    },
  });

  // -- AI Capability Mutations --
  const createCapabilityMutation = useMutation({
    mutationFn: async (data: InsertAICapability) => {
      const response = await apiRequest("POST", "/api/capabilities", data);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
        throw new Error(errData?.message || `Failed to create capability`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/capabilities"] });
      toast({ title: "Success", description: "AI Capability created successfully" });
      setAICapabilityDialogOpen(false);
      setEditingAICapability(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: `Failed to create capability: ${error.message}`, variant: 'destructive' });
    },
  });

  const updateCapabilityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertAICapability> }) => {
      const response = await apiRequest("PUT", `/api/capabilities/${id}`, data);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
        throw new Error(errData?.message || `Failed to update capability`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/capabilities"] });
      toast({ title: "Success", description: "AI Capability updated successfully" });
      setAICapabilityDialogOpen(false);
      setEditingAICapability(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: `Failed to update capability: ${error.message}`, variant: 'destructive' });
    },
  });

  const deleteCapabilityMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/capabilities/${id}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
        throw new Error(errData?.message || `Failed to delete capability`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/capabilities"] });
      toast({ title: "Success", description: "AI Capability deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: `Failed to delete capability: ${error.message}`, variant: 'destructive' });
    },
  });

  // Placeholder handlers with real implementations
  const handleCreateTool = (data: InsertAiTool) => {
    createToolMutation.mutate(data);
  };
  
  const handleUpdateTool = (id: number, data: Partial<InsertAiTool>) => {
    updateToolMutation.mutate({ tool_id: id, toolData: data });
  };
  
  const handleDeleteTool = (tool: AiTool) => { 
    deleteToolMutation.mutate(tool.tool_id);
  };

  const handleDeleteCapability = (capability: AICapability) => {
    if (confirm("Are you sure you want to delete this capability?")) {
      deleteCapabilityMutation.mutate(capability.id);
    }
  };
  
  const handleDeleteJobRole = (role: JobRoleWithDepartment) => {
    if (confirm("Are you sure you want to delete this job role?")) {
      deleteJobRoleMutation.mutate(role.id);
    }
  };

  // Dialog Control Handlers
  const handleAddJobRole = () => {
    setEditingJobRole(null);
    setJobRoleDialogOpen(true);
  };
  
  const handleAddAICapability = () => {
    setEditingAICapability(null);
    setAICapabilityDialogOpen(true);
  };
  
  const handleAddAITool = () => {
    setEditingAITool(null);
    setAIToolDialogOpen(true);
  };

  const handleEditJobRole = (role: JobRoleWithDepartment) => {
    setEditingJobRole(role);
    setJobRoleDialogOpen(true);
  };
  
  const handleEditAICapability = (capability: AICapability) => {
    setEditingAICapability(capability);
    setAICapabilityDialogOpen(true);
  };
  
  const handleEditAITool = (tool: AiTool) => {
    setEditingAITool(tool);
    setAIToolDialogOpen(true);
  };
  
  // Submit handler for AI Tool Dialog
  const handleAIToolDialogSubmit = (data: Partial<InsertAiTool>) => {
    if (editingAITool?.tool_id) {
      handleUpdateTool(editingAITool.tool_id, data);
    } else {
      handleCreateTool(data as InsertAiTool);
    }
  };

  // --- Get Add Button Handler --- 
  const getAddButtonHandler = () => {
    switch (activeTab) {
      case "jobRoles": return handleAddJobRole;
      case "aiCapabilities": return handleAddAICapability;
      case "aiTools": return handleAddAITool; // Use the correct handler
      default: return undefined;
    }
  };
  
  // --- React Table State --- 
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState(''); // State for AI Tools global filter
  const [toolToDelete, setToolToDelete] = useState<AiTool | null>(null); // Store the whole tool object

  // --- Event Handlers (using table data where applicable) ---

  // handleAddNew is replaced by handleAddAITool

  const handleEdit = useCallback((tool: AiTool) => { 
    handleEditAITool(tool);
  }, []);

  const handleDeleteRequest = useCallback((tool: AiTool) => { 
    setToolToDelete(tool);
  }, []);

  const handleConfirmDelete = () => {
    if (toolToDelete !== null) {
      handleDeleteTool(toolToDelete); // Pass the full tool object
    }
  };

  // handleDialogSubmit is handleAIToolDialogSubmit

  // --- Column Definitions --- 

  // --- Job Role Columns ---
  const jobRoleColumns: ColumnDef<JobRoleWithDepartment>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Role Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
    },
    {
      accessorKey: "departmentName",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Department <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "keyResponsibilities",
      header: "Key Responsibilities",
      cell: ({ row }) => {
        const responsibilities = row.getValue("keyResponsibilities") as string[] | null;
        return <div className="max-w-md truncate" title={responsibilities?.join(", ")}>{responsibilities?.join(", ") || "-"}</div>;
      },
    },
    {
      accessorKey: "aiPotential",
      header: "AI Potential",
      cell: ({ row }) => {
          const potential = row.getValue("aiPotential") as string;
          let colorClasses = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
          if (potential === "High") colorClasses = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
          else if (potential === "Medium") colorClasses = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
          else if (potential === "Low") colorClasses = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
          
          // Only display N/A if the value is null, undefined or empty string
          const displayValue = (!potential || potential === "") ? "N/A" : potential;
          
          return <Badge variant="secondary" className={`${colorClasses} border-none`}>{displayValue}</Badge>;
      },
      // Add filterFn if needed
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" size="sm" onClick={() => handleEditJobRole(role)} title="Edit Role">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDeleteJobRole(role)} title="Delete Role" className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // --- AI Capability Columns ---
  const aiCapabilityColumns: ColumnDef<AICapability>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Capability Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Category <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <div className="max-w-md truncate" title={row.getValue("description")}>{row.getValue("description") || "-"}</div>,
    },
    {
      accessorKey: "default_business_value",
      header: "Business Value",
      cell: ({ row }) => renderStatusBadge(row.getValue("default_business_value"), 'value'),
    },
    {
      accessorKey: "default_implementation_effort",
      header: "Implementation Effort",
      cell: ({ row }) => renderStatusBadge(row.getValue("default_implementation_effort"), 'effort'),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const capability = row.original;
        return (
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" size="sm" onClick={() => handleEditAICapability(capability)} title="Edit Capability">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDeleteCapability(capability)} title="Delete Capability" className="text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // --- AI Tool Columns (remains largely the same but uses CellContext etc.) ---
  const aiToolColumns: ColumnDef<AiTool>[] = [
    {
      accessorKey: "tool_name",
      header: ({ column }: HeaderContext<AiTool, unknown>) => ( 
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tool Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }: CellContext<AiTool, unknown>) => <div className="font-medium">{row.getValue("tool_name")}</div>, // Added font-medium
    },
    {
      accessorKey: "primary_category",
       header: ({ column }: HeaderContext<AiTool, unknown>) => ( 
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }: CellContext<AiTool, unknown>) => <div>{row.getValue("primary_category")}</div>, 
    },
    {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }: CellContext<AiTool, unknown>) => <div className="max-w-xs truncate" title={row.getValue("description")}>{row.getValue("description")}</div>, // adjusted width
    },
    {
        accessorKey: "website_url", 
        header: "Website",
        cell: ({ row }: CellContext<AiTool, unknown>) => { 
          const websiteUrl = row.getValue("website_url") as string | null; 
          return websiteUrl ? <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Link</a> : '-';
        }
    },
     {
        accessorKey: "license_type",
        header: "License",
        cell: ({ row }: CellContext<AiTool, unknown>) => renderStatusBadge(row.getValue("license_type"), 'license'), // Use badge renderer
     },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>, // Right align header
      cell: ({ row }: CellContext<AiTool, unknown>) => { 
        const tool = row.original; 
        return (
           <div className="flex justify-end space-x-2">
              {/* Edit Button using handleEdit which calls handleEditAITool */} 
              <Button variant="ghost" size="sm" onClick={() => handleEdit(tool)} title="Edit Tool">
                 <Edit className="h-4 w-4" />
              </Button>
              {/* Delete Button using handleDeleteRequest which sets state for ConfirmationDialog */}
              <Button variant="ghost" size="sm" onClick={() => handleDeleteRequest(tool)} title="Delete Tool" className="text-red-600 hover:text-red-700">
                 <Trash2 className="h-4 w-4" />
              </Button>
           </div>
        );
      },
    },
  ];


  // --- AI Tools Table Instance --- 
  const aiToolsTable = useReactTable({
    data: aiTools, // Use the aiTools state variable
    columns: aiToolColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter, // Use global filter state
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter, // Set global filter state
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // Provide a unique row ID
    getRowId: (row: AiTool) => row.tool_id.toString(), 
  });
  
  // Recalculate displayed data based on table state (for potential use elsewhere)
  // const displayedAiTools = table.getRowModel().rows.map(row => row.original);

  // --- Update table data if initial props change --- 
  useEffect(() => {
    // Remove this line as updateData is not standard and setAiTools handles the update
    // table.options.meta?.updateData?.(initialAiTools); // Update table if using meta
    // Or just set the state if table uses aiTools state directly (as it does now)
    setAiTools(initialAiTools); 
  }, [initialAiTools]); // Removed table.options.meta from dependency array

  
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8"> {/* Wider container */}
      {/* Header section with title and Add New button */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Library Management</h1> {/* Use h1 for main page title */} 
        <div>
           {/* Conditionally render Add button based on active tab */} 
           {activeTab === 'aiTools' && (
               <Button onClick={handleAddAITool}>
                  <MoveVertical className="mr-2 h-4 w-4" /> {/* Example Icon */}
                  Add New Tool
               </Button>
            )}
            {activeTab === 'aiCapabilities' && (
                <Button onClick={handleAddAICapability}>
                    <MoveVertical className="mr-2 h-4 w-4" />
                    Add New Capability
                </Button>
            )}
            {activeTab === 'jobRoles' && (
                <Button onClick={handleAddJobRole}>
                   <MoveVertical className="mr-2 h-4 w-4" />
                   Add New Job Role
          </Button>
            )}
        </div>
      </div>
      
      {/* Main content area with Tabs */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md overflow-hidden"> {/* Dark mode basic support */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tab List container */}
          <div className="border-b border-neutral-200 dark:border-neutral-700"> 
            <TabsList className="grid w-full grid-cols-3 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-t-lg">
              <TabsTrigger value="jobRoles" className="py-2 data-[state=active]:bg-white data-[state=active]:dark:bg-neutral-950 data-[state=active]:shadow-sm rounded-md"> 
                Job Roles
              </TabsTrigger>
              <TabsTrigger value="aiCapabilities" className="py-2 data-[state=active]:bg-white data-[state=active]:dark:bg-neutral-950 data-[state=active]:shadow-sm rounded-md"> 
                AI Capabilities
              </TabsTrigger>
              <TabsTrigger value="aiTools" className="py-2 data-[state=active]:bg-white data-[state=active]:dark:bg-neutral-950 data-[state=active]:shadow-sm rounded-md"> 
                AI Tools
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Tab Content for Job Roles */}
          <TabsContent value="jobRoles" className="p-4">
            <DataTable<JobRoleWithDepartment>
              data={jobRoles}
              columns={jobRoleColumns}
              onEdit={handleEditJobRole}
              onDelete={handleDeleteJobRole}
            />
          </TabsContent>
          
          {/* Tab Content for AI Capabilities */}
          <TabsContent value="aiCapabilities" className="p-4">
            <DataTable<AICapability>
              data={aiCapabilities}
              columns={aiCapabilityColumns}
              onEdit={handleEditAICapability}
              onDelete={handleDeleteCapability}
            />
          </TabsContent>

          {/* Tab Content for AI Tools (using React Table directly) */} 
          <TabsContent value="aiTools" className="p-0"> {/* Remove padding if table container has it */}
            <div className="w-full p-4"> 
              {/* Header: Filter Input and Column Visibility */} 
              <div className="flex items-center justify-between py-4"> 
                 {/* Global Filter Input for AI Tools table */} 
                 <Input
                    placeholder="Search AI tools..." // More specific placeholder
                    value={globalFilter ?? ""} // Use AI Tools global filter state
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
                        setGlobalFilter(event.target.value) // Update AI Tools global filter state
                    }
                    className="max-w-sm"
                 />
                 {/* Column Visibility Dropdown for AI Tools table */} 
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                       <Button variant="outline" className="ml-auto">
                       Columns <ChevronDown className="ml-2 h-4 w-4" />
                       </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end">
                       {aiToolsTable
                       .getAllColumns()
                       .filter((column: Column<AiTool, unknown>) => column.getCanHide()) // Add type
                       .map((column: Column<AiTool, unknown>) => { // Add type
                           return (
                           <DropdownMenuCheckboxItem
                               key={column.id}
                               className="capitalize"
                               checked={column.getIsVisible()}
                               onCheckedChange={(value: boolean) => // Add type
                               column.toggleVisibility(!!value)
                               }
                           >
                               {/* Improve display name if needed */}
                               {column.id.replace(/_/g, ' ')}
                           </DropdownMenuCheckboxItem>
                           );
                       })}
                   </DropdownMenuContent>
                 </DropdownMenu>
              </div>

              {/* Table */} 
              <div className="rounded-md border"> 
                <Table>
                  <TableHeader>
                    {aiToolsTable.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          return (
                            <TableHead key={header.id}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {aiToolsTable.getRowModel().rows?.length ? (
                      aiToolsTable.getRowModel().rows.map((row: Row<AiTool>) => ( // Add type to row
                        <TableRow
                          key={row.id} // Use table's internal row id
                          data-state={row.getIsSelected() && "selected"}
                        >
                          {row.getVisibleCells().map((cell: Cell<AiTool, unknown>) => ( // Add type to cell
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={aiToolColumns.length}
                          className="h-24 text-center"
                        >
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

               {/* Pagination */} 
              <div className="flex items-center justify-end space-x-2 py-4"> 
                <div className="flex-1 text-sm text-muted-foreground"> 
                  {aiToolsTable.getFilteredSelectedRowModel().rows.length} of{" "}
                  {aiToolsTable.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="space-x-2"> 
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => aiToolsTable.previousPage()}
                    disabled={!aiToolsTable.getCanPreviousPage()}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => aiToolsTable.nextPage()}
                    disabled={!aiToolsTable.getCanNextPage()}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Render Dialogs */} 
      {/* Ensure AIToolDialog props match expected signature */}
      <AIToolDialog
        isOpen={aiToolDialogOpen} // Use specific state
        onClose={() => setAIToolDialogOpen(false)} // Close this specific dialog
        // Type assertion is no longer needed as AIToolDialog now expects AiToolFormData
        onSubmit={handleAIToolDialogSubmit} 
        // Ensure initialData type matches what AIToolDialog expects (AiTool | null)
        initialData={editingAITool} 
      />
      
      {/* Job Role Dialog */}
      <Dialog open={jobRoleDialogOpen} onOpenChange={setJobRoleDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingJobRole ? 'Edit Job Role' : 'Add New Job Role'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const potentialValue = formData.get('aiPotential') as string;
            const data: Partial<InsertJobRole> = {
              title: formData.get('title') as string,
              departmentId: parseInt(formData.get('departmentId') as string, 10),
              keyResponsibilities: formData.get('keyResponsibilities') ? 
                (formData.get('keyResponsibilities') as string).split(',').map(r => r.trim()) : 
                [],
              aiPotential: (() => {
                const value = formData.get('aiPotential');
                if (value === 'Low' || value === 'Medium' || value === 'High') {
                  return value;
                }
                return 'Medium'; // Default value
              })(),
              description: formData.get('description') as string || undefined,
            };
            
            if (editingJobRole) {
              updateJobRoleMutation.mutate({ id: editingJobRole.id, data });
            } else {
              createJobRoleMutation.mutate(data as InsertJobRole);
            }
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">Title</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingJobRole?.title || ''}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="departmentId" className="text-right">Department</Label>
                <select 
                  id="departmentId" 
                  name="departmentId"
                  defaultValue={editingJobRole?.departmentId || ''}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background col-span-3"
                  required
                >
                  <option value="">Select a department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="keyResponsibilities" className="text-right">Key Responsibilities</Label>
                <textarea
                  id="keyResponsibilities"
                  name="keyResponsibilities"
                  defaultValue={editingJobRole?.keyResponsibilities?.join(', ') || ''}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background col-span-3"
                  placeholder="Enter responsibilities separated by commas"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="aiPotential" className="text-right">AI Potential</Label>
                <select 
                  id="aiPotential" 
                  name="aiPotential"
                  defaultValue={editingJobRole?.aiPotential || 'Medium'}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background col-span-3"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={editingJobRole?.description || ''}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background col-span-3"
                  placeholder="Enter description"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setJobRoleDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingJobRole ? 'Update' : 'Create'} Job Role</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* AI Capability Dialog */}
      <Dialog open={aiCapabilityDialogOpen} onOpenChange={setAICapabilityDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingAICapability ? 'Edit AI Capability' : 'Add New AI Capability'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data: Partial<InsertAICapability> = {
              name: formData.get('name') as string,
              category: formData.get('category') as string,
              description: formData.get('description') as string || undefined,
              default_business_value: formData.get('businessValue') as "High" | "Medium" | "Low" | "Very High",
              default_implementation_effort: formData.get('implementationEffort') as "High" | "Medium" | "Low",
            };
            
            if (editingAICapability) {
              updateCapabilityMutation.mutate({ id: editingAICapability.id, data });
            } else {
              createCapabilityMutation.mutate(data as InsertAICapability);
            }
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingAICapability?.name || ''}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <Input
                  id="category"
                  name="category"
                  defaultValue={editingAICapability?.category || ''}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={editingAICapability?.description || ''}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background col-span-3"
                  placeholder="Enter description"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="businessValue" className="text-right">Business Value</Label>
                <select 
                  id="businessValue" 
                  name="businessValue"
                  defaultValue={editingAICapability?.default_business_value || 'Medium'}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background col-span-3"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="implementationEffort" className="text-right">Implementation Effort</Label>
                <select 
                  id="implementationEffort" 
                  name="implementationEffort"
                  defaultValue={editingAICapability?.default_implementation_effort || 'Medium'}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background col-span-3"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAICapabilityDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingAICapability ? 'Update' : 'Create'} AI Capability</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {toolToDelete !== null && (
         <ConfirmationDialog
          isOpen={toolToDelete !== null}
          onClose={() => setToolToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Confirm Deletion"
          description={`Are you sure you want to delete the AI tool "${toolToDelete.tool_name}" (ID: ${toolToDelete.tool_id})? This action cannot be undone.`} // Updated description to show tool name if available
         />
       )}
    </div>
  );
};

export default LibraryLayout;
