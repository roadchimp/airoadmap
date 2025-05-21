"use client";

import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoryFilterProps {
  allUniqueCategories: string[];
  selectedCategories: string[];
  onCategoryChange: (selected: string[]) => void;
}

export function CategoryFilter({
  allUniqueCategories,
  selectedCategories,
  onCategoryChange,
}: CategoryFilterProps) {

  const handleCheckboxChange = (category: string) => {
    const newSelectedCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    onCategoryChange(newSelectedCategories);
  };

  if (allUniqueCategories.length === 0) {
    return <p className="text-sm text-gray-500">No categories available for filtering.</p>;
  }

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg">Filter by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-60 pr-3">
          <div className="space-y-2">
            {allUniqueCategories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
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
        </ScrollArea>
        {selectedCategories.length > 0 && (
          <button 
            onClick={() => onCategoryChange([])} 
            className="mt-4 text-sm text-blue-600 hover:text-blue-800 w-full text-left"
          >
            Clear all filters
          </button>
        )}
      </CardContent>
    </Card>
  );
} 