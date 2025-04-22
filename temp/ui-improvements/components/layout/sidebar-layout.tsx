"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, FileText, History, Library, LogOut, User, Home } from "lucide-react"
import Logo from "@/components/ui/logo"

interface SidebarLayoutProps {
  children: React.ReactNode
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center border-b border-slate-200 px-4">
          <Link href="/" className="flex items-center">
            <Logo className="mr-2" />
            <div>
              <div className="text-lg font-bold text-slate-900">AI Prioritize</div>
              <div className="text-xs text-slate-500">Transformation Tool</div>
            </div>
          </Link>
        </div>
        <nav className="p-4 space-y-2">
          <Link
            href="/"
            className={`flex items-center px-4 py-2 text-sm rounded-md ${
              isActive("/") ? "bg-red-50 text-red-600 font-medium" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Home className="mr-3 h-5 w-5" />
            Home
          </Link>
          <Link
            href="/dashboard"
            className={`flex items-center px-4 py-2 text-sm rounded-md ${
              isActive("/dashboard") ? "bg-red-50 text-red-600 font-medium" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <LayoutGrid className="mr-3 h-5 w-5" />
            Dashboard
          </Link>
          <Link
            href="/assessment/new"
            className={`flex items-center px-4 py-2 text-sm rounded-md ${
              isActive("/assessment/new") ? "bg-red-50 text-red-600 font-medium" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FileText className="mr-3 h-5 w-5" />
            New Assessment
          </Link>
          <Link
            href="/reports"
            className={`flex items-center px-4 py-2 text-sm rounded-md ${
              isActive("/reports") ? "bg-red-50 text-red-600 font-medium" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <History className="mr-3 h-5 w-5" />
            Previous Reports
          </Link>
          <Link
            href="/libraries"
            className={`flex items-center px-4 py-2 text-sm rounded-md ${
              isActive("/libraries") ? "bg-red-50 text-red-600 font-medium" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Library className="mr-3 h-5 w-5" />
            Libraries
          </Link>
        </nav>

        {/* User section at bottom */}
        <div className="absolute bottom-0 w-64 border-t border-slate-200">
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center w-full px-4 py-3 hover:bg-slate-100"
            >
              <div className="flex-shrink-0 mr-3">
                <div className="h-8 w-8 rounded-full bg-slate-300 flex items-center justify-center">
                  <User className="h-4 w-4 text-slate-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 truncate">Consultant User</div>
                <div className="text-xs text-slate-500 truncate">consultant@example.com</div>
              </div>
            </button>

            {isUserMenuOpen && (
              <div className="absolute bottom-full mb-2 w-full bg-white rounded-md shadow-lg border border-slate-200">
                <div className="py-1">
                  <Link href="/profile" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                    Profile
                  </Link>
                  <Link href="/settings" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                    Settings
                  </Link>
                  <Link href="/login" className="block px-4 py-2 text-sm text-red-600 hover:bg-slate-100">
                    <div className="flex items-center">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}
