'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit3Icon, Share2Icon, Settings2Icon, CheckIcon, XIcon } from 'lucide-react';

interface ReportHeaderProps {
  initialReportTitle: string;
  onUpdateTitle: (newTitle: string) => Promise<void>; 
  onOpenSettings: () => void;
}

export function ReportHeader({
  initialReportTitle,
  onUpdateTitle,
  onOpenSettings,
}: ReportHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(initialReportTitle);

  useEffect(() => {
    setCurrentTitle(initialReportTitle);
  }, [initialReportTitle]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    await onUpdateTitle(currentTitle);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentTitle(initialReportTitle); // Reset to original
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 print:hidden">
      <div className="flex items-center gap-2">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSave()}
              className="text-2xl font-bold h-10"
              autoFocus
            />
            <Button variant="ghost" size="icon" onClick={handleSave} className="text-green-600 hover:text-green-700">
              <CheckIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCancel} className="text-red-600 hover:text-red-700">
              <XIcon className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <h1 className="text-3xl font-bold leading-tight text-gray-900 print:text-2xl flex items-center">
            {currentTitle}
            <Button variant="ghost" size="icon" onClick={handleEdit} className="ml-2">
              <Edit3Icon className="h-5 w-5" />
            </Button>
          </h1>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {/* <Button variant="outline" size="sm"><Share2Icon className="h-4 w-4 mr-2" /> Share</Button> */}
        {/* Share functionality can be added here */}
        <Button variant="outline" size="sm" onClick={onOpenSettings}>
          <Settings2Icon className="h-4 w-4 mr-2" /> Report Settings
        </Button>
      </div>
    </div>
  );
} 