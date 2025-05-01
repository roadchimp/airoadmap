import React from "react";
import { Menu } from "lucide-react";import { Button } from "@/components/ui/button";

const Header = () => {

  return (
    <header className="bg-white border-b border-gray-200 h-16 w-full flex items-center justify-between px-4 md:px-6">
    {/* Title on the left */}
    <div>
      <h1 className="text-xl font-bold text-gray-900">AI Transformation Assessment</h1>
    </div>

    {/* Button on the far right */}
    <div className="flex items-center space-x-4">
      <Button
        variant="outline"
        size="sm"
      >
        {/* SVG Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4" // Added margin-right to space icon from text
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2} // Ensure strokeWidth is applied
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            // This path corresponds to the question mark in a circle icon
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Help
      </Button>
      </div>
    </header>
  );
};

export default Header; 