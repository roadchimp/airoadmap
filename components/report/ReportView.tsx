"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Download, Printer, Share2, FileSpreadsheet, FileText, Pencil, Check, X, Settings2Icon as SettingsIconLucide, Edit3Icon, Mail, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PriorityMatrix } from "@/app/(app)/reports/[id]/priority-matrix"
import { CapabilitiesTable } from "@/app/(app)/reports/[id]/capabilities-table"
import { CategoryFilter } from "@/app/(app)/reports/[id]/category-filter"
import { AIAdoptionScoreTab, type AIAdoptionScoreProps } from "@/app/(app)/reports/[id]/ai-adoption-score"
import { PerformanceMetricsTable } from "@/app/(app)/reports/[id]/performance-metrics"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { addPrintStyles } from "utils/print-styles"
import { toast } from "@/hooks/use-toast"
import type { FullAICapability, ToolWithMappedCapabilities, ReportWithMetricsAndRules } from "@/server/storage"
import { updateAssessmentTitle } from "@/app/actions/reportActions"
import { CapabilityDetailModal } from "@/app/(app)/reports/[id]/CapabilityDetailModal"
import { ReportHeader } from "@/app/(app)/reports/[id]/report-header"
import { ReportSettingsModal } from "@/app/(app)/reports/[id]/report-settings-modal"
import { RecommendedToolsTable } from "@/app/(app)/reports/[id]/RecommendedToolsTable"
import { AIToolsTable } from "@/app/(app)/reports/[id]/ai-tools-table"
import { MatrixDebugger } from "@/app/(app)/reports/[id]/matrix-debugger"
import { RoleSelector } from "@/app/(app)/reports/[id]/role-selector"
import { AiTool, AICapability } from '@shared/schema.ts'
import type { Report, Assessment, HeatmapData, PrioritizedItem, AISuggestion, PerformanceImpact, ReportWithAssessmentDetails } from '@shared/schema'

const ITEMS_PER_PAGE = 10

interface ReportViewProps {
  report: ReportWithMetricsAndRules | null
}

