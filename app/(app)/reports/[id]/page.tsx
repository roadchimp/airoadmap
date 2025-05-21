"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Download, Printer, Share2, FileSpreadsheet, FileText, Pencil, Check, X, Settings2Icon as SettingsIconLucide, Edit3Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PriorityMatrix } from "./priority-matrix"
import { CapabilitiesTable } from "./capabilities-table"
import { CategoryFilter } from "./category-filter"
import { AIAdoptionScoreTab, type AIAdoptionScoreProps } from "./ai-adoption-score"
import { PerformanceMetricsTable } from "./performance-metrics"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { addPrintStyles } from "../../../../utils/print-styles"
import { toast } from "@/hooks/use-toast"
import type { FullAICapability, ToolWithMappedCapabilities, ReportWithMetricsAndRules } from "@/server/storage"
import { updateAssessmentTitle } from "@/app/actions/reportActions"
import { CapabilityDetailModal } from "./CapabilityDetailModal"
import { ReportHeader } from "./report-header"
import { ReportSettingsModal } from "./report-settings-modal"
import { RecommendedToolsTable } from "./RecommendedToolsTable"
import { getReportData } from '@/app/actions/reportActions'
import { AiTool, AICapability } from '@shared/schema.ts'

// Import existing report components for fallback
// import ReportView from '@/components/report/ReportView'
import type { Report, Assessment, HeatmapData, PrioritizedItem, AISuggestion, PerformanceImpact, ReportWithAssessmentDetails } from '@shared/schema'

const ITEMS_PER_PAGE = 10

interface ReportPageData {
  report: ReportWithMetricsAndRules | null
  capabilities: FullAICapability[]
  tools: ToolWithMappedCapabilities[]
}

interface ReportPageProps {
  params: { id: string }
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default function ReportPage({ params }: ReportPageProps) {
  const router = useRouter()
  const reportId = parseInt(params.id, 10)
  
  const [activeTab, setActiveTab] = useState("executive-summary")
  // const [matrixVisible, setMatrixVisible] = useState(false)

  // State for report data
  const [reportDetails, setReportDetails] = useState<ReportWithMetricsAndRules | null>(null)
  const [allCapabilities, setAllCapabilities] = useState<FullAICapability[]>([])
  const [allTools, setAllTools] = useState<ToolWithMappedCapabilities[]>([])
  const [filteredCapabilities, setFilteredCapabilities] = useState<FullAICapability[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reportTitle, setReportTitle] = useState("")

  // State for consultant commentary
  const [commentary, setCommentary] = useState("")
  const [isEditingCommentary, setIsEditingCommentary] = useState(false)
  const [tempCommentary, setTempCommentary] = useState("")
  
  // State for CategoryFilter
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  
  // Modal State
  const [selectedCapability, setSelectedCapability] = useState<FullAICapability | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // State for Report Settings
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

  // Pagination state
  const [currentPageCapabilities, setCurrentPageCapabilities] = useState(1)
  
  // Add print styles on mount
  useEffect(() => {
    addPrintStyles()
  }, [])
  
  // Fetch report data
  useEffect(() => {
    if (reportId && !isNaN(reportId)) {
      setIsLoading(true)
      setError(null)
      fetch(`/api/reports/${reportId}`)
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.text()
            throw new Error(`Failed to fetch report page data: ${response.statusText} - ${errorData}`)
          }
          return response.json()
        })
        .then((data: ReportPageData) => {
          setReportDetails(data.report)
          const currentReportTitle = data.report?.assessment?.title || "Untitled Report"
          setReportTitle(currentReportTitle)
          setAllCapabilities(data.capabilities || [])
          setAllTools(data.tools || [])
          setCommentary(data.report?.consultantCommentary || "")
          setTempCommentary(data.report?.consultantCommentary || "")
        })
        .catch(e => {
          console.error("Failed to fetch report page data in useEffect:", e)
          setError(e instanceof Error ? e.message : "Failed to load essential report data")
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setError("Invalid Report ID")
      setIsLoading(false)
    }
  }, [reportId])

