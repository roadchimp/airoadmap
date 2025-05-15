'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Report, Assessment } from '@shared/schema';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
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
import { ArrowUpDown, RefreshCcw } from "lucide-react";

interface ReportsTableProps {
  reports: Report[];
  assessments: Assessment[];
}

export default function ReportsTable({ reports, assessments }: ReportsTableProps) {
  const [reportsData, setReportsData] = useState<Report[]>(reports);
  const [assessmentsData, setAssessmentsData] = useState<Assessment[]>(assessments);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    reports.length > 0 || assessments.length > 0 ? "success" : "loading"
  );

  const fetchData = async () => {
    setIsRefreshing(true);
    setStatus("loading");
    try {
      // Add a cache-busting timestamp to prevent cached responses
      const timestamp = new Date().getTime();
      
      // Try to fetch both reports and assessments from the public endpoints
      const [reportsResponse, assessmentsResponse] = await Promise.all([
        fetch(`/api/public/reports?t=${timestamp}`),
        fetch(`/api/public/assessments?t=${timestamp}`)
      ]);

      // Check if responses are ok
      if (!reportsResponse.ok || !assessmentsResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      // Parse response data
      const fetchedReports = await reportsResponse.json();
      const fetchedAssessments = await assessmentsResponse.json();

      // Update state
      setReportsData(Array.isArray(fetchedReports) ? fetchedReports : []);
      setAssessmentsData(Array.isArray(fetchedAssessments) ? fetchedAssessments : []);
      setStatus("success");
    } catch (error) {
      console.error("Error fetching data:", error);
      setStatus("error");
    } finally {
      setIsRefreshing(false);
    }
  };

  // If no reports or assessments were provided, try to fetch them from the public API
  useEffect(() => {
    if (reports.length === 0 && assessments.length === 0) {
      fetchData();
    }
  }, [reports.length, assessments.length]);

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "generatedAt",
      desc: true,
    },
  ]);

  const router = useRouter();

  // Find assessment title by assessmentId
  const getAssessmentTitle = (assessmentId: number) => {
    const assessment = assessmentsData.find((a) => a.id === assessmentId);
    return assessment?.title || "Unknown Assessment";
  };

  const columns: ColumnDef<Report>[] = [
    {
      accessorKey: "id",
      header: "ID",
      size: 60,
    },
    {
      accessorKey: "assessmentId",
      header: "Assessment Title",
      cell: ({ row }) => getAssessmentTitle(row.original.assessmentId),
    },
    {
      accessorKey: "generatedAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Generated At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        // Format date string
        const date = new Date(row.original.generatedAt);
        return format(date, "PPp"); // e.g., "Apr 29, 2025, 7:47 PM"
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/reports/${row.original.id}`)}
          >
            View Report
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: reportsData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (status === "loading") {
    return <div className="py-8 text-center">Loading reports...</div>;
  }

  if (status === "error") {
    return <div className="py-8 text-center text-red-500">Error loading reports data.</div>;
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchData}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          {isRefreshing ? "Refreshing..." : "Refresh Reports"}
        </Button>
      </div>
      
      {reportsData.length === 0 ? (
        <div className="py-8 text-center">
          <p className="mb-2">No reports found.</p>
          <p className="text-muted-foreground">A list of your assessment reports.</p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
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
        </>
      )}
    </div>
  );
} 