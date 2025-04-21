import React from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-white shadow-sm border-b border-neutral-200 h-16 flex items-center px-6">
      <Button
        variant="ghost"
        size="icon"
        className="mr-4 md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-6 w-6" />
      </Button>
      
      <h1 className="text-xl font-semibold">AI Transformation Assessment</h1>
      
      <div className="ml-auto flex items-center space-x-4">
        <Button variant="outline" size="sm" className="text-neutral-600">
          <span className="material-icons text-sm mr-1">help_outline</span>
          Help
        </Button>
      </div>
    </header>
  );
};

export default Header;
