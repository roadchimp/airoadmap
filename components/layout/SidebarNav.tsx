'use client';

import React from "react";
// Use next/link for navigation
import Link from "next/link"; 
// Use next/navigation for checking active path
import { usePathname } from 'next/navigation'; 
import { useTheme } from "next-themes";
// Assuming Logo component exists and path is correct
// import { Logo } from "@/components/ui/logo"; 

interface SidebarNavProps {
  onClose?: () => void; // For closing mobile sidebar
}

const SidebarNav: React.FC<SidebarNavProps> = ({ onClose }) => {
  const pathname = usePathname(); // Get current path
  const { theme } = useTheme();
  
  // Updated helper to use pathname
  const isActive = (path: string) => {
    // Check if the current pathname starts with the link path
    // Handle root path explicitly if needed
    return pathname === path || (path !== '/' && pathname.startsWith(path));
  };
  
  return (
    <div className="w-64 bg-white h-full flex flex-col border-r border-gray-200">
      {/* Logo and App Title */}
      <div className="p-4 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-500 rounded flex items-center justify-center">
            <svg 
              className="w-6 h-6 text-white" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M7 16L10 13M10 13L13 16M10 13V20M20 17.5V11C20 7.134 16.866 4 13 4C9.134 4 6 7.134 6 11V17.5C6 19.433 7.567 21 9.5 21H16.5C18.433 21 20 19.433 20 17.5Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg">AI Prioritize</h1>
            <p className="text-xs text-gray-500">Transformation Tool</p>
          </div>
        </Link>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-grow py-6 px-3 space-y-1">
        {/* Dashboard */}
        <Link 
          href="/dashboard" 
          onClick={onClose} 
          className={`flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors ${
            isActive('/dashboard')
              ? 'text-gray-700'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <svg className="mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
          </svg>
          Dashboard
        </Link>
        
        {/* New Assessment */}
        <Link 
          href="/assessment/new?step=basics" 
          onClick={onClose} 
          className={`flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors ${
            isActive('/assessment')
              ? 'bg-red-50 text-red-700'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <svg className={`mr-3 h-5 w-5 ${isActive('/assessment') ? 'text-red-500' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          New Assessment
        </Link>
        
        {/* Previous Reports */}
        <Link 
          href="/reports" 
          onClick={onClose} 
          className={`flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors ${
            isActive('/reports')
              ? 'text-gray-700'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <svg className="mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Previous Reports
        </Link>
        
        {/* Libraries */}
        <Link 
          href="/library" 
          onClick={onClose} 
          className={`flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors ${
            isActive('/library')
              ? 'text-gray-700'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <svg className="mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
          Libraries
        </Link>
      </nav>
      
      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Consultant User</p>
              <p className="text-xs text-gray-500">consultant@example.com</p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SidebarNav; 