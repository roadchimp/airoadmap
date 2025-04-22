"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, ChevronLeft, Eye, X } from "lucide-react"
import SidebarLayout from "@/components/layout/sidebar-layout"

// Assessment steps
const steps = [
  { id: "organization-info", name: "Organization Info" },
  { id: "role-selection", name: "Role Selection" },
  { id: "areas-for-improvement", name: "Areas for Improvement" },
  { id: "work-volume", name: "Work Volume & Complexity" },
  { id: "data-systems", name: "Data & Systems" },
  { id: "readiness", name: "Readiness & Expectations" },
  { id: "review", name: "Review & Submit" },
]

export default function NewAssessmentPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [showSidebar, setShowSidebar] = useState(true)
  const [formData, setFormData] = useState({
    organizationName: "",
    industry: "",
    organizationSize: "",
    aiGoals: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    } else {
      // Submit form
      router.push("/reports/generated")
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  return (
    <SidebarLayout>
      <div className="flex h-full">
        <div className="flex-1 overflow-auto">
          {/* Header */}
          <div className="border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between px-6 py-4">
              <h1 className="text-xl font-bold text-slate-900">AI Transformation Assessment</h1>
              <button className="text-slate-500 hover:text-slate-700" onClick={() => router.push("/dashboard")}>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Main content */}
          <div className="p-6">
            {currentStep === 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Organization Info</h2>
                <p className="text-slate-600 mb-8">
                  Tell us about your organization and its goals for AI transformation.
                </p>

                <div className="space-y-6 max-w-3xl">
                  <div>
                    <label htmlFor="organizationName" className="block text-sm font-medium text-slate-700 mb-1">
                      What is the name of your organization? <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="organizationName"
                      name="organizationName"
                      value={formData.organizationName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-slate-700 mb-1">
                      What industry is your organization in? <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-slate-500 mb-2">
                      Select the industry that best matches your organization's primary business activities.
                    </p>

                    <div className="space-y-2">
                      {[
                        "Software",
                        "Manufacturing",
                        "Financial Services",
                        "Retail",
                        "Healthcare",
                        "Education",
                        "Non-profit",
                        "Other",
                      ].map((industry) => (
                        <div key={industry} className="flex items-center">
                          <input
                            type="radio"
                            id={industry}
                            name="industry"
                            value={industry}
                            checked={formData.industry === industry}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-slate-300"
                          />
                          <label htmlFor={industry} className="ml-2 block text-sm text-slate-700">
                            {industry}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="organizationSize" className="block text-sm font-medium text-slate-700 mb-1">
                      What is the size of your organization? <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="organizationSize"
                      name="organizationSize"
                      value={formData.organizationSize}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="">Select organization size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="501-1000">501-1000 employees</option>
                      <option value="1001+">1001+ employees</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="aiGoals" className="block text-sm font-medium text-slate-700 mb-1">
                      What are your primary goals for AI transformation?
                    </label>
                    <textarea
                      id="aiGoals"
                      name="aiGoals"
                      value={formData.aiGoals}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                      placeholder="e.g., Improve operational efficiency, enhance customer experience, etc."
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Role Selection</h2>
                <p className="text-slate-600 mb-8">
                  Select the roles in your organization that you want to evaluate for AI potential.
                </p>

                <div className="space-y-4 max-w-3xl">
                  {[
                    "Sales Operations Specialist",
                    "Content Marketing Manager",
                    "Digital Marketing Specialist",
                    "Customer Support Agent",
                    "Technical Support Specialist",
                  ].map((role) => (
                    <div
                      key={role}
                      className="flex items-center p-4 border border-slate-200 rounded-md hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        id={role}
                        name={role}
                        className="h-5 w-5 text-red-600 focus:ring-red-500 border-slate-300 rounded"
                      />
                      <label htmlFor={role} className="ml-3 block text-sm font-medium text-slate-700">
                        {role}
                      </label>
                    </div>
                  ))}

                  <button className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center mt-4">
                    + Add custom role
                  </button>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="mt-12 flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium ${
                  currentStep === 0
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </button>

              <button
                onClick={handleNext}
                className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {currentStep === steps.length - 1 ? "Submit" : "Next"}
                {currentStep !== steps.length - 1 && <ChevronRight className="ml-2 h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div
          className={`border-l border-slate-200 bg-white w-64 transition-all duration-300 ${showSidebar ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-medium text-slate-900">Assessment Progress</h3>
            <button onClick={() => setShowSidebar(false)} className="text-slate-400 hover:text-slate-500">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4">
            <div className="flex justify-between text-sm text-slate-500 mb-2">
              <span>
                Step {currentStep + 1} of {steps.length}
              </span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2 mb-6">
              <div
                className="bg-red-600 h-2 rounded-full"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>

            <ul className="space-y-2">
              {steps.map((step, index) => (
                <li key={step.id} className="flex items-center">
                  <div
                    className={`flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center mr-3 ${
                      index < currentStep
                        ? "bg-red-600 text-white"
                        : index === currentStep
                          ? "border-2 border-red-600"
                          : "border border-slate-300"
                    }`}
                  >
                    {index < currentStep && (
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      index === currentStep
                        ? "font-medium text-red-600"
                        : index < currentStep
                          ? "text-slate-700"
                          : "text-slate-500"
                    }`}
                  >
                    {step.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Toggle sidebar button (only shows when sidebar is hidden) */}
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            className="fixed right-4 top-20 bg-white p-2 rounded-full shadow-md border border-slate-200 text-slate-500 hover:text-slate-700"
          >
            <Eye className="h-5 w-5" />
          </button>
        )}
      </div>
    </SidebarLayout>
  )
}
