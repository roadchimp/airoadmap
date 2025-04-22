import React from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ui/theme-provider";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { theme } = useTheme();

  return (
    <header className="bg-background shadow-sm border-b border-border h-16 flex items-center px-6">
      <Button
        variant="ghost"
        size="icon"
        className="mr-4 md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-6 w-6" />
      </Button>
      
      <h1 className="text-xl font-semibold text-foreground">AI Transformation Assessment</h1>
      
      <div className="ml-auto flex items-center space-x-4">
        <Button variant="outline" size="sm" className="text-muted-foreground">
          <span className="material-icons text-sm mr-1">help_outline</span>
          Help
        </Button>
      </div>
    </header>
  );
};

export default Header;
