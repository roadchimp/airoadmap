import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AiTool } from "@shared/schema";

const formSchema = z.object({
  tool_name: z.string().min(1, "Tool name is required"),
  primary_category: z.string().min(1, "Primary category is required"),
  license_type: z.enum(["Open Source", "Commercial", "Freemium", "Unknown"]),
  description: z.string().min(1, "Description is required"),
  website_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AIToolFormProps {
  initialData?: AiTool;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
}

const AIToolForm: React.FC<AIToolFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tool_name: initialData?.tool_name || "",
      primary_category: initialData?.primary_category || "",
      license_type: ["Open Source", "Commercial", "Freemium", "Unknown"].includes(initialData?.license_type ?? '') 
                      ? initialData?.license_type as FormData['license_type'] 
                      : "Unknown",
      description: initialData?.description || "",
      website_url: initialData?.website_url || "",
      tags: initialData?.tags?.join(", ") || "",
    },
  });

  return (
    <Form<FormData> {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="tool_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tool Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter tool name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="primary_category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Category</FormLabel>
              <FormControl>
                <Input placeholder="Enter primary category" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="license_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>License Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select license type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Open Source">Open Source</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Freemium">Freemium</SelectItem>
                  <SelectItem value="Unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter tool description"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="website_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website URL</FormLabel>
              <FormControl>
                <Input placeholder="Enter website URL (optional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter tags, separated by commas (optional)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? "Update" : "Create"} Tool
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AIToolForm; 