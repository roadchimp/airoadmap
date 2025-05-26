// src/components/assessment/CurrentAssessmentsTable.tsx
'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import { ArrowUpDown, ExternalLink, Pencil, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Assessment } from "@shared/schema";
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";

export type AssessmentWithReportId = Assessment & {
  reportId?: number | null;
};

interface CurrentAssessmentsTableProps {
  initialAssessments: AssessmentWithReportId[];
}

export default function CurrentAssessmentsTable({ initialAssessments }: CurrentAssessmentsTableProps) {
  const [assessments, setAssessments] = useState<AssessmentWithReportId[]>(initialAssessments);
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    initialAssessments.length > 0 ? "success" : "loading"
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // If no initial assessments were provided, try to fetch them from the public API
  useEffect(() => {
    if (initialAssessments.length === 0) {
      const fetchData = async () => {
        setStatus("loading");
        try {
          // Try to fetch from public endpoints
          const [assessmentsResponse, reportsResponse] = await Promise.all([
            fetch('/api/public/assessments'),
            fetch('/api/public/reports')
          ]);

          if (!assessmentsResponse.ok || !reportsResponse.ok) {
            throw new Error("Failed to fetch data");
          }

          const fetchedAssessments = await assessmentsResponse.json();
          const fetchedReports = await reportsResponse.json();

          // Create a map of assessment IDs to report IDs
          const assessmentToReportMap = new Map();
          if (Array.isArray(fetchedReports)) {
            fetchedReports.forEach(report => {
              if (report.assessmentId) {
                assessmentToReportMap.set(report.assessmentId, report.id);
              }
            });
          }

          // Combine assessments with their report IDs
          const assessmentsWithReports = Array.isArray(fetchedAssessments) 
            ? fetchedAssessments.map(assessment => ({
                ...assessment,
                reportId: assessmentToReportMap.get(assessment.id) || null
              }))
            : [];

          // Sort by updated date
          const sortedAssessments = [...assessmentsWithReports].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );

          setAssessments(sortedAssessments);
          setStatus("success");
        } catch (error) {
          console.error("Error fetching assessments:", error);
          setStatus("error");
        }
      };

      fetchData();
    }
  }, [initialAssessments]);

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/assessments/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      toast({
        title: "Assessment Deleted",
        description: "The assessment has been successfully deleted.",
      });

      // Remove the deleted assessment from the state
      setAssessments(assessments.filter((assessment) => assessment.id !== id));
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting assessment:", error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the assessment. Please try again later.",
      });
    }
  };

  const columns: ColumnDef<AssessmentWithReportId>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
    },
    {
      accessorKey: "industry",
      header: "Industry",
      cell: ({ row }) => <div>{row.getValue("industry") || "-"}</div>,
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Updated
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("updatedAt"));
        return <div>{format(date, "PPp")}</div>; // e.g., "Apr 29, 2025, 7:47 PM"
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            variant={status === "completed" ? "default" : "outline"}
            className={
              status === "completed"
                ? "bg-green-100 text-green-800 hover:bg-green-100"
                : ""
            }
          >
            {status === "completed" ? "Completed" : "In Progress"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const assessment = row.original;
        const reportId = assessment.reportId;
        
        return (
          <div className="flex justify-end space-x-2">
            {assessment.status === "completed" && reportId ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/assessment/${assessment.id}/view`)}
                  title="View Assessment Data"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/reports/${reportId}`)}
                  title="View Report"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Report
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/assessment/${assessment.id}/view`)}
                  title="View Assessment Data"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/assessment/${assessment.id}`)}
                  title="Edit Assessment"
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTarget(assessment.id)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              title="Delete Assessment"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: assessments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  if (status === "loading") {
    return <div className="py-8 text-center">Loading assessments...</div>;
  }

  if (status === "error") {
    return <div className="py-8 text-center text-red-500">Error loading assessments.</div>;
  }

  if (assessments.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="mb-2">No assessments found.</p>
        <p className="text-muted-foreground">
          Start by creating a new assessment.
        </p>
        <Button
          onClick={() => router.push("/assessment/new")}
          className="mt-4"
        >
          New Assessment
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
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
      <div className="flex items-center justify-end space-x-2 py-4">
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

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <ConfirmationDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget)}
          title="Confirm Deletion"
          description="Are you sure you want to delete this assessment? This action cannot be undone."
        />
      )}
    </div>
  );
}
