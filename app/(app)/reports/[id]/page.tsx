"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Download, Printer, Share2, FileSpreadsheet, FileText, Pencil, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PriorityMatrix } from "./priority-matrix"
import { OpportunitiesTable } from "./opportunities-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { addPrintStyles } from "../../../../utils/print-styles"

// Import existing report components for fallback
import ReportView from '@/components/report/ReportView'
import { Report, Assessment, HeatmapData, PrioritizedItem, AISuggestion, PerformanceImpact } from '@shared/schema'

// Keep the fetching function as server action
async function getReportData(id: number): Promise<{ report: Report | null, assessment: Assessment | null }> {
  // This is a placeholder. In the implementation, we'll use the server's getReportData
  return { report: null, assessment: null }
}

interface ReportPageProps {
  params: { id: string }
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default function ReportPage({ params }: ReportPageProps) {
  const router = useRouter()
  const reportId = parseInt(params.id, 10)
  
  const [activeTab, setActiveTab] = useState("overview")
  const [department, setDepartment] = useState("All Departments")
  const [priority, setPriority] = useState("All Priorities")
  const [valueThreshold, setValueThreshold] = useState("All Values")
  const [matrixVisible, setMatrixVisible] = useState(false)

  // State for report data
  const [reportData, setReportData] = useState<Report | null>(null)
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for consultant commentary
  const [commentary, setCommentary] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [tempCommentary, setTempCommentary] = useState("")
  
  // Add print styles on mount
  useEffect(() => {
    addPrintStyles()
  }, [])
  
  // Fetch report data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Use fetch for client-side data fetching
        const response = await fetch(`/api/reports/${reportId}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch report: ${response.statusText}`)
        }
        
        const reportData = await response.json()
        setReportData(reportData.report)
        setAssessment(reportData.assessment)
        