  // Filter capabilities based on selected categories
  useEffect(() => {
    if (selectedCategories.length === 0) {
      setFilteredCapabilities(allCapabilities);
    } else {
      setFilteredCapabilities(
        allCapabilities.filter(capability => 
          capability.category && selectedCategories.includes(capability.category)
        )
      );
    }
    setCurrentPageCapabilities(1); // Reset to first page on filter change
  }, [allCapabilities, selectedCategories]);

  // Effect to track when matrix tab becomes visible
  useEffect(() => {
    // setMatrixVisible(activeTab === "prioritization-matrix")
  }, [activeTab])

  const handleCategoryChange = (categories: string[]) => {
    setSelectedCategories(categories)
    setCurrentPageCapabilities(1) // Reset to first page on filter change
  }

  const handleCapabilityClick = (capability: FullAICapability) => {
    setSelectedCapability(capability)
    setIsDetailModalOpen(true)
  }

  const closeModal = () => {
    setIsDetailModalOpen(false)
    setSelectedCapability(null)
  }

  const allUniqueCategories = useMemo(() => {
    const categoriesSet = new Set<string>()
    allCapabilities.forEach(cap => { if (cap.category) categoriesSet.add(cap.category) })
    return Array.from(categoriesSet).sort()
  }, [allCapabilities])

  const handleExportPDF = () => window.print()

