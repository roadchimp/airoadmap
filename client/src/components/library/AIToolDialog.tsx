import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AITool } from "@shared/schema";
import AIToolForm from "./AIToolForm";

interface AIToolDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<AITool, "id" | "created_at" | "updated_at">) => void;
  initialData?: AITool;
}

const AIToolDialog: React.FC<AIToolDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const handleSubmit = (data: any) => {
    // Convert comma-separated tags string to array
    const formattedData = {
      ...data,
      tags: data.tags ? data.tags.split(",").map((tag: string) => tag.trim()) : [],
    };
    onSubmit(formattedData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit" : "Add"} AI Tool
          </DialogTitle>
        </DialogHeader>
        <AIToolForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AIToolDialog; 