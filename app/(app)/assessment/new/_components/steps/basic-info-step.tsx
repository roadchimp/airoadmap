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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

const basicInfoSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  reportName: z.string().optional(),
  industry: z.string().min(1, 'Industry is required'),
  industryMaturity: z.enum(['Mature', 'Immature']).optional(),
  companyStage: z.enum(['Startup', 'Early Growth', 'Scaling', 'Mature']).optional(),
  size: z.string().min(1, 'Company size is required'),
  strategicFocus: z.array(z.string()).optional(),
  keyBusinessGoals: z.string().optional(),
  keyStakeholders: z.array(z.string()).optional(),
  description: z.string().optional(),
});

const BasicInfoStep = () => {
  const { session, setStepData } = useSession();
  const currentStepIndex = WizardStep.ORGANIZATION_INFO;
  const stepData = session.steps[currentStepIndex]?.data.basics || {};

  const [showCompanyStageHint, setShowCompanyStageHint] = React.useState(false);

  // Ensure all form fields have proper default values to prevent controlled/uncontrolled warnings
  const defaultValues: OrganizationBasics = {
    name: stepData.name || '',
    reportName: stepData.reportName || '',
    industry: stepData.industry || '',
    size: stepData.size || '',
    description: stepData.description || '',
    industryMaturity: stepData.industryMaturity || 'Mature',
    companyStage: stepData.companyStage || 'Startup',
    strategicFocus: stepData.strategicFocus || [],
    keyBusinessGoals: stepData.keyBusinessGoals || '',
    keyStakeholders: stepData.keyStakeholders || [],
  };

  const form = useForm<OrganizationBasics>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { control, watch } = form;

  // Use a ref to store the setStepData function to avoid dependency issues
  const setStepDataRef = React.useRef(setStepData);
  setStepDataRef.current = setStepData;

  React.useEffect(() => {
    const subscription = watch((value) => {
      const isValid = basicInfoSchema.safeParse(value).success;
      setStepDataRef.current(currentStepIndex, { basics: value as OrganizationBasics }, isValid);
    });
    return () => subscription.unsubscribe();
  }, [watch, currentStepIndex]);

  const industryOptions = [
    'Software & Technology',
    'Finance & Banking',
    'Healthcare',
    'Retail & E-commerce',
    'Manufacturing',
    'Professional Services',
    'Education',
    'Media & Entertainment',
    'Other'
  ];

  const companySizeOptions = [
    'Small (1-50 employees)',
    'Medium (51-500 employees)',
    'Large (501-5000 employees)',
    'Enterprise (5000+ employees)',
  ];

  const strategicFocusOptions = [
    'Efficiency & Productivity',
    'Cost Reduction',
    'Revenue Growth',
    'Customer Experience',
    'Innovation & New Products',
    'Operational Excellence',
    'Data-Driven Decision Making',
    'Talent & Workforce Development'
  ];

  const stakeholderOptions = [
    'Executive Leadership',
    'Technology',
    'Operations',
    'Finance',
    'Human Resources',
    'Sales & Marketing',
    'Investment',
    'Risk & Compliance',
    'Legal'
  ];

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Organization Name */}
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name*</FormLabel>
              <FormControl>
                <Input placeholder="Your Company LLC" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Report Name */}
        <FormField
          control={control}
          name="reportName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assessment Name</FormLabel>
              <FormControl>
                <Input placeholder="Q1 2024 AI Assessment" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Industry */}
        <FormField
          control={control}
          name="industry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Industry*</FormLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                {industryOptions.map((option) => (
                  <Label
                    key={option}
                    className="flex items-center space-x-2 p-3 border rounded-md has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300 cursor-pointer"
                  >
                    <FormControl>
                      <Checkbox
                        checked={field.value === option}
                        onCheckedChange={(checked) => {
                          if (checked) field.onChange(option);
                        }}
                      />
                    </FormControl>
                    <span>{option}</span>
                  </Label>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Industry Maturity */}
        <FormField
          control={control}
          name="industryMaturity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Industry Maturity*</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry maturity..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Mature">Mature</SelectItem>
                  <SelectItem value="Immature">Immature</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-gray-600 mt-2">
                <p><strong>Mature Industry:</strong> An industry that has reached a stable, established phase with slow or minimal growth, high competition, and a well-defined customer base, often focusing on efficiency and cost control rather than rapid expansion.</p>
                <p className="mt-2"><strong>Immature Industry:</strong> An industry that is still in its early or growth phases, characterized by rapid innovation, high growth rates, emerging customer bases, and frequent entry of new competitors as the market is still developing and evolving.</p>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Company Stage */}
        <FormField
          control={control}
          name="companyStage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Stage*</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company stage..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Startup">Startup</SelectItem>
                  <SelectItem value="Early Growth">Early Growth</SelectItem>
                  <SelectItem value="Scaling">Scaling</SelectItem>
                  <SelectItem value="Mature">Mature</SelectItem>
                </SelectContent>
              </Select>
              
              <Collapsible open={showCompanyStageHint} onOpenChange={setShowCompanyStageHint}>
                <CollapsibleTrigger className="flex items-center text-sm text-red-600 hover:text-red-800 mt-2">
                  Hint: Details for each company stage
                  {showCompanyStageHint ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <Card>
                    <CardContent className="p-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-3 font-medium text-gray-600">STAGE</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-600">TYPICAL ANNUAL REVENUE</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-600">TYPICAL EMPLOYEE COUNT</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-600">OPERATIONAL/AI CHARACTERISTICS</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="py-2 px-3">Startup</td>
                              <td className="py-2 px-3">$0 – $1M</td>
                              <td className="py-2 px-3">1–10</td>
                              <td className="py-2 px-3">Founder-led, manual ops, ad hoc, early AI pilots</td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-2 px-3">Early Growth</td>
                              <td className="py-2 px-3">$1M – $10M</td>
                              <td className="py-2 px-3">10–50</td>
                              <td className="py-2 px-3">First sales/CS hires, basic automation, track CAC</td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-2 px-3">Scaling</td>
                              <td className="py-2 px-3">$10M – $50M+</td>
                              <td className="py-2 px-3">50–250</td>
                              <td className="py-2 px-3">Multiple teams, advanced analytics, AI scaling</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3">Mature</td>
                              <td className="py-2 px-3">$50M – $500M+ (or IPO)</td>
                              <td className="py-2 px-3">250–1000+</td>
                              <td className="py-2 px-3">Fully built org, heavy automation, AI everywhere</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Company Size */}
        <FormField
          control={control}
          name="size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Size*</FormLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                {companySizeOptions.map((option) => (
                  <Label
                    key={option}
                    className="flex items-center space-x-2 p-3 border rounded-md has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300 cursor-pointer"
                  >
                    <FormControl>
                       <Checkbox
                        checked={field.value === option}
                        onCheckedChange={(checked) => {
                          if (checked) field.onChange(option);
                        }}
                      />
                    </FormControl>
                    <span>{option}</span>
                  </Label>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Strategic Focus */}
        <FormField
          control={control}
          name="strategicFocus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Strategic Focus (select all that apply)</FormLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                {strategicFocusOptions.map((option) => (
                  <Label
                    key={option}
                    className="flex items-center space-x-2 p-3 border rounded-md has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300 cursor-pointer"
                  >
                    <FormControl>
                      <Checkbox
                        checked={field.value?.includes(option) || false}
                        onCheckedChange={(checked) => {
                          const currentValue = field.value || [];
                          if (checked) {
                            field.onChange([...currentValue, option]);
                          } else {
                            field.onChange(currentValue.filter(v => v !== option));
                          }
                        }}
                      />
                    </FormControl>
                    <span>{option}</span>
                  </Label>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Select the strategic focus areas for your AI initiatives.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Key Business Goals */}
        <FormField
          control={control}
          name="keyBusinessGoals"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Key Business Goals for AI (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe key business goals AI could address..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Key Stakeholders */}
        <FormField
          control={control}
          name="keyStakeholders"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Key Stakeholders (select all that apply)</FormLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                {stakeholderOptions.map((option) => (
                  <Label
                    key={option}
                    className="flex items-center space-x-2 p-3 border rounded-md has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300 cursor-pointer"
                  >
                    <FormControl>
                      <Checkbox
                        checked={field.value?.includes(option) || false}
                        onCheckedChange={(checked) => {
                          const currentValue = field.value || [];
                          if (checked) {
                            field.onChange([...currentValue, option]);
                          } else {
                            field.onChange(currentValue.filter(v => v !== option));
                          }
                        }}
                      />
                    </FormControl>
                    <span>{option}</span>
                  </Label>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Select the key stakeholders involved in this assessment.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
};

export default BasicInfoStep; 