  const handleExportCSV = () => {
    if (filteredCapabilities.length === 0) {
      toast({ title: "No data to export based on current filters", variant: "destructive" })
      return
    }
    const headers = ["Rank", "Name", "Category", "Description", "Value Score", "Feasibility Score", "Impact Score", "Priority"]
    const csvRows = filteredCapabilities.map(cap => [
      cap.rank || 'N/A',
      cap.name,
      cap.category,
      cap.description || '',
      cap.valueScore,
      cap.feasibilityScore,
      cap.impactScore,
      cap.priority
    ].map(String).join(',')) // Ensure all are strings for CSV
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...csvRows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${reportTitle}_capabilities.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSaveCommentary = async () => {
    if (!reportDetails?.id) return
    try {
      const response = await fetch(`/api/reports/${reportDetails.id}/commentary`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentary: tempCommentary })
      })
      if (!response.ok) throw new Error(await response.text())
      setCommentary(tempCommentary)
      setIsEditingCommentary(false)
      toast({ title: "Success", description: "Commentary saved." })
    } catch (err) {
      toast({ title: "Error saving commentary", description: (err as Error).message, variant: "destructive" })
    }
  }

  const handleUpdateReportTitleCallback = async (newTitle: string) => {
    if (!reportDetails?.assessmentId) {
      toast({ title: "Error", description: "Assessment ID is missing. Cannot update title.", variant: "destructive" })
      return
    }
    const currentReportId = reportDetails.id
    const updatedAssessment = await updateAssessmentTitle(reportDetails.assessmentId, newTitle, currentReportId)
    if (updatedAssessment && updatedAssessment.title) {
      setReportTitle(updatedAssessment.title)
      setReportDetails(prev => prev ? { ...prev, title: updatedAssessment.title!, assessment: { ...prev.assessment!, title: updatedAssessment.title!} } : null)
      toast({ title: "Success", description: "Report title updated." })
    } else {
      toast({ title: "Error", description: "Failed to update report title.", variant: "destructive" })
      // Potentially revert optimistic UI update if ReportHeader did one, but it updates its own state now.
    }
  }

  // If still loading, show a loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#e84c2b]"></div>
        <p className="mt-4 font-medium text-gray-700">Loading your AI Transformation Assessment...</p>
        <p className="mt-2 text-sm text-gray-500">This may take a moment as we analyze your assessment data.</p>
      </div>
    )
  }

  // If there's an error or no data, show an error state
  if (error || !reportDetails) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold text-red-600">
          {error || "Report not found or could not be loaded"}
        </h2>
        <Button onClick={() => router.push('/reports')}>
          Return to Reports
        </Button>
      </div>
    )
  }

  // New UI implementation
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white shadow-sm print:shadow-none">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold leading-tight text-gray-900 print:text-2xl">
                <ReportHeader 
                  initialReportTitle={reportTitle}
                  onUpdateTitle={handleUpdateReportTitleCallback}
                  onOpenSettings={() => setIsSettingsModalOpen(true)}
                />
              </h1>
              <p className="mt-1 text-sm text-gray-500 print:text-xs">
                Generated on {new Date(reportDetails.generatedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex space-x-3 print:hidden">
              <Button variant="outline" size="sm" onClick={handleExportPDF}><Printer className="mr-2 h-4 w-4" /> Print/PDF</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleExportCSV}><FileSpreadsheet className="mr-2 h-4 w-4" /> Export Capabilities (CSV)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Assessment Details Section */}
          <Card className="mt-6 bg-slate-50 print:border print:shadow-none">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-lg font-medium text-slate-800">Assessment Context</CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3 text-sm text-slate-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
              <div><span className="font-semibold text-slate-600">Assessment Title: </span>{reportDetails.assessment?.title || 'N/A'}</div>
              <div><span className="font-semibold text-slate-600">Organization: </span>{reportDetails.organizationName || 'N/A'}</div>
              <div><span className="font-semibold text-slate-600">Industry: </span>{reportDetails.assessment?.industry || 'N/A'}</div>
              <div><span className="font-semibold text-slate-600">Industry Maturity: </span>{reportDetails.assessment?.industryMaturity || 'N/A'}</div>
              <div><span className="font-semibold text-slate-600">Company Stage: </span>{reportDetails.assessment?.companyStage || 'N/A'}</div>
              <div><span className="font-semibold text-slate-600">Strategic Focus: </span>{Array.isArray(reportDetails.assessment?.strategicFocus) ? reportDetails.assessment.strategicFocus.join(', ') : 'N/A'}</div>
            </CardContent>
          </Card>

        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4 md:px-6">
        <Tabs defaultValue="executive-summary" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-between items-center print:hidden">
            <TabsList className="bg-gray-200">
              <TabsTrigger
                value="executive-summary"
                className="text-gray-700 data-[state=active]:bg-[#e84c2b] data-[state=active]:text-white"
              >
                Executive Summary
              </TabsTrigger>
              <TabsTrigger
                value="prioritization-matrix"
                className="text-gray-700 data-[state=active]:bg-[#e84c2b] data-[state=active]:text-white"
              >
                Prioritization Matrix
              </TabsTrigger>
              <TabsTrigger
                value="ai-capabilities"
                className="text-gray-700 data-[state=active]:bg-[#e84c2b] data-[state=active]:text-white"
              >
                AI Capabilities
              </TabsTrigger>
              <TabsTrigger
                value="ai-adoption-score"
                className="text-gray-700 data-[state=active]:bg-[#e84c2b] data-[state=active]:text-white"
              >
                AI Adoption Score
              </TabsTrigger>
              <TabsTrigger
                value="performance-metrics"
                className="text-gray-700 data-[state=active]:bg-[#e84c2b] data-[state=active]:text-white"
              >
                Performance Metrics
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="executive-summary" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Executive Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">
                      {reportDetails.executiveSummary || "No executive summary available."}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="h-5 w-5 text-[#e84c2b]" />
                      Expected Performance Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        ${(reportDetails.performanceImpact as PerformanceImpact)?.estimatedRoi || 0}
                      </h3>
                      <p className="text-sm text-gray-500">Estimated Annual ROI</p>
                    </div>
                    <p className="text-sm text-gray-600">
                      Based on time savings and increased throughput
                    </p>
                  </CardContent>
                </Card>

                {/* AI Adoption Score Card */}
                <Card className="mt-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("ai-adoption-score")}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-[#e84c2b]">📈</span>
                      AI Adoption Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <div className="relative w-24 h-24">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#f1f1f1"
                          strokeWidth="12"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#e84c2b"
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray="251.2"
                          strokeDashoffset={251.2 - (251.2 * ((reportDetails?.aiAdoptionScoreDetails as AIAdoptionScoreProps['aiAdoptionScoreDetails'])?.score || 0) / 100)}
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold">
                        {(reportDetails?.aiAdoptionScoreDetails as AIAdoptionScoreProps['aiAdoptionScoreDetails'])?.score || 0}
                      </div>
                    </div>
                    <p className="text-sm text-center mt-2 text-muted-foreground">
                      Click to view details
                    </p>
                  </CardContent>
                </Card>

                <Card className="mt-6">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Consultant Commentary</CardTitle>
                    {!isEditingCommentary ? (
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingCommentary(true)} className="h-8 w-8 p-0">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    ) : (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={handleSaveCommentary} className="h-8 w-8 p-0 text-green-600">
                          <Check className="h-4 w-4" />
                          <span className="sr-only">Save</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setIsEditingCommentary(false)} className="h-8 w-8 p-0 text-red-600">
                          <X className="h-4 w-4" />
                          <span className="sr-only">Cancel</span>
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    {isEditingCommentary ? (
                      <Textarea
                        value={tempCommentary}
                        onChange={(e) => setTempCommentary(e.target.value)}
                        className="min-h-[120px]"
                        placeholder="Add your commentary here..."
                      />
                    ) : commentary ? (
                      <p className="text-gray-700 leading-relaxed text-sm">{commentary}</p>
                    ) : (
                      <p className="text-gray-500 italic text-sm">No commentary has been added yet.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Priority Matrix Tab */}
          <TabsContent value="prioritization-matrix" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Capability Prioritization Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <PriorityMatrix capabilities={allCapabilities} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Capabilities Tab */}
          <TabsContent value="ai-capabilities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Capabilities</CardTitle>
                <CardDescription>
                  Detailed list of identified AI capabilities, their potential impact, and implementation considerations.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                  <CategoryFilter 
                    allUniqueCategories={allUniqueCategories}
                    selectedCategories={selectedCategories}
                    onCategoryChange={handleCategoryChange}
                  />
                </div>
                <div className="md:col-span-3">
                  <CapabilitiesTable 
                    capabilities={filteredCapabilities}
                    onCapabilityClick={handleCapabilityClick}
                    currentPage={currentPageCapabilities}
                    itemsPerPage={ITEMS_PER_PAGE}
                  />
                  {/* Pagination for CapabilitiesTable */}
                  {filteredCapabilities.length > ITEMS_PER_PAGE && (
                    <div className="mt-6 flex justify-center items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPageCapabilities(prev => Math.max(1, prev - 1))}
                        disabled={currentPageCapabilities === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {currentPageCapabilities} of {Math.ceil(filteredCapabilities.length / ITEMS_PER_PAGE)}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPageCapabilities(prev => Math.min(Math.ceil(filteredCapabilities.length / ITEMS_PER_PAGE), prev + 1))}
                        disabled={currentPageCapabilities === Math.ceil(filteredCapabilities.length / ITEMS_PER_PAGE)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recommended AI Tools</CardTitle>
                 <p className="text-sm text-muted-foreground pt-1">
                  AI tools that support the capabilities relevant to your organization.
                </p>
              </CardHeader>
              <CardContent>
                <RecommendedToolsTable tools={allTools} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Metrics Tab */}
          <TabsContent value="performance-metrics" className="space-y-6">
            <PerformanceMetricsTable />
          </TabsContent>
          
          {/* AI Adoption Score Tab */}
          <TabsContent value="ai-adoption-score" className="space-y-6">
            <AIAdoptionScoreTab 
              aiAdoptionScoreDetails={
                reportDetails?.aiAdoptionScoreDetails && typeof reportDetails.aiAdoptionScoreDetails === 'object'
                ? reportDetails.aiAdoptionScoreDetails as AIAdoptionScoreProps['aiAdoptionScoreDetails']
                : undefined
              }
              roiDetails={
                reportDetails?.roiDetails && typeof reportDetails.roiDetails === 'object'
                ? reportDetails.roiDetails as AIAdoptionScoreProps['roiDetails']
                : undefined
              }
              companyProfile={{
                industry: reportDetails?.assessment?.industry,
                industryMaturity: reportDetails?.assessment?.industryMaturity,
                companyStage: reportDetails?.assessment?.companyStage,
                strategicFocus: Array.isArray(reportDetails?.assessment?.strategicFocus) ? reportDetails?.assessment.strategicFocus : undefined
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {selectedCapability && (
        <CapabilityDetailModal 
          capability={selectedCapability} 
          isOpen={isDetailModalOpen} 
          onClose={closeModal} 
        />
      )}

      <ReportSettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        reportId={params.id ? Number(params.id) : undefined}
      />
    </div>
  )
} 