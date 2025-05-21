'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ReportSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId?: number; // reportId might be used for fetching/saving settings
}

export function ReportSettingsModal({
  isOpen,
  onClose,
  reportId,
}: ReportSettingsModalProps) {
  if (!isOpen) return null;

  const handleSaveChanges = () => {
    // TODO: Implement logic to save report settings
    console.log("Saving report settings for reportId:", reportId);
    onClose(); // Close modal after saving
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="report-name-modal" className="text-right">
              Report Name
            </Label>
            {/* Example setting: Report Name - This would need state and props to be fully functional */}
            <Input id="report-name-modal" defaultValue={`Report ID: ${reportId || 'N/A'}`} className="col-span-3" readOnly />
          </div>
          <p className="text-sm text-gray-500 col-span-4">
            More settings will be available here. (e.g., sharing permissions, default filters, etc.)
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 