export default function ReportView({ report: initialReport }: ReportViewProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("executive-summary")
  
  const [reportDetails, setReportDetails] = useState<ReportWithMetricsAndRules | null>(initialReport)
  const [allCapabilities, setAllCapabilities] = useState<FullAICapability[]>(initialReport?.capabilities || [])
  const [filteredCapabilities, setFilteredCapabilities] = useState<FullAICapability[]>(initialReport?.capabilities || [])
  const [reportTitle, setReportTitle] = useState(initialReport?.assessment?.title || "Untitled Report")

  const [commentary, setCommentary] = useState(initialReport?.consultantCommentary || "")
  const [isEditingCommentary, setIsEditingCommentary] = useState(false)
  const [tempCommentary, setTempCommentary] = useState(initialReport?.consultantCommentary || "")
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedPainPoints, setSelectedPainPoints] = useState<string[]>([])
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  
  const [availableRoles, setAvailableRoles] = useState<{id: number, title: string}[]>([])
  
  const [selectedCapability, setSelectedCapability] = useState<FullAICapability | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)

  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareEmail, setShareEmail] = useState("")
  const [isSharing, setIsSharing] = useState(false)

  const [currentPageCapabilities, setCurrentPageCapabilities] = useState(1)
  
  const allUniqueCategories = useMemo(() => {
    const categoriesSet = new Set<string>()
    allCapabilities.forEach(cap => { if (cap.category) categoriesSet.add(cap.category) })
    return Array.from(categoriesSet).sort()
  }, [allCapabilities])
  
  const roles = useMemo(() => {
    const roleSet = new Set<string>()
    allCapabilities.forEach(cap => {
      if (cap.role) roleSet.add(cap.role)
    })
    return Array.from(roleSet).sort()
  }, [allCapabilities])
  
  const painPoints = useMemo(() => {
    const painPointSet = new Set<string>()
    allCapabilities.forEach(cap => {
      if (cap.painPoint) painPointSet.add(cap.painPoint)
    })
    return Array.from(painPointSet).sort()
  }, [allCapabilities])
  
  const goals = useMemo(() => {
    const goalSet = new Set<string>()
    allCapabilities.forEach(cap => {
      if (cap.goal) goalSet.add(cap.goal)
    })
    return Array.from(goalSet).sort()
  }, [allCapabilities])

  const filteredTools = useMemo(() => {
    // This logic needs to be revisited, as allTools is not passed in.
    // For now, returning empty array.
    return [];
  }, [allCapabilities, selectedCategories, selectedRoles, selectedPainPoints, selectedGoals, reportDetails?.aiSuggestions]);
    
  useEffect(() => {
    addPrintStyles()
  }, [])

  useEffect(() => {
    if (initialReport) {
        setReportDetails(initialReport);
        setAllCapabilities(initialReport.capabilities || []);
        setFilteredCapabilities(initialReport.capabilities || []);
        setReportTitle(initialReport.assessment?.title || "Untitled Report");
        setCommentary(initialReport.consultantCommentary || "");
        setTempCommentary(initialReport.consultantCommentary || "");
        if (initialReport.selectedRoles) {
            setAvailableRoles(initialReport.selectedRoles.map(r => ({ id: r.id, title: r.title })));
        }
    }
  }, [initialReport]);
  
  useEffect(() => {
    let filtered = [...allCapabilities];
    
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(capability => 
        capability.category && selectedCategories.includes(capability.category)
      );
    }
    
    if (selectedRoles.length > 0) {
      filtered = filtered.filter(capability => 
        !capability.role || selectedRoles.includes(capability.role)
      );
    }
    
    if (selectedPainPoints.length > 0) {
      filtered = filtered.filter(capability => 
        !capability.painPoint || selectedPainPoints.includes(capability.painPoint)
      );
    }
    
    if (selectedGoals.length > 0) {
      filtered = filtered.filter(capability => 
        !capability.goal || selectedGoals.includes(capability.goal)
      );
    }
    
    setFilteredCapabilities(filtered);
    setCurrentPageCapabilities(1);
  }, [allCapabilities, selectedCategories, selectedRoles, selectedPainPoints, selectedGoals]);

  if (!reportDetails) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold text-red-600">
          Report not found or could not be loaded.
        </h2>
        <Button onClick={() => router.push('/reports')}>
          Return to Reports
        </Button>
      </div>
    )
  }

  const handleCategoryChange = (categories: string[]) => {
    setSelectedCategories(categories)
    setCurrentPageCapabilities(1)
  }

  const handleRoleToggle = (roleTitle: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleTitle) 
        ? prev.filter(role => role !== roleTitle)
        : [...prev, roleTitle]
    );
    setCurrentPageCapabilities(1);
  }

  const handleCapabilityClick = (capability: FullAICapability) => {
    setSelectedCapability(capability)
    setIsDetailModalOpen(true)
  }

  const closeModal = () => {
    setIsDetailModalOpen(false)
    setSelectedCapability(null)
  }

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
      cap.valueScore || cap.default_value_score || 'N/A',
      cap.feasibilityScore || cap.default_feasibility_score || 'N/A',
      cap.impactScore || cap.default_impact_score || 'N/A',
      cap.priority || 'Medium'
    ].map(String).join(','))
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
    }
  }

  const handleShare = async () => {
    if (!shareEmail.trim()) {
      toast({ title: "Error", description: "Please enter an email address.", variant: "destructive" })
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(shareEmail)) {
      toast({ title: "Error", description: "Please enter a valid email address.", variant: "destructive" })
      return
    }

    setIsSharing(true)
    try {
      const currentUrl = window.location.href
      const response = await fetch(`/api/reports/${reportDetails.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: shareEmail,
          reportUrl: currentUrl,
          reportTitle: reportTitle 
        })
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      toast({ 
        title: "Success", 
        description: `Report link has been shared with ${shareEmail}` 
      })
      setIsShareModalOpen(false)
      setShareEmail("")
    } catch (error) {
      toast({ 
        title: "Error sharing report", 
        description: error instanceof Error ? error.message : "Failed to share report", 
        variant: "destructive" 
      })
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" /> Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <Printer className="mr-2 h-4 w-4" /> Print/PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Capabilities (CSV)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  if (!reportDetails.assessment?.id) {
                    toast({
                      title: "Error",
                      description: "Assessment ID not found. Cannot regenerate report.",
                      variant: "destructive",
                    });
                    return;
                  }

                  try {
                    toast({
                      title: "Regenerating Report",
                      description: "Please wait while we recalculate the AI Adoption Score...",
                    });

                    const response = await fetch(`/api/reports/assessment/${reportDetails.assessment.id}`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    });
                    
                    if (response.ok) {
                      const result = await response.json();
                      console.log('Report regenerated successfully:', result);
                      toast({
                        title: "Success!",
                        description: "Report regenerated with updated AI Adoption Score.",
                      });
                      setTimeout(() => {
                        window.location.reload();
                      }, 1000);
                    } else {
                      const errorText = await response.text();
                      console.error('Failed to regenerate report:', response.status, errorText);
                      toast({
                        title: "Error",
                        description: `Failed to regenerate report: ${response.status} ${response.statusText}`,
                        variant: "destructive",
                      });
                    }
                  } catch (error) {
                    console.error('Error regenerating report:', error);
                    toast({
                      title: "Network Error",
                      description: `Could not connect to server. Please check if you're on the correct port (dev server might be on :3001).`,
                      variant: "destructive",
                    });
                  }
                }}
                className="text-gray-700 hover:bg-gray-100"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Regenerate Report
              </Button>

              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setIsShareModalOpen(true)}
                className="bg-[#e84c2b] hover:bg-[#d63916] text-white"
              >
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4 md:px-6">
        <Tabs defaultValue="executive-summary" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-between items-center print:hidden">
            <TabsList className="bg-gray-200">
              <TabsTrigger
                value="executive-summary"
                className="text-gray-700 data-[state=active]:bg-[#e84c2b] data-[state=active]:text-white"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="prioritization-matrix"
                className="text-gray-700 data-[state=active]:bg-[#e84c2b] data-[state=active]:text-white"
              >
                Priority Matrix
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
              <TabsTrigger
                value="ai-tools"
                className="text-gray-700 data-[state=active]:bg-[#e84c2b] data-[state=active]:text-white"
              >
                AI Tool Recommendations
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="executive-summary" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-gray-700 leading-relaxed">
                      {reportDetails.executiveSummary ? 
                        reportDetails.executiveSummary
                          .split(/\n{2,}|\.(?=\s+[A-Z])|\.\s{2,}/)
                          .map((paragraph, index) => (
                            <p key={index} className="mb-4">{paragraph.trim()}</p>
                          ))
                        : "No executive summary available."
                      }
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
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
                          strokeDashoffset={251.2 - (251.2 * ((reportDetails?.aiAdoptionScoreDetails as any)?.overallScore || 0) / 100)}
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold">
                        {Math.round((reportDetails?.aiAdoptionScoreDetails as any)?.overallScore || 0)}
                      </div>
                    </div>
                    <p className="text-sm text-center mt-2 text-muted-foreground">
                      Click to view details
                    </p>
                  </CardContent>
                </Card>
 
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="h-5 w-5 text-[#e84c2b]" />
                      Expected Performance Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2">
                    <p className="text-sm text-gray-500">Estimated Annual ROI</p>
                      <h3 className="text-lg font-bold text-gray-900">
                        ${(reportDetails.performanceImpact as PerformanceImpact)?.estimatedRoi || 0}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Based on time savings and increased throughput
                    </p>
                  </CardContent>
                </Card>

                <Card className="mt-6 bg-slate-50 print:border print:shadow-none">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-lg font-medium text-slate-800">Company Information</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 py-3 text-sm text-slate-700 space-y-4">
                    <div>
                      <span className="font-semibold text-slate-600 block mb-1">Industry</span>
                      <span className="text-slate-900 font-medium">
                        {reportDetails.assessment?.industry ? 
                          `${reportDetails.assessment.industry}${reportDetails.assessment?.industryMaturity ? ` (${reportDetails.assessment.industryMaturity})` : ''}` 
                          : 'N/A'
                        }
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-600 block mb-1">Stage of Growth</span>
                      <span className="text-slate-900 font-medium">{reportDetails.assessment?.companyStage || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-600 block mb-2">Strategic Focus</span>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(reportDetails.assessment?.strategicFocus) ? 
                          reportDetails.assessment.strategicFocus.map((focus, index) => (
                            <span 
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-800"
                            >
                              {focus}
                            </span>
                          )) : 
                          <span className="text-slate-500">N/A</span>
                        }
                      </div>
                    </div>
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

          <TabsContent value="prioritization-matrix" className="h-full">
            <h2 className="text-2xl font-bold mb-4">AI Capability Prioritization Matrix</h2>
            
            <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <CategoryFilter
                allCategories={allUniqueCategories}
                selectedCategories={selectedCategories}
                onChange={handleCategoryChange}
              />
              
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={() => setIsSettingsModalOpen(true)}>
                  <SettingsIconLucide className="h-4 w-4 mr-1" />
                  Settings
                </Button>
              </div>
            </div>

            <div className="mb-6">
              {availableRoles.length > 0 ? (
                <>
                  <h3 className="text-sm font-medium mb-3 text-gray-700">Select Roles:</h3>
                  <RoleSelector
                    roles={availableRoles}
                    selectedRoles={selectedRoles}
                    onRoleToggle={handleRoleToggle}
                  />
                  {selectedRoles.length > 0 && (
                    <button 
                      className="mt-2 text-xs text-[#e84c2b] hover:underline"
                      onClick={() => setSelectedRoles([])}
                    >
                      Clear all roles
                    </button>
                  )}
                </>
              ) : (
                <div className="text-sm text-gray-500">No assessment roles available for filtering.</div>
              )}
            </div>
            
            <PriorityMatrix 
              capabilities={filteredCapabilities} 
            />

            <MatrixDebugger capabilities={filteredCapabilities} />
          </TabsContent>

          <TabsContent value="ai-capabilities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Capabilities</CardTitle>
                <CardDescription>
                  Detailed list of identified AI capabilities, their potential impact, and implementation considerations.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="w-full flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <CategoryFilter 
                      allCategories={allUniqueCategories}
                      selectedCategories={selectedCategories}
                      onChange={handleCategoryChange}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Role:</label>
                    <select 
                      className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#e84c2b] focus:border-[#e84c2b]"
                      multiple
                      value={selectedRoles}
                      onChange={(e) => {
                        const options = Array.from(e.target.selectedOptions, option => option.value);
                        setSelectedRoles(options);
                      }}
                    >
                      {roles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    {selectedRoles.length > 0 && (
                      <button 
                        className="mt-1 text-xs text-[#e84c2b] hover:underline"
                        onClick={() => setSelectedRoles([])}
                      >
                        Clear selection
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Pain Point:</label>
                    <select 
                      className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#e84c2b] focus:border-[#e84c2b]"
                      multiple
                      value={selectedPainPoints}
                      onChange={(e) => {
                        const options = Array.from(e.target.selectedOptions, option => option.value);
                        setSelectedPainPoints(options);
                      }}
                    >
                      {painPoints.map(painPoint => (
                        <option key={painPoint} value={painPoint}>{painPoint}</option>
                      ))}
                    </select>
                    {selectedPainPoints.length > 0 && (
                      <button 
                        className="mt-1 text-xs text-[#e84c2b] hover:underline"
                        onClick={() => setSelectedPainPoints([])}
                      >
                        Clear selection
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Goal:</label>
                    <select 
                      className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#e84c2b] focus:border-[#e84c2b]"
                      multiple
                      value={selectedGoals}
                      onChange={(e) => {
                        const options = Array.from(e.target.selectedOptions, option => option.value);
                        setSelectedGoals(options);
                      }}
                    >
                      {goals.map(goal => (
                        <option key={goal} value={goal}>{goal}</option>
                      ))}
                    </select>
                    {selectedGoals.length > 0 && (
                      <button 
                        className="mt-1 text-xs text-[#e84c2b] hover:underline"
                        onClick={() => setSelectedGoals([])}
                      >
                        Clear selection
                      </button>
                    )}
                  </div>
                </div>
                
                {(roles.length === 0 || painPoints.length === 0 || goals.length === 0) && (
                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {}}
                      className="flex items-center gap-2"
                    >
                      <span>Populate Filter Values</span>
                    </Button>
                  </div>
                )}
                <div>
                  <CapabilitiesTable 
                    capabilities={filteredCapabilities}
                    onCapabilityClick={handleCapabilityClick}
                    currentPage={currentPageCapabilities}
                    itemsPerPage={ITEMS_PER_PAGE}
                  />
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
          </TabsContent>

          <TabsContent value="performance-metrics" className="space-y-6">
            <PerformanceMetricsTable />
          </TabsContent>
          
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

          <TabsContent value="ai-tools" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Tool Recommendations</CardTitle>
                <CardDescription>
                  AI tools that can implement the capabilities relevant to your organization, with their mapped AI capabilities.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="w-full flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <CategoryFilter 
                      allCategories={allUniqueCategories}
                      selectedCategories={selectedCategories}
                      onChange={handleCategoryChange}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Role:</label>
                    <select 
                      className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#e84c2b] focus:border-[#e84c2b]"
                      multiple
                      value={selectedRoles}
                      onChange={(e) => {
                        const options = Array.from(e.target.selectedOptions, option => option.value);
                        setSelectedRoles(options);
                      }}
                    >
                      {roles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    {selectedRoles.length > 0 && (
                      <button 
                        className="mt-1 text-xs text-[#e84c2b] hover:underline"
                        onClick={() => setSelectedRoles([])}
                      >
                        Clear selection
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Pain Point:</label>
                    <select 
                      className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#e84c2b] focus:border-[#e84c2b]"
                      multiple
                      value={selectedPainPoints}
                      onChange={(e) => {
                        const options = Array.from(e.target.selectedOptions, option => option.value);
                        setSelectedPainPoints(options);
                      }}
                    >
                      {painPoints.map(painPoint => (
                        <option key={painPoint} value={painPoint}>{painPoint}</option>
                      ))}
                    </select>
                    {selectedPainPoints.length > 0 && (
                      <button 
                        className="mt-1 text-xs text-[#e84c2b] hover:underline"
                        onClick={() => setSelectedPainPoints([])}
                      >
                        Clear selection
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Goal:</label>
                    <select 
                      className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#e84c2b] focus:border-[#e84c2b]"
                      multiple
                      value={selectedGoals}
                      onChange={(e) => {
                        const options = Array.from(e.target.selectedOptions, option => option.value);
                        setSelectedGoals(options);
                      }}
                    >
                      {goals.map(goal => (
                        <option key={goal} value={goal}>{goal}</option>
                      ))}
                    </select>
                    {selectedGoals.length > 0 && (
                      <button 
                        className="mt-1 text-xs text-[#e84c2b] hover:underline"
                        onClick={() => setSelectedGoals([])}
                      >
                        Clear selection
                      </button>
                    )}
                  </div>
                </div>
                
                {(roles.length === 0 || painPoints.length === 0 || goals.length === 0) && (
                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {}}
                      className="flex items-center gap-2"
                    >
                      <span>Populate Filter Values</span>
                    </Button>
                  </div>
                )}
                <div>
                  <AIToolsTable 
                    tools={filteredTools}
                  />
                </div>
              </CardContent>
            </Card>
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
        reportId={reportDetails.id}
      />

      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-[#e84c2b]" />
              Share Report
            </DialogTitle>
            <DialogDescription>
              Send a link to this report to someone via email. They'll be able to view the report using the same link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="share-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                id="share-email"
                type="email"
                placeholder="Enter email address..."
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSharing) {
                    handleShare()
                  }
                }}
              />
            </div>
            <div className="text-sm text-gray-500">
              <strong>Report:</strong> {reportTitle}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsShareModalOpen(false)
                setShareEmail("")
              }}
              disabled={isSharing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleShare}
              disabled={isSharing || !shareEmail.trim()}
              className="bg-[#e84c2b] hover:bg-[#d63916] text-white"
            >
              {isSharing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Link
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