        if (reportData.report?.consultantCommentary) {
          setCommentary(reportData.report.consultantCommentary)
        }
      } catch (err) {
        console.error("Error fetching report:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }
    
    if (reportId) {
      fetchData()
    }
  }, [reportId])

  // Effect to track when matrix tab becomes visible
  useEffect(() => {
    setMatrixVisible(activeTab === "matrix")
  }, [activeTab])

  // Prepare data for display
  const prioritizationData = reportData?.prioritizationData as { 
    heatmap: HeatmapData
    prioritizedItems: PrioritizedItem[] 
  } | undefined

  // Filter opportunities based on selected filters
  const filteredOpportunities = prioritizationData?.prioritizedItems
    ? prioritizationData.prioritizedItems.filter((opp) => {
        if (department !== "All Departments" && opp.department !== department) return false
        
        // Convert priority for comparison (assuming priority field uses PriorityLevel format)
        const itemPriority = typeof opp.priority === 'string' ? 
          (opp.priority === "high" ? "High" : 
           opp.priority === "medium" ? "Medium" : "Low") : "Medium"
        
        if (priority !== "All Priorities" && itemPriority !== priority) return false

        // Filter by value score
        if (valueThreshold === "High Value (75+)" && (opp.valueScore || 0) < 75) return false
        if (valueThreshold === "Medium Value (50-74)" && ((opp.valueScore || 0) < 50 || (opp.valueScore || 0) >= 75)) return false
        if (valueThreshold === "Low Value (<50)" && (opp.valueScore || 0) >= 50) return false

        return true
      })
    : []

  const handleExportPDF = () => {
    // In a real implementation, this would use a library like jsPDF
    // For now, we'll just use the browser's print functionality with a PDF option
    window.print()
  }

  const handleExportCSV = (data: PrioritizedItem[]) => {
    // Simple CSV export
    const rows = [
      // Header row
      ['Rank', 'Role/Function', 'Department', 'Value Score', 'Effort Score', 'Priority'],
      // Data rows
      ...data.map((item, index) => [
        (index + 1).toString(),
        (item.title || "Unknown").toString(),
        (item.department || "General").toString(),
        (item.valueScore || 0).toString(),
        (item.effortScore || 0).toString(),
        (item.priority || "medium").toString(),
      ])
    ]
    
    // Convert to CSV format
    const csvContent = rows.map(row => row.map(cell => 
      cell.includes(',') ? `"${cell}"` : cell
    ).join(',')).join('\n')
    
    // Download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `ai-transformation-opportunities-${reportData?.id || 'export'}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportExcel = (data: PrioritizedItem[]) => {
    // For Excel export, we'd use a library like xlsx
    // In this implementation, we'll just use CSV as a fallback
    handleExportCSV(data)
  }

  const startEditing = () => {
    setTempCommentary(commentary)
    setIsEditing(true)
  }

  const saveCommentary = async () => {
    try {
      // In a real implementation, this would update the commentary via API
      // For now, we'll just update the local state
      setCommentary(tempCommentary)
      setIsEditing(false)
      
      // Here you would make an API call to save the commentary
      /* Example:
      await fetch(`/api/reports/${reportId}/commentary`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentary: tempCommentary })
      })
      */
    } catch (err) {
      console.error("Error saving commentary:", err)
    }
  }

  const cancelEditing = () => {
    setTempCommentary(commentary)
    setIsEditing(false)
  }

  // Generate department options from the actual data
  const departmentSet = new Set<string>()
  departmentSet.add("All Departments")
  prioritizationData?.prioritizedItems?.forEach(item => {
    if (item.department) {
      departmentSet.add(item.department)
    }
  })
  const departments = Array.from(departmentSet)

  // If still loading, show a loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e84c2b]"></div>
      </div>
    )
  }

  // If there's an error or no data, show an error state
  if (error || !reportData) {
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

  // Fallback to the old ReportView component if needed
  const useLegacyView = false // Toggle this based on feature flags or user preferences
  
  if (useLegacyView) {
    const defaultHeatmap: HeatmapData = { matrix: {} as HeatmapData['matrix'] }
    const defaultPrioritizedItems: PrioritizedItem[] = []
    
    const reportViewProps = {
      title: assessment?.title || `Assessment ${reportData.assessmentId}`,
      generatedAt: reportData.generatedAt,
      executiveSummary: reportData.executiveSummary || "",
      prioritizationData: prioritizationData || { 
        heatmap: defaultHeatmap, 
        prioritizedItems: defaultPrioritizedItems 
      },
      aiSuggestions: (reportData.aiSuggestions as AISuggestion[] | null) || [],
      performanceImpact: (reportData.performanceImpact as PerformanceImpact | null) || { 
        roleImpacts: [], 
        estimatedRoi: 0 
      },
      consultantCommentary: reportData.consultantCommentary || "",
      isEditable: false,
      onUpdateCommentary: undefined,
    }
    
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            Report for {assessment?.title || `Assessment ${reportData.assessmentId}`}
          </h1>
          <p className="text-muted-foreground">
            Generated on {new Date(reportData.generatedAt).toLocaleString()}
          </p>
        </div>
        
        <ReportView {...reportViewProps} />
      </div>
    )
  }

  // New UI implementation
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto py-6 px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Report for {assessment?.title || `Assessment ${reportData.assessmentId}`}</h1>
              <p className="text-gray-500">
                Generated on {new Date(reportData.generatedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-gray-700 border-gray-300">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white border-gray-200 text-gray-700">
                  <DropdownMenuItem onClick={() => window.print()} className="cursor-pointer">
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportPDF()} className="cursor-pointer">
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportExcel(prioritizationData?.prioritizedItems || [])} className="cursor-pointer">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportCSV(prioritizationData?.prioritizedItems || [])} className="cursor-pointer">
                    <FileText className="mr-2 h-4 w-4" />
                    Export CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" className="bg-[#e84c2b] hover:bg-[#d43c1b] text-white">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4 md:px-6">
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList className="bg-gray-200">
              <TabsTrigger
                value="overview"
                className="text-gray-700 data-[state=active]:bg-[#e84c2b] data-[state=active]:text-white"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="matrix"
                className="text-gray-700 data-[state=active]:bg-[#e84c2b] data-[state=active]:text-white"
              >
                Priority Matrix
              </TabsTrigger>
              <TabsTrigger
                value="opportunities"
                className="text-gray-700 data-[state=active]:bg-[#e84c2b] data-[state=active]:text-white"
              >
                Opportunities
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Executive Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">
                      {reportData.executiveSummary || "No executive summary available."}
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
                        ${(reportData.performanceImpact as PerformanceImpact)?.estimatedRoi || 0}
                      </h3>
                      <p className="text-sm text-gray-500">Estimated Annual ROI</p>
                    </div>
                    <p className="text-sm text-gray-600">
                      Based on time savings and increased throughput
                    </p>
                  </CardContent>
                </Card>

                <Card className="mt-6">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Consultant Commentary</CardTitle>
                    {!isEditing ? (
                      <Button variant="ghost" size="sm" onClick={startEditing} className="h-8 w-8 p-0">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    ) : (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={saveCommentary} className="h-8 w-8 p-0 text-green-600">
                          <Check className="h-4 w-4" />
                          <span className="sr-only">Save</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={cancelEditing} className="h-8 w-8 p-0 text-red-600">
                          <X className="h-4 w-4" />
                          <span className="sr-only">Cancel</span>
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
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
          <TabsContent value="matrix" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Transformation Priority Matrix</CardTitle>
                <p className="text-sm text-gray-500">
                  This heatmap shows the relative priority of different roles/functions based on potential value and implementation ease.
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                <PriorityMatrix
                  heatmapData={prioritizationData?.heatmap}
                  isVisible={matrixVisible}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Opportunities Tab */}
          <TabsContent value="opportunities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Prioritized Opportunities</CardTitle>
                <p className="text-sm text-gray-500">
                  Ranked list of roles and functions based on transformation potential.
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All Priorities">All Priorities</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Select value={valueThreshold} onValueChange={setValueThreshold}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Values" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All Values">All Values</SelectItem>
                        <SelectItem value="High Value (75+)">High Value (75+)</SelectItem>
                        <SelectItem value="Medium Value (50-74)">Medium Value (50-74)</SelectItem>
                        <SelectItem value="Low Value (<50)">Low Value (&lt;50)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <OpportunitiesTable prioritizedItems={prioritizationData?.prioritizedItems} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 