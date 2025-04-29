import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AiTool, AiToolFormData } from "@shared/schema";
import AIToolForm from "./AIToolForm";

interface AIToolDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AiToolFormData) => void;
  initialData?: AiTool | null; // Allow null as well
}

const AIToolDialog: React.FC<AIToolDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const handleSubmit = (data: any) => {
    // Convert comma-separated tags string to array
    const formattedData: AiToolFormData = {
      ...data,
      // Ensure tags is always an array, even if input is empty/null
      tags: typeof data.tags === 'string' 
            ? data.tags.split(",").map((tag: string) => tag.trim()).filter(Boolean) 
            : [], 
    };
    // Remove potential empty strings or null values if API expects undefined
    // Example: (could be more specific based on schema)
    Object.keys(formattedData).forEach(key => {
      if ((formattedData as any)[key] === '') {
        (formattedData as any)[key] = undefined; 
      }
    });

    onSubmit(formattedData); // Pass the correctly typed and processed data
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