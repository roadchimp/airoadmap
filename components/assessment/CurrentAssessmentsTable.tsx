// src/components/assessment/CurrentAssessmentsTable.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  ColumnFiltersState,
  getFilteredRowModel,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Eye, MoreHorizontal, Pencil, Trash2, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Assessment, assessmentStatusEnum } from '@shared/schema';
import { useToast } from "@/hooks/use-toast";

type AssessmentWithReportId = Assessment & {
    reportId?: number | null;
    title?: string;
  };

interface CurrentAssessmentsTableProps {
  initialAssessments: AssessmentWithReportId[];
}

const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export default function CurrentAssessmentsTable({ initialAssessments }: CurrentAssessmentsTableProps) {
  const [assessments, setAssessments] = useState<AssessmentWithReportId[]>(initialAssessments);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<AssessmentWithReportId | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleDeleteAssessment = async () => {
    if (!assessmentToDelete) return;
    setAssessments(assessments.filter(a => a.id !== assessmentToDelete.id));
    toast({ title: "Success (Placeholder)", description: `Assessment '${assessmentToDelete.title}' deleted.` });
    setIsDeleteDialogOpen(false);
    setAssessmentToDelete(null);
  };

  const openDeleteDialog = (assessment: AssessmentWithReportId) => {
    setAssessmentToDelete(assessment);
    setIsDeleteDialogOpen(true);
  };

  const columns: ColumnDef<AssessmentWithReportId>[] = useMemo(() => [
    {
      accessorKey: 'title',
      header: 'Assessment Name',
      cell: ({ row }) => <div className="font-medium">{row.getValue('title')}</div>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return capitalizeFirstLetter(status);
      },
      enableColumnFilter: true,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Modified',
      cell: ({ row }) => {
        const date = new Date(row.getValue('updatedAt'));
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const assessment = row.original;
        const canEdit = assessment.status === 'draft';

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit ? (
                 <DropdownMenuItem asChild>
                   <Link href={`/assessment/new?id=${assessment.id}`} className='flex items-center cursor-pointer'>
                     <Pencil className="mr-2 h-4 w-4" /> Edit
                   </Link>
                 </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem asChild disabled={!assessment.reportId}>
                    <Link href={assessment.reportId ? `/reports/${assessment.reportId}` : '#'} className='flex items-center cursor-pointer'>
                      <Eye className="mr-2 h-4 w-4" /> View Report
                      {!assessment.reportId && assessment.status !== 'draft' && ' (Missing)'}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/assessment/${assessment.id}/view`} className='flex items-center cursor-pointer'>
                      <Eye className="mr-2 h-4 w-4" /> View Assessment
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem
                className="text-red-600 focus:text-red-700 focus:bg-red-50 flex items-center cursor-pointer"
                onClick={() => openDeleteDialog(assessment)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], []);

  const table = useReactTable({
    data: assessments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  const statusOptions = ["all", ...assessmentStatusEnum.enumValues];

  const selectedStatusFilter = table.getColumn('status')?.getFilterValue() as string || "all";

  return (
    <>
      <div className="flex items-center py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Status: {capitalizeFirstLetter(selectedStatusFilter)}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statusOptions.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={selectedStatusFilter === status}
                onCheckedChange={() => {
                  const newFilterValue = status === "all" ? undefined : status;
                  table.getColumn('status')?.setFilterValue(newFilterValue);
                }}
              >
                {capitalizeFirstLetter(status)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No assessments found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the assessment
              "{assessmentToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAssessmentToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteAssessment}
              >
              Delete
              </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
