import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { JobRole, AICapability } from "@shared/schema";

type DataType = "jobRole" | "aiCapability";

interface DataTableProps {
  data: JobRole[] | AICapability[];
  type: DataType;
  onEdit?: (item: JobRole | AICapability) => void;
  onDelete?: (id: number) => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, type, onEdit, onDelete }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Filter data based on search query
  const filteredData = data.filter(item => {
    const searchTerm = searchQuery.toLowerCase();
    if (type === "jobRole") {
      const role = item as JobRole;
      return (
        role.title.toLowerCase().includes(searchTerm) ||
        role.description?.toLowerCase().includes(searchTerm)
      );
    } else {
      const capability = item as AICapability;
      return (
        capability.name.toLowerCase().includes(searchTerm) ||
        capability.description?.toLowerCase().includes(searchTerm) ||
        capability.category.toLowerCase().includes(searchTerm)
      );
    }
  });
  
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

  // Helper function to render status badge
  const renderStatusBadge = (value: string | null | undefined, type: 'value' | 'effort') => {
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
            placeholder={`Search ${type === "jobRole" ? "roles" : "capabilities"}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="material-icons absolute right-3 top-2 text-neutral-400">search</span>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <span className="material-icons text-sm mr-1 align-text-bottom">filter_list</span>
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <span className="material-icons text-sm mr-1 align-text-bottom">upload</span>
            Import
          </Button>
        </div>
      </div>
      
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
            ) : (
              <TableRow>
                <TableHead>Capability Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Business Value</TableHead>
                <TableHead>Implementation Effort</TableHead>
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
              : (paginatedData as AICapability[]).map((capability) => (
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
              ))}
          </TableBody>
        </Table>
        
        <div className="px-4 py-3 flex items-center justify-between border-t border-neutral-200">
          <div className="text-sm text-neutral-500">
            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, filteredData.length)}
            </span>{" "}
            of <span className="font-medium">{filteredData.length}</span> results
          </div>
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
              const pageNumber = currentPage <= 2
                ? i + 1
                : currentPage >= totalPages - 1
                ? totalPages - 2 + i
                : currentPage - 1 + i;
              
              if (pageNumber <= totalPages) {
                return (
                  <Button
                    key={pageNumber}
                    variant={pageNumber === currentPage ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                );
              }
              return null;
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DataTable;
