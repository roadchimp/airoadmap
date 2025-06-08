'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSession } from '@/lib/session/SessionContext';
import {
  OrganizationBasics,
  WizardStep,
} from '@/lib/session/sessionTypes';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const basicInfoSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  industry: z.string().min(1, 'Industry is required'),
  size: z.string().min(1, 'Company size is required'),
  description: z.string().optional(),
});

const BasicInfoStep = () => {
  const { session, setStepData } = useSession();
  const currentStepIndex = WizardStep.ORGANIZATION_INFO;
  const stepData = session.steps[currentStepIndex]?.data.basics || {};

  const form = useForm<OrganizationBasics>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: stepData,
    mode: 'onChange',
  });

  const { control, watch } = form;

  React.useEffect(() => {
    const subscription = watch((value) => {
      const isValid = basicInfoSchema.safeParse(value).success;
      setStepData(currentStepIndex, { basics: value as OrganizationBasics }, isValid);
    });
    return () => subscription.unsubscribe();
  }, [watch, setStepData, currentStepIndex]);

  const industryOptions = [
    { value: 'Software & Technology', label: 'Software & Technology' },
    { value: 'Finance & Banking', label: 'Finance & Banking' },
    { value: 'Healthcare', label: 'Healthcare' },
    { value: 'Retail & E-commerce', label: 'Retail & E-commerce' },
  ];

  const companySizeOptions = [
    { value: 'Small (1-50 employees)', label: 'Small (1-50 employees)' },
    { value: 'Medium (51-500 employees)', label: 'Medium (51-500 employees)' },
    { value: 'Large (501-5000 employees)', label: 'Large (501-5000 employees)' },
    { value: 'Enterprise (5000+ employees)', label: 'Enterprise (5000+ employees)' },
  ];

  return (
    <Form {...form}>
      <div className="space-y-6">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name*</FormLabel>
              <FormControl>
                <Input placeholder="Your Company LLC" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="industry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Industry*</FormLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                {industryOptions.map((option) => (
                  <Label
                    key={option.value}
                    className="flex items-center space-x-2 p-3 border rounded-md has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300 cursor-pointer"
                  >
                    <FormControl>
                      <Checkbox
                        checked={field.value === option.value}
                        onCheckedChange={(checked) => {
                          if (checked) field.onChange(option.value);
                        }}
                      />
                    </FormControl>
                    <span>{option.label}</span>
                  </Label>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Size*</FormLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                {companySizeOptions.map((option) => (
                  <Label
                    key={option.value}
                    className="flex items-center space-x-2 p-3 border rounded-md has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300 cursor-pointer"
                  >
                    <FormControl>
                       <Checkbox
                        checked={field.value === option.value}
                        onCheckedChange={(checked) => {
                          if (checked) field.onChange(option.value);
                        }}
                      />
                    </FormControl>
                    <span>{option.label}</span>
                  </Label>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your company in a few sentences."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
};

export default BasicInfoStep; 