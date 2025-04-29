'use client'; // This layout uses state, so it must be a Client Component

import React, { useState } from "react";
// Assuming SidebarNav and Header will also be moved to app/components/layout
import SidebarNav from "./SidebarNav"; 
import Header from "./Header";
// Adjust theme provider import if needed, assuming it's globally available or passed via context
import { useTheme } from "next-themes"; 

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { theme } = useTheme(); // useTheme works in client components
  
  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };
  
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <SidebarNav onClose={() => setMobileSidebarOpen(false)} />
      </div>
      
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      
      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={toggleMobileSidebar} />
        <main className="flex-1 overflow-y-auto text-foreground">
          {children} 
        </main>
      </div>
    </div>
  );
};

export default AppLayout; 