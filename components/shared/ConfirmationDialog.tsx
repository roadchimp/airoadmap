'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  // AlertDialogTrigger, // Usually triggered externally via isOpen prop
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ConfirmationDialogProps {
  /** Controls whether the dialog is open or closed. */
  isOpen: boolean;
  /** Function called when the dialog should be closed (e.g., clicking Cancel or overlay). */
  onClose: () => void;
  /** Function called when the confirmation action is triggered. */
  onConfirm: () => void;
  /** The title text displayed in the dialog header. */
  title: string;
  /** The descriptive text displayed in the dialog body. */
  description: React.ReactNode; // Allow ReactNode for potentially richer descriptions
  /** Optional text for the confirmation button (defaults to "Confirm"). */
  confirmText?: string;
  /** Optional text for the cancel button (defaults to "Cancel"). */
  cancelText?: string;
  /** Optional variant for the confirmation button (defaults to "destructive"). */
  confirmVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

/**
 * A reusable confirmation dialog component built using Shadcn UI AlertDialog.
 */
const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "destructive",
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}> 
      {/* <AlertDialogTrigger asChild> 
         // Usually, the trigger is outside this component, controlling the isOpen state
         <Button variant="outline">Show Dialog</Button> 
       </AlertDialogTrigger> */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
             <Button variant="outline" onClick={onClose}>{cancelText}</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
             <Button variant={confirmVariant} onClick={onConfirm}>{confirmText}</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationDialog; 