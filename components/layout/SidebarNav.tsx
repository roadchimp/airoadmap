// src/app/components/layout/SidebarNav.tsx

'use client';

import React from "react";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface SidebarNavProps {
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ 
  onClose, 
  collapsed = false,
  onToggleCollapse 
}) => {
  const pathname = usePathname();

  const isActive = (path: string, exact: boolean = false) => {
    // Specific check for dashboard vs. others
    if (exact) {
      return pathname === path;
    }
    // Special handling for '/' to ensure it doesn't match everything
    if (path === '/' || path === '/dashboard') {
        return pathname === path; // Exact match for dashboard
    }
    // Broader check for nested routes like /assessment/*
    return pathname.startsWith(path);
  }

  // Define common active/inactive styles to avoid repetition
  const activeLinkClasses = 'bg-red-100 text-red-700';
  const inactiveLinkClasses = 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';
  const activeIconClasses = 'text-red-600';
  const inactiveIconClasses = 'text-gray-400';
  const baseLinkClasses = 'flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors';
  const baseIconClasses = 'mr-3 h-5 w-5';


  return (
    // Main container: Vertical flex, full height, fixed width, background, right border
    <div className={`flex flex-col h-full ${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 transition-all duration-300`}>

      {/* Top Section: Logo & Title */}
      <div className="p-4 border-b border-gray-200 flex justify-center">
        <Link href="/dashboard" className={`flex items-center ${collapsed ? '' : 'space-x-3'}`} onClick={onClose}>
          {/* Logo Placeholder - Matches image */}
          <div className="w-10 h-10 bg-red-500 rounded flex items-center justify-center text-white">
            {/* Replace with your actual logo SVG if available */}
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.5 18.5L9.5 12.5L13.5 16.5L21.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15.5 8.5H21.5V14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {/* App Title - Hidden when collapsed */}
          {!collapsed && (
            <div>
              <h1 className="font-bold text-gray-900 text-lg">AI Prioritize</h1>
              <p className="text-xs text-gray-500">Transformation Tool</p>
            </div>
          )}
        </Link>
      </div>

      {/* Middle Section: Navigation Links - Grows to fill space */}
      <nav className="flex-grow overflow-y-auto py-6 px-3 space-y-1">
        {/* Dashboard Link - Use exact match for dashboard */}
        <Link
          href="/dashboard"
          onClick={onClose}
          className={`${baseLinkClasses} ${
            isActive('/dashboard', true) 
            ? activeLinkClasses 
            : inactiveLinkClasses
          } ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? "Dashboard" : ""}
        >
          {/* Dashboard Icon - Color updates based on active state */}
          <svg className={`${collapsed ? '' : 'mr-3'} h-5 w-5 ${isActive('/dashboard', true) ? 'text-red-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
             {/* Replaced with dashboard icon from image */}
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM3 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          {!collapsed && "Dashboard"}
        </Link>

        {/* New Assessment Link - Use exact match for assessment */}
        <Link
          href="/assessment/new" 
          onClick={onClose}
          className={`${baseLinkClasses} ${
            isActive('/assessment/new', true)
              ? `${activeLinkClasses} ${activeIconClasses}`
              : `${inactiveLinkClasses} ${inactiveIconClasses}`
          } ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? "New Assessment" : ""}
        >
          <svg className={`${collapsed ? '' : 'mr-3'} h-5 w-5 ${isActive('/assessment') ? 'text-gray-700' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /> {/* Updated icon slightly */}
          </svg>
          {!collapsed && "New Assessment"}
        </Link>

        <Link
          href="/assessment/current" 
          onClick={onClose}
          // Use startsWith (default) or exact:true if no nested routes under /current
          className={`${baseLinkClasses} ${
            isActive('/assessment/current')
            ? activeLinkClasses
            : inactiveLinkClasses
          } ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? "Current Assessments" : ""}
        >
          {/* Clipboard List Icon */}
          <svg className={`${collapsed ? '' : 'mr-3'} h-5 w-5 ${isActive('/assessment/current') ? activeIconClasses : inactiveIconClasses}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          {!collapsed && "Current Assessments"}
        </Link>


        {/* Previous Reports Link */}
        <Link
          href="/reports"
          onClick={onClose}
          className={`${baseLinkClasses} ${
            isActive('/reports')
              ? `${activeLinkClasses} ${activeIconClasses}`
              : `${inactiveLinkClasses} ${inactiveIconClasses}`
          } ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? "Previous Reports" : ""}
        >
          <svg className={`${collapsed ? '' : 'mr-3'} h-5 w-5 ${isActive('/reports') ? 'text-gray-700' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {!collapsed && "Previous Reports"}
        </Link>

        {/* Libraries Link */}
        <Link
          href="/library"
          onClick={onClose}
           className={`${baseLinkClasses} ${
            isActive('/library')
              ? `${activeLinkClasses} ${activeIconClasses}`
              : `${inactiveLinkClasses} ${inactiveIconClasses}`
          } ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? "Libraries" : ""}
        >
          <svg className={`${collapsed ? '' : 'mr-3'} h-5 w-5 ${isActive('/library') ? 'text-gray-700' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
          {!collapsed && "Libraries"}
        </Link>

        {/* Scoring Settings Link */}
        <Link
          href="/settings/scoring"
          onClick={onClose}
           className={`${baseLinkClasses} ${
            isActive('/settings/scoring')
              ? `${activeLinkClasses} ${activeIconClasses}`
              : `${inactiveLinkClasses} ${inactiveIconClasses}`
          } ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? "Scoring Settings" : ""}
        >
          {/* Cog Icon for Settings */}
          <svg className={`${collapsed ? '' : 'mr-3'} h-5 w-5 ${isActive('/settings/scoring') ? 'text-gray-700' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {!collapsed && "Scoring Settings"}
        </Link>

        {/* Home Link */}
        <Link
          href="/"
          onClick={onClose}
           className={`${baseLinkClasses} ${
            isActive('/', true)
              ? activeLinkClasses
              : inactiveLinkClasses
          } ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? "Home" : ""}
        >
          {/* Home Icon SVG */}
          <svg className={`${collapsed ? '' : 'mr-3'} h-5 w-5 ${isActive('/') ? activeIconClasses : inactiveIconClasses}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          {!collapsed && "Home"}
        </Link>



      </nav>

      {/* Toggle sidebar button - Just above user profile */}
      <div className="px-4 py-2">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-between text-sm font-medium text-gray-600 hover:text-red-600 transition-colors group bg-gray-50 p-2 rounded-md"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {!collapsed && <span>Hide Menu</span>}
          {collapsed ? (
            <PanelLeftOpen className="w-5 h-5 mx-auto" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Bottom Section: User Profile - Pushed to bottom */}
      <div className="mt-1 p-4 border-t border-gray-200">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {/* User Info - Hidden when collapsed */}
          {!collapsed ? (
            <div className="flex items-center">
              {/* Avatar Placeholder */}
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              {/* Name & Email */}
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">Consultant User</p>
                <p className="text-xs text-gray-500">consultant@example.com</p>
              </div>
            </div>
          ) : (
            /* Just show avatar when collapsed */
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
          
          {/* Logout Button - Icon matches image */}
          {!collapsed && (
            <button className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div> // End of Root Sidebar Container
  );
};

export default SidebarNav;