// src/app/components/layout/SidebarNav.tsx

'use client';

import React from "react";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { BarChart, FileText, ClipboardList, Clock, Library, Settings, Home, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from '@/hooks/UseAuth';
import { cn } from "@/lib/session/utils";
import { Logo } from "@/components/ui/logo";

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
  const { isAuthenticated } = useAuth();

  const isActive = (path: string, exact: boolean = false) => {
    if (exact) {
      return pathname === path;
    }
    if (path === '/' || path === '/dashboard') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: BarChart,
    },
    {
      title: "New Assessment",
      href: "/assessment/new",
      icon: FileText,
    },
    {
      title: "Current Assessments",
      href: "/assessment/current",
      icon: ClipboardList,
    },
    {
      title: "Reports",
      href: "/reports",
      icon: Clock,
    },
    {
      title: "Libraries",
      href: "/library",
      icon: Library,
    },
    {
      title: "Scoring Settings",
      href: "/settings/scoring",
      icon: Settings,
    },
  ];

  return (
    <div className="relative">
      {/* Toggle Button - Outside of the main sidebar and positioned to the right */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none z-10"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </button>

      <div className={`flex flex-col h-full ${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 transition-all duration-300`}>
        {/* Top Section: Logo & Title */}
        <div className="p-4 border-b border-gray-200 flex justify-center">
          <Link href="/dashboard" className="flex items-center" onClick={onClose}>
            <Logo showText={!collapsed} />
            
            {/* Subtitle - only show when not collapsed */}

          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-2">
          <nav className="flex flex-col gap-1">
            {navItems.map((item, index) => {
              const isItemActive = isActive(item.href, item.href === '/dashboard');
              return (
                <Link
                  key={index}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors group",
                    isItemActive
                      ? "bg-orange-100 font-medium text-orange-600"
                      : "text-gray-700 hover:bg-orange-50 hover:text-orange-600",
                    collapsed && "justify-center px-2"
                  )}
                  title={collapsed ? item.title : ""}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5",
                      isItemActive ? "text-orange-600" : "text-gray-500 group-hover:text-orange-600",
                    )}
                  />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Home link - positioned at the very bottom */}
        <div className="p-2 border-t border-gray-200 mt-auto">
          <Link
            href="/"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-orange-50 hover:text-orange-600 group",
              isActive('/', true) && "bg-orange-100 font-medium text-orange-600",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? "Home" : ""}
          >
            <Home className={cn(
              "h-5 w-5", 
              isActive('/', true) ? "text-orange-600" : "text-gray-500 group-hover:text-orange-600"
            )} />
            {!collapsed && <span>Home</span>}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SidebarNav;