// src/components/assessment/CurrentAssessmentsTable.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
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
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Assessment } from '@shared/schema'; // Import the Assessment type
import { useToast } from "@/hooks/use-toast"; // For user feedback

// Define a type that includes the reportId ---
// This type should ideally match the data structure returned by your updated server-side fetch
type AssessmentWithReportId = Assessment & {
    reportId?: number | null; // Add optional reportId
    title?: string;
  };

interface CurrentAssessmentsTableProps {
  initialAssessments: AssessmentWithReportId[];
}

export default function CurrentAssessmentsTable({ initialAssessments }: CurrentAssessmentsTableProps) {
  const [assessments, setAssessments] = useState<AssessmentWithReportId[]>(initialAssessments);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<AssessmentWithReportId | null>(null);
  const router = useRouter();
  const { toast } = useToast();


  const handleDeleteAssessment = async () => {
    if (!assessmentToDelete) return;

    console.log(`Attempting to delete assessment: ${assessmentToDelete.id}`);
    // Replace with your actual API endpoint call
    // try {
    //   const response = await fetch(`/api/assessment/${assessmentToDelete.id}`, {
    //     method: 'DELETE',
    //   });
    //   if (!response.ok) {
    //     throw new Error('Failed to delete assessment');
    //   }
    //   setAssessments(assessments.filter(a => a.id !== assessmentToDelete.id));
    //   toast({ title: "Success", description: "Assessment deleted." });
    // } catch (error) {
    //   console.error("Error deleting assessment:", error);
    //   toast({ title: "Error", description: "Could not delete assessment.", variant: "destructive" });
    // } finally {
    //   setIsDeleteDialogOpen(false);
    //   setAssessmentToDelete(null);
    //   // Optionally refresh server data if needed, though client-side removal is faster UI feedback
    //   // router.refresh();
    // }

    // --- Placeholder Logic ---
    setAssessments(assessments.filter(a => a.id !== assessmentToDelete.id));
     toast({ title: "Success (Placeholder)", description: `Assessment '${assessmentToDelete.title}' deleted.` });
     setIsDeleteDialogOpen(false);
     setAssessmentToDelete(null);
     // --- End Placeholder ---
  };

  const openDeleteDialog = (assessment: AssessmentWithReportId) => {
    setAssessmentToDelete(assessment);
    setIsDeleteDialogOpen(true);
  };

  const columns: ColumnDef<AssessmentWithReportId>[] = useMemo(() => [
    {
      accessorKey: 'title',
      header: 'Assessment Title',
      cell: ({ row }) => <div className="font-medium">{row.getValue('title')}</div>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => row.getValue('status'),
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
        const canEdit = assessment.status === 'draft'; // Only allow editing drafts

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
                 <DropdownMenuItem asChild disabled={!assessment.reportId}>
                   <Link href={assessment.reportId ? `/reports/${assessment.reportId}` : '#'} className='flex items-center cursor-pointer'>

                    <Eye className="mr-2 h-4 w-4" /> View Report
                    {!assessment.reportId && assessment.status !== 'draft' && ' (Missing)'}
                   </Link>
                 </DropdownMenuItem>
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
  ], [assessments]); // Recompute columns if assessment data changes

  const table = useReactTable({
    data: assessments,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
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
                  No assessments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
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
