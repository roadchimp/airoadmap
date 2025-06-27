'use client';

import React, { useState, useEffect } from 'react';
import { Report, Assessment } from '@shared/schema';
import {
  Table,
  TableBody,
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
import { ArrowUpDown } from "lucide-react";

interface ReportsTableProps {
  reports: Report[];
  assessments: Assessment[];
}

export default function ReportsTable({ reports: initialReports, assessments: initialAssessments }: ReportsTableProps) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [assessments, setAssessments] = useState<Assessment[]>(initialAssessments);
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "generatedAt",
      desc: true,
    },
  ]);
  
  const router = useRouter();

  useEffect(() => {
    setReports(initialReports);
    setAssessments(initialAssessments);
  }, [initialReports, initialAssessments]);

  // Find assessment title by assessmentId
  const getAssessmentTitle = (assessmentId: number) => {
    const assessment = assessments.find((a) => a.id === assessmentId);
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
        const date = new Date(row.original.generatedAt);
        return format(date, "PPp");
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
    data: reports,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (!reports) {
    return <div className="py-8 text-center">Loading reports...</div>;
  }

    return (
    <div>
      {reports.length === 0 ? (
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