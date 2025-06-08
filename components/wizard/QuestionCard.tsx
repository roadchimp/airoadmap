'use client';

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RankingList from "./RankingList";
import { cn } from "@/lib/session/utils";

export type QuestionInputType = 
  | "text" 
  | "textarea" 
  | "rating" 
  | "ranking" 
  | "roleSelector" 
  | "singleChoice" 
  | "multipleChoice";

export interface QuestionOption {
  id: string | number;
  label: string;
  value: string | number;
  description?: string;
}

interface QuestionCardProps {
  questionId: string;
  questionText: string;
  guidanceText?: string;
  inputType: QuestionInputType;
  value: any;
  onChange: (value: any) => void;
  options?: QuestionOption[];
  isRequired?: boolean;
  error?: string;
  min?: number;
  max?: number;
  labels?: string[];
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  questionId,
  questionText,
  guidanceText,
  inputType,
  value,
  onChange,
  options = [],
  isRequired = false,
  error,
  min = 1,
  max = 5,
  labels = []
}: QuestionCardProps) => {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  
  const renderRatingInput = () => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between">
          {labels.map((label, i) => (
            <div key={i} className="text-sm text-slate-600 text-center flex-1">
              {label}
            </div>
          ))}
        </div>
        <div className="flex justify-between gap-2">
          {steps.map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => onChange(step)}
              className={cn(
                "flex-1 h-12 rounded-md border transition-colors font-medium",
                value === step
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-slate-700 border-slate-200 hover:border-primary/50 hover:bg-slate-50"
              )}
            >
              {step}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mb-8 pb-8 border-b border-slate-200 last:border-0 last:pb-0 last:mb-0">
      <Label className="block text-base font-medium text-slate-900 mb-2">
        {questionText}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      {guidanceText && (
        <p className="text-sm text-slate-500 mb-4">{guidanceText}</p>
      )}
      
      {inputType === "text" && (
        <Input
          value={value || ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          className="w-full max-w-md border-slate-300 focus:border-primary focus:ring-primary"
        />
      )}
      
      {inputType === "textarea" && (
        <Textarea
          value={value || ""}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          className="w-full max-w-xl border-slate-300 focus:border-primary focus:ring-primary"
          rows={4}
        />
      )}
      
      {inputType === "rating" && renderRatingInput()}
      
      {inputType === "ranking" && options && (
        <RankingList
          items={options}
          value={value || []}
          onChange={onChange}
        />
      )}
      
      {inputType === "roleSelector" && options && (
        <div className="space-y-4">
          <div className="relative mb-4">
            <Input
              placeholder="Search for roles..."
              className="w-full px-4 py-2 pr-10 border-slate-300"
            />
            <svg 
              className="absolute right-3 top-2.5 text-slate-400 h-5 w-5" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          </div>
          
          <div className="bg-slate-50 border border-slate-200 rounded-md divide-y divide-slate-200">
            {options.map((option) => (
              <Label key={option.id} className="p-4 flex items-center font-normal cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="mr-3 flex-shrink-0">
                  <Checkbox
                    checked={(value || []).includes(option.id)}
                    onCheckedChange={(checked: boolean | string) => {
                      const isChecked = checked === true;
                      if (isChecked) {
                        onChange([...(value || []), option.id]);
                      } else {
                        onChange((value || []).filter((id: string | number) => id !== option.id));
                      }
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-900">{option.label}</div>
                  {option.description && (
                    <div className="mt-1 text-xs text-slate-500">{option.description}</div>
                  )}
                </div>
              </Label>
            ))}
          </div>
        </div>
      )}
      
      {inputType === "singleChoice" && options && (
        <RadioGroup
          value={value?.toString() || ""}
          onValueChange={(val: string) => onChange(val)}
          className="space-y-3"
        >
          {options.map((option) => (
            <div key={option.id} className="option-card">
              <RadioGroupItem id={option.id.toString()} value={option.value.toString()} className="mr-3" />
              <Label htmlFor={option.id.toString()} className="flex-1 cursor-pointer font-normal">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}
      
      {inputType === "multipleChoice" && options && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {options.map((option) => (
            <div 
              key={option.id}
              className={cn(
                "option-card",
                (value || []).includes(option.id) && "selected"
              )}
            >
              <Checkbox
                id={option.id.toString()}
                checked={(value || []).includes(option.id)}
                onCheckedChange={(checked: boolean | string) => {
                  const isChecked = checked === true;
                  if (isChecked) {
                    onChange([...(value || []), option.id]);
                  } else {
                    onChange((value || []).filter((id: string | number) => id !== option.id));
                  }
                }}
                className="mr-3"
              />
              <Label htmlFor={option.id.toString()} className="flex-1 cursor-pointer font-normal">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      )}
      
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default QuestionCard;
