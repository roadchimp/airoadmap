'use client';

import React from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
// Assuming useTheme comes from next-themes, as configured in root layout
import { useTheme } from "next-themes"; 

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { theme } = useTheme(); // This hook requires a Client Component

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 md:px-6">
      <div className="hidden md:block">
        <h1 className="text-xl font-bold text-gray-900">AI Transformation Assessment</h1>
      </div>
      
      <div className="ml-auto flex items-center space-x-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-gray-600 bg-white border-gray-300 hover:bg-gray-50 text-sm font-medium flex items-center"
        >
          Help
          <svg className="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </Button>
      </div>
    </header>
  );
};

export default Header; 