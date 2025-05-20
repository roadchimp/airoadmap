'use client'; 

import React, { useState } from "react";
import SidebarNav from "./SidebarNav"; // Adjust path if needed
import Header from "./Header";         // Adjust path if needed
import { useTheme } from "next-themes"; 
import { AuthProvider } from "@/hooks/UseAuth"; // Add this import

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // const { theme } = useTheme(); // Keep if used

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };  

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  return (
    <AuthProvider> {/* Wrap the entire layout with AuthProvider */}
      <div className="flex h-screen bg-background text-foreground">
        
        {/* 2. Sidebar Container: Handles mobile overlay AND desktop layout */}
        {/*    - Mobile: fixed, transformed */}
        {/*    - Desktop (md:): relative, fixed width, takes full height */}
        <div 
          className={`
            fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? 'w-16' : 'w-64'} bg-card shadow-md
            transform transition-transform duration-300 ease-in-out 
            md:relative md:translate-x-0 md:inset-y-auto md:h-full 
            ${ mobileSidebarOpen ? "translate-x-0" : "-translate-x-full" }
          `}
        >
          {/* SidebarNav needs internal flex-col h-full structure */}
          <SidebarNav 
            onClose={() => setMobileSidebarOpen(false)} 
            collapsed={sidebarCollapsed} 
            onToggleCollapse={toggleSidebarCollapse}
          /> 
        </div>

        {/* Mobile backdrop (keep as is) */}
        {mobileSidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* 3. Right Side Container: Fills remaining horizontal space, stacks Header + Main vertically */}
        <div className="flex-1 flex flex-col overflow-hidden"> {/* flex-1 takes horizontal space, flex-col stacks vertically */}
          
          {/* 4. Header Component: Sits at the top of the right side */}
          {/*    Header itself likely has h-16, border-b, bg-white etc. */}
          <Header /> 
          
          {/* 5. Main Content Area: Fills remaining vertical space below Header, scrolls internally */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6"> {/* flex-1 takes vertical space, scrolls */}
            {children} 
          </main>
          
        </div> {/* End Right Side Container */}
        
      </div> // End Outermost container
    </AuthProvider>
  );
};

export default AppLayout;

// --- Reminder: SidebarNav.tsx structure ---
// Ensure the root element inside SidebarNav has `flex flex-col h-full`
// Ensure the navigation area has `overflow-y-auto` (or similar scrolling mechanism)
// Ensure the profile section has `mt-auto` to stick to the bottom.
// Example structure was provided in the previous answer. 
