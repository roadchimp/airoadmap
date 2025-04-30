import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AiTool, AiToolFormData, InsertAiTool } from "@shared/schema";
import AIToolForm from "./AIToolForm";

interface AIToolDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<InsertAiTool>) => void;
  initialData?: AiTool | null; // Allow null as well
}

const AIToolDialog: React.FC<AIToolDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const handleSubmit = (formData: any) => {
    // Convert comma-separated tags string to array, default to empty array
    const tagsArray = typeof formData.tags === 'string' 
                      ? formData.tags.split(",").map((tag: string) => tag.trim()).filter(Boolean) 
                      : [];

    // Construct the data object conforming to Partial<InsertAiTool>
    const submitData: Partial<InsertAiTool> = {
      tool_name: formData.tool_name || undefined,
      primary_category: formData.primary_category || undefined,
      license_type: formData.license_type || undefined,
      description: formData.description || undefined,
      website_url: formData.website_url || undefined,
      tags: tagsArray,
    };
    
    // Remove undefined properties before submitting
    Object.keys(submitData).forEach(key => {
      if ((submitData as any)[key] === undefined) {
        delete (submitData as any)[key];
      }
    });

    onSubmit(submitData); // Pass the correctly typed data
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