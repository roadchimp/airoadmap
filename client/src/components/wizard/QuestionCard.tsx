import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RankingList from "./RankingList";

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
  error
}) => {
  return (
    <div className="mb-8 border-b border-neutral-200 pb-8 last:border-0">
      <Label htmlFor={questionId} className="block text-sm font-medium mb-1">
        {questionText}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      {guidanceText && (
        <p className="text-xs text-neutral-500 mb-3">{guidanceText}</p>
      )}
      
      {inputType === "text" && (
        <Input
          id={questionId}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full max-w-md"
        />
      )}
      
      {inputType === "textarea" && (
        <Textarea
          id={questionId}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full max-w-xl"
          rows={4}
        />
      )}
      
      {inputType === "rating" && (
        <div className="w-full max-w-md my-4">
          <Slider
            id={questionId}
            value={[value || 3]}
            onValueChange={(values) => onChange(values[0])}
            min={1}
            max={5}
            step={1}
          />
          <div className="flex justify-between mt-2 text-xs text-neutral-500">
            <span>1 (Low)</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5 (High)</span>
          </div>
        </div>
      )}
      
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
              className="w-full px-4 py-2 pr-10"
            />
            <span className="material-icons absolute right-3 top-2 text-neutral-400">search</span>
          </div>
          
          <div className="bg-neutral-50 border border-neutral-200 rounded-md">
            {options.map((option) => (
              <div key={option.id} className="p-3 border-b border-neutral-200 flex items-center last:border-0">
                <Checkbox
                  id={`${questionId}-${option.id}`}
                  checked={(value || []).includes(option.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...(value || []), option.id]);
                    } else {
                      onChange((value || []).filter((id: string | number) => id !== option.id));
                    }
                  }}
                />
                <div className="ml-3">
                  <div className="text-sm font-medium">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-neutral-500 mt-0.5">{option.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {inputType === "singleChoice" && options && (
        <RadioGroup
          value={value?.toString() || ""}
          onValueChange={(val) => onChange(val)}
          className="space-y-2"
        >
          {options.map((option) => (
            <div key={option.id} className="flex items-center">
              <RadioGroupItem value={option.value.toString()} id={`${questionId}-${option.id}`} />
              <Label htmlFor={`${questionId}-${option.id}`} className="ml-2">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}
      
      {inputType === "multipleChoice" && options && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {options.map((option) => (
            <label 
              key={option.id}
              className="flex items-center p-3 bg-neutral-50 border border-neutral-300 rounded-md cursor-pointer hover:bg-neutral-100"
            >
              <Checkbox
                id={`${questionId}-${option.id}`}
                checked={(value || []).includes(option.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onChange([...(value || []), option.id]);
                  } else {
                    onChange((value || []).filter((id: string | number) => id !== option.id));
                  }
                }}
              />
              <span className="ml-2 text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default QuestionCard;
