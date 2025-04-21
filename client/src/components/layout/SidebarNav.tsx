import React from "react";
import { Link, useLocation } from "wouter";

interface SidebarNavProps {
  onClose?: () => void;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ onClose }) => {
  const [location] = useLocation();
  
  // Helper to determine if a link is active
  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };
  
  return (
    <div className="w-64 bg-white shadow-lg h-full flex flex-col border-r border-neutral-200 z-10">
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-500 rounded-md flex items-center justify-center">
            <span className="material-icons text-white text-xl">insights</span>
          </div>
          <div>
            <h1 className="font-semibold text-lg">AI Prioritize</h1>
            <p className="text-xs text-neutral-500">Transformation Tool</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-grow py-6 px-3">
        <div className="space-y-1">
          <Link href="/" onClick={onClose}>
            <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              isActive('/') && !location.startsWith('/assessment')
                ? 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}>
              <span className="material-icons mr-3 text-neutral-500">dashboard</span>
              Dashboard
            </a>
          </Link>
          
          <Link href="/assessment/new" onClick={onClose}>
            <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              location.startsWith('/assessment')
                ? 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}>
              <span className="material-icons mr-3 text-neutral-500">assignment</span>
              New Assessment
            </a>
          </Link>
          
          <Link href="/reports" onClick={onClose}>
            <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              location.startsWith('/reports')
                ? 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}>
              <span className="material-icons mr-3 text-neutral-500">history</span>
              Previous Reports
            </a>
          </Link>
          
          <Link href="/library" onClick={onClose}>
            <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              location.startsWith('/library')
                ? 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}>
              <span className="material-icons mr-3 text-neutral-500">library_books</span>
              Libraries
            </a>
          </Link>
        </div>
      </nav>
      
      <div className="p-4 border-t border-neutral-200">
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
