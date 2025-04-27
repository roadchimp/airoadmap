import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { JobRole, AICapability, AITool } from "@shared/schema";

type DataType = "jobRole" | "aiCapability" | "aiTool";

interface FilterState {
  // Job Role filters
  aiPotential?: string;
  departmentId?: number;
  // AI Capability filters
  category?: string;
  businessValue?: string;
  implementationEffort?: string;
  // AI Tool filters
  primaryCategory?: string;
  licenseType?: string;
}

interface DataTableProps {
  data: JobRole[] | AICapability[] | AITool[];
  type: DataType;
  onEdit?: (item: JobRole | AICapability | AITool) => void;
  onDelete?: (id: number) => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, type, onEdit, onDelete }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});
  const itemsPerPage = 10;

  // Get unique values for filter options
  const getUniqueValues = (key: string) => {
    return Array.from(new Set(data.map(item => (item as any)[key]).filter(Boolean)));
  };

  // Apply filters to data
  const applyFilters = (items: (JobRole | AICapability | AITool)[]) => {
    return items.filter(item => {
      if (type === "jobRole") {
        const role = item as JobRole;
        return (
          (!filters.aiPotential || filters.aiPotential === "all" || role.aiPotential === filters.aiPotential) &&
          (!filters.departmentId || role.departmentId === filters.departmentId)
        );
      } else if (type === "aiCapability") {
        const capability = item as AICapability;
        return (
          (!filters.category || filters.category === "all" || capability.category === filters.category) &&
          (!filters.businessValue || filters.businessValue === "all" || capability.businessValue === filters.businessValue) &&
          (!filters.implementationEffort || filters.implementationEffort === "all" || capability.implementationEffort === filters.implementationEffort)
        );
      } else {
        const tool = item as AITool;
        return (
          (!filters.primaryCategory || filters.primaryCategory === "all" || tool.primary_category === filters.primaryCategory) &&
          (!filters.licenseType || filters.licenseType === "all" || tool.license_type === filters.licenseType)
        );
      }
    });
  };
  
  // Filter data based on search query and filters
  const filteredData = applyFilters(data.filter(item => {
    const searchTerm = searchQuery.toLowerCase();
    if (type === "jobRole") {
      const role = item as JobRole;
      return (
        role.title.toLowerCase().includes(searchTerm) ||
        role.description?.toLowerCase().includes(searchTerm)
      );
    } else if (type === "aiCapability") {
      const capability = item as AICapability;
      return (
        capability.name.toLowerCase().includes(searchTerm) ||
        capability.description?.toLowerCase().includes(searchTerm) ||
        capability.category.toLowerCase().includes(searchTerm)
      );
    } else {
      const tool = item as AITool;
      return (
        tool.tool_name.toLowerCase().includes(searchTerm) ||
        tool.description?.toLowerCase().includes(searchTerm) ||
        tool.primary_category.toLowerCase().includes(searchTerm) ||
        tool.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }
  }));
  
  // Paginate data
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({});
    setFilterDialogOpen(false);
  };

  // Apply filters
  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page when filters change
    setFilterDialogOpen(false);
  };

  // Get active filter count
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // Helper function to render status badge
  const renderStatusBadge = (value: string | null | undefined, type: 'value' | 'effort' | 'license') => {
    if (type === 'license') {
      const getColorClasses = (licenseType: string) => {
        switch (licenseType) {
          case 'Open Source':
            return 'bg-green-100 text-green-800';
          case 'Commercial':
            return 'bg-blue-100 text-blue-800';
          case 'Freemium':
            return 'bg-purple-100 text-purple-800';
          default:
            return 'bg-gray-100 text-gray-800';
        }
      };

      return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getColorClasses(value || 'Unknown')}`}>
          {value || 'Unknown'}
        </span>
      );
    }

    const defaultValue = type === 'value' ? 'High' : 'Medium';
    const actualValue = value || defaultValue;
    
    const getColorClasses = () => {
      switch (actualValue) {
        case 'High':
        case 'Very High':
          return 'bg-green-100 text-green-800';
        case 'Medium':
          return 'bg-yellow-100 text-yellow-800';
        case 'Low':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getColorClasses()}`}>
        {actualValue}
      </span>
    );
  };
  
  return (
    <>
      <div className="p-4 flex items-center justify-between border-b border-neutral-200">
        <div className="relative w-64">
          <Input
            type="text"
            className="w-full px-4 py-2 pr-10"
            placeholder={`Search ${
              type === "jobRole" 
                ? "roles" 
                : type === "aiCapability" 
                ? "capabilities" 
                : "tools"
            }...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="material-icons absolute right-3 top-2 text-neutral-400">search</span>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setFilterDialogOpen(true)}
            className="relative"
          >
            <span className="material-icons text-sm mr-1 align-text-bottom">filter_list</span>
            Filter
            {activeFilterCount > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          <Button variant="outline" size="sm">
            <span className="material-icons text-sm mr-1 align-text-bottom">upload</span>
            Import
          </Button>
        </div>
      </div>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter {type === "jobRole" ? "Roles" : type === "aiCapability" ? "Capabilities" : "Tools"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {type === "jobRole" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">AI Potential</label>
                  <Select
                    value={filters.aiPotential || "all"}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, aiPotential: value === "all" ? undefined : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select AI potential" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {type === "aiCapability" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={filters.category || "all"}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, category: value === "all" ? undefined : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {getUniqueValues("category").map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Business Value</label>
                  <Select
                    value={filters.businessValue || "all"}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, businessValue: value === "all" ? undefined : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select business value" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Very High">Very High</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Implementation Effort</label>
                  <Select
                    value={filters.implementationEffort || "all"}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, implementationEffort: value === "all" ? undefined : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select implementation effort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {type === "aiTool" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Primary Category</label>
                  <Select
                    value={filters.primaryCategory || "all"}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, primaryCategory: value === "all" ? undefined : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {getUniqueValues("primary_category").map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">License Type</label>
                  <Select
                    value={filters.licenseType || "all"}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, licenseType: value === "all" ? undefined : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select license type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Open Source">Open Source</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Freemium">Freemium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleResetFilters}>Reset</Button>
            <Button onClick={handleApplyFilters}>Apply Filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {type === "jobRole" ? (
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Key Responsibilities</TableHead>
                <TableHead>AI Potential</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            ) : type === "aiCapability" ? (
              <TableRow>
                <TableHead>Capability Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Business Value</TableHead>
                <TableHead>Implementation Effort</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            ) : (
              <TableRow>
                <TableHead>Tool Name</TableHead>
                <TableHead>Primary Category</TableHead>
                <TableHead>License Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Website</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {type === "jobRole"
              ? (paginatedData as JobRole[]).map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.title}</TableCell>
                  <TableCell>Department {role.departmentId}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {role.keyResponsibilities?.join(", ")}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      role.aiPotential === "High"
                        ? "bg-green-100 text-green-800"
                        : role.aiPotential === "Medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {role.aiPotential}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <button 
                        className="text-primary-600 hover:text-primary-800"
                        onClick={() => onEdit && onEdit(role)}
                      >
                        <span className="material-icons text-sm">edit</span>
                      </button>
                      <button className="text-neutral-600 hover:text-neutral-800">
                        <span className="material-icons text-sm">visibility</span>
                      </button>
                      <button 
                        className="text-neutral-400 hover:text-neutral-600"
                        onClick={() => onDelete && onDelete(role.id)}
                      >
                        <span className="material-icons text-sm">delete</span>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
              : type === "aiCapability"
              ? (paginatedData as AICapability[]).map((capability) => (
                <TableRow key={capability.id}>
                  <TableCell className="font-medium">{capability.name}</TableCell>
                  <TableCell>{capability.category || 'Uncategorized'}</TableCell>
                  <TableCell className="max-w-md truncate">{capability.description}</TableCell>
                  <TableCell>
                    {renderStatusBadge(capability.businessValue, 'value')}
                  </TableCell>
                  <TableCell>
                    {renderStatusBadge(capability.implementationEffort, 'effort')}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <button 
                        className="text-primary-600 hover:text-primary-800"
                        onClick={() => onEdit && onEdit(capability)}
                      >
                        <span className="material-icons text-sm">edit</span>
                      </button>
                      <button className="text-neutral-600 hover:text-neutral-800">
                        <span className="material-icons text-sm">visibility</span>
                      </button>
                      <button 
                        className="text-neutral-400 hover:text-neutral-600"
                        onClick={() => onDelete && onDelete(capability.id)}
                      >
                        <span className="material-icons text-sm">delete</span>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
              : (paginatedData as AITool[]).map((tool) => (
                <TableRow key={tool.id}>
                  <TableCell className="font-medium">{tool.tool_name}</TableCell>
                  <TableCell>{tool.primary_category}</TableCell>
                  <TableCell>
                    {renderStatusBadge(tool.license_type, 'license')}
                  </TableCell>
                  <TableCell className="max-w-md truncate">{tool.description}</TableCell>
                  <TableCell>
                    {tool.website_url && (
                      <a 
                        href={tool.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-800"
                      >
                        Visit Website
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <button 
                        className="text-primary-600 hover:text-primary-800"
                        onClick={() => onEdit && onEdit(tool)}
                      >
                        <span className="material-icons text-sm">edit</span>
                      </button>
                      <button className="text-neutral-600 hover:text-neutral-800">
                        <span className="material-icons text-sm">visibility</span>
                      </button>
                      <button 
                        className="text-neutral-400 hover:text-neutral-600"
                        onClick={() => onDelete && onDelete(tool.id)}
                      >
                        <span className="material-icons text-sm">delete</span>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-neutral-700">
                Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredData.length)}
                </span>{" "}
                of <span className="font-medium">{filteredData.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <Button
                  variant="outline"
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <span className="material-icons text-sm">chevron_left</span>
                </Button>
                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    className="relative inline-flex items-center px-4 py-2 border border-neutral-300 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-neutral-300 bg-white text-sm font-medium text-neutral-500 hover:bg-neutral-50"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <span className="material-icons text-sm">chevron_right</span>
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DataTable;
