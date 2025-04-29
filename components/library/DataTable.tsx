'use client';

import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  Row,
  Cell,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  JobRole,
  AICapability, 
  AiTool,
  JobRoleWithDepartment
} from "@shared/schema";

// Generic constraint: Ensure data items might have an id or tool_id for potential keying, though not strictly enforced here.
// We primarily rely on passing the whole item for actions.
type BaseData = { id?: number | string; tool_id?: number | string };

interface DataTableProps<TData> {
  /** The data array to display */
  data: TData[];
  /** Column definitions for the table */
  columns: ColumnDef<TData>[];
  /** Optional global search filter string */
  globalFilter?: string;
  /** Optional callback when global filter changes */
  setGlobalFilter?: (value: string) => void;
  // Note: onEdit and onDelete now pass the entire row item
  /** Optional callback when an item's edit action is triggered */
  onEdit?: (item: TData) => void;
  /** Optional callback when an item's delete action is triggered */
  onDelete?: (item: TData) => void;
}

/**
 * A generic data table component built using @tanstack/react-table V8,
 * supporting sorting, pagination, and global filtering (if provided).
 * Column-specific filtering/rendering is defined via the `columns` prop.
 */
const DataTable = <TData extends BaseData>({
  data,
  columns,
  globalFilter = '', // Default to empty string if not provided
  setGlobalFilter, // Optional handler
}: DataTableProps<TData>) => {

  const [sorting, setSorting] = useState<SortingState>([]);
  // Column filtering state can be added here if needed, managed via columns prop
  // const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      // columnFilters, // Add if using column filters
    },
    onSortingChange: setSorting,
    // onColumnFiltersChange: setColumnFilters, // Add if using column filters
    onGlobalFilterChange: setGlobalFilter, // Use optional handler from props
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // For global filter
    // Provide a unique row ID if possible, falling back to index
    getRowId: (row, index) => (row.id ?? row.tool_id ?? index).toString(),
    // Debugging options (optional)
    // debugTable: true,
    // debugHeaders: true,
    // debugColumns: true,
  });

  // Remove internal filtering/search/pagination logic as it's handled by React Table
  // const [searchQuery, setSearchQuery] = useState(""); // Replaced by globalFilter prop
  // const [currentPage, setCurrentPage] = useState(1); // Handled by table state
  // const itemsPerPage = 10; // Handled by table state/methods
  // Remove applyFilters, getUniqueValues, handlePageChange, etc.

  return (
    <div className="w-full">
      {/* Optional: Global Filter Input (if setGlobalFilter is provided) */} 
      {setGlobalFilter && (
        <div className="flex items-center py-4 px-4 border-b border-neutral-200">
          <Input
            placeholder="Search all columns..."
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          {/* Add column visibility dropdown here if desired */} 
        </div>
      )}

      {/* Table */} 
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}> {/* Apply size */}
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: Row<TData>) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell: Cell<TData, unknown>) => (
                    <TableCell key={cell.id} style={{ width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined }}> {/* Apply size */}
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
                  colSpan={columns.length}
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
      <div className="flex items-center justify-end space-x-2 py-4 px-4">
        {/* Optional: Row selection count */} 
        {/* <div className="flex-1 text-sm text-muted-foreground">
           {table.getFilteredSelectedRowModel().rows.length} of{" "}
           {table.getFilteredRowModel().rows.length} row(s) selected.
         </div> */}
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
