"use client";

import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoryFilterProps {
  allCategories: string[];
  selectedCategories: string[];
  onChange: (selected: string[]) => void;
}

export function CategoryFilter({
  allCategories,
  selectedCategories,
  onChange,
}: CategoryFilterProps) {

  const handleCheckboxChange = (category: string) => {
    const newSelectedCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    onChange(newSelectedCategories);
  };

  if (allCategories.length === 0) {
    return <p className="text-sm text-gray-500">No categories available for filtering.</p>;
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2 sm:mb-0">Filter by Category</h3>
        {selectedCategories.length > 0 && (
          <button 
            onClick={() => onChange([])} 
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear all filters
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {allCategories.map((category) => (
          <div key={category} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-md border border-gray-200">
            <Checkbox
              id={`category-${category}`}
              checked={selectedCategories.includes(category)}
              onCheckedChange={() => handleCheckboxChange(category)}
            />
            <Label htmlFor={`category-${category}`} className="font-normal cursor-pointer">
              {category}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
} 