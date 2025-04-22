import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/components/ui/theme-provider";

interface SidebarNavProps {
  onClose?: () => void;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ onClose }) => {
  const location = useLocation();
  const { theme } = useTheme();
  
  // Helper to determine if a link is active
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };
  
  return (
    <div className="w-64 bg-background shadow-lg h-full flex flex-col border-r border-border z-10">
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="material-icons text-primary-foreground text-xl">insights</span>
          </div>
          <div>
            <h1 className="font-semibold text-lg text-foreground">AI Prioritize</h1>
            <p className="text-xs text-muted-foreground">Transformation Tool</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-grow py-6 px-3">
        <div className="space-y-1">
          <Link to="/dashboard" onClick={onClose} className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
            isActive('/dashboard')
              ? 'bg-primary/10 text-primary hover:bg-primary/20'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}>
            <span className="material-icons mr-3">dashboard</span>
            Dashboard
          </Link>
          
          <Link to="/assessment/new" onClick={onClose} className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
            isActive('/assessment')
              ? 'bg-primary/10 text-primary hover:bg-primary/20'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}>
            <span className="material-icons mr-3">assignment</span>
            New Assessment
          </Link>
          
          <Link to="/reports" onClick={onClose} className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
            isActive('/reports')
              ? 'bg-primary/10 text-primary hover:bg-primary/20'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}>
            <span className="material-icons mr-3">history</span>
            Previous Reports
          </Link>
          
          <Link to="/library" onClick={onClose} className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
            isActive('/library')
              ? 'bg-primary/10 text-primary hover:bg-primary/20'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}>
            <span className="material-icons mr-3">library_books</span>
            Libraries
          </Link>
        </div>
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center">
            <span className="material-icons text-neutral-600 text-sm">person</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Consultant User</p>
            <p className="text-xs text-neutral-500">consultant@example.com</p>
          </div>
          <button className="ml-auto text-neutral-400 hover:text-neutral-600">
            <span className="material-icons text-sm">logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SidebarNav;
