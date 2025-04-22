"use client"

import { PlusCircle, Eye, BookOpen } from "lucide-react"
import Link from "next/link"
import SidebarLayout from "@/components/layout/sidebar-layout"

export default function DashboardPage() {
  return (
    <SidebarLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to AI Prioritize</h1>
        <p className="text-slate-600 mb-8">
          Develop an AI transformation roadmap for your organization by analyzing pain points and prioritizing
          opportunities.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Assessments Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Assessments</h2>
              <p className="text-slate-600 text-sm mb-6">Create or continue an assessment</p>

              <div className="text-5xl font-bold text-slate-900 mb-4">0</div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm">
                  <div className="w-3 h-3 rounded-full bg-orange-400 mr-2"></div>
                  <span className="text-slate-600">0 in progress</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                  <span className="text-slate-600">0 completed</span>
                </div>
              </div>

              <Link
                href="/assessment/new"
                className="flex items-center justify-center w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                New Assessment
              </Link>
            </div>
          </div>

          {/* Generated Reports Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Generated Reports</h2>
              <p className="text-slate-600 text-sm mb-6">View your prioritization reports</p>

              <div className="text-5xl font-bold text-slate-900 mb-4">0</div>
              <p className="text-slate-600 text-sm mb-6">Total reports</p>

              <Link
                href="/reports"
                className="flex items-center justify-center w-full py-2 px-4 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 rounded-md font-medium"
              >
                <Eye className="mr-2 h-5 w-5" />
                View Reports
              </Link>
            </div>
          </div>

          {/* Libraries Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Libraries</h2>
              <p className="text-slate-600 text-sm mb-6">Manage job roles and AI capabilities</p>

              <p className="text-slate-700 mb-6">
                Customize the role and AI capability libraries to better match your organization's needs.
              </p>

              <Link
                href="/libraries"
                className="flex items-center justify-center w-full py-2 px-4 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 rounded-md font-medium"
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Browse Libraries
              </Link>
            </div>
          </div>
        </div>

        {/* Getting Started Guide */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Getting Started Guide</h2>
          <p className="text-slate-600 mb-6">Follow these steps to create your first AI transformation roadmap:</p>

          <ol className="space-y-4">
            <li className="flex">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold mr-3">
                1
              </div>
              <div>
                <p className="text-slate-800 font-medium">Click "New Assessment" to start a new evaluation</p>
              </div>
            </li>
            <li className="flex">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold mr-3">
                2
              </div>
              <div>
                <p className="text-slate-800 font-medium">Answer questions about your organization's current state</p>
              </div>
            </li>
            <li className="flex">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold mr-3">
                3
              </div>
              <div>
                <p className="text-slate-800 font-medium">Identify key pain points and opportunities</p>
              </div>
            </li>
            <li className="flex">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold mr-3">
                4
              </div>
              <div>
                <p className="text-slate-800 font-medium">Review the AI-generated recommendations</p>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </SidebarLayout>
  )
}
