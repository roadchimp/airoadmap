"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PrioritizedItem, PriorityLevel } from "@shared/schema"

// Interface based on our app-specific schema understanding
interface Opportunity {
  id: number
  rank: number
  role: string
  department: string
  valueScore: number
  effortScore: number
  priority: string
}

interface OpportunitiesTableProps {
  opportunities?: Opportunity[]
  prioritizedItems?: PrioritizedItem[]
}

export function OpportunitiesTable({ opportunities, prioritizedItems }: OpportunitiesTableProps) {
  // Prepare data from either opportunities or prioritizedItems
  const tableData = opportunities || 
    (prioritizedItems?.map((item, index) => ({
      id: index + 1,
      rank: index + 1,
      role: item.title, // Use title from schema
      department: item.department || "General",
      valueScore: item.valueScore || 0,
      effortScore: item.effortScore || 0,
      priority: mapPriorityFromLevel(item.priority)
    })) || [])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-[#e84c2b] hover:bg-[#e84c2b]/80"
      case "Medium":
        return "bg-[#f8a97a] hover:bg-[#f8a97a]/80"
      case "Low":
        return "bg-gray-700 hover:bg-gray-700/80"
      default:
        return "bg-gray-700 hover:bg-gray-700/80"
    }
  }

  // Helper function to convert PriorityLevel to display label
  function mapPriorityFromLevel(priority: PriorityLevel): string {
    switch (priority) {
      case "high": return "High"
      case "medium": return "Medium" 
      case "low": return "Low"
      case "not_recommended": return "Low"
      default: return "Medium"
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-gray-200">
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="text-gray-700 w-[80px]">Rank</TableHead>
              <TableHead className="text-gray-700">Role/Function</TableHead>
              <TableHead className="text-gray-700">Department</TableHead>
              <TableHead className="text-gray-700">Value Score</TableHead>
              <TableHead className="text-gray-700">Effort Score</TableHead>
              <TableHead className="text-gray-700">Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                  No opportunities match the selected filters
                </TableCell>
              </TableRow>
            ) : (
              tableData.map((opp) => (
                <TableRow key={opp.id} className="border-gray-200">
                  <TableCell className="font-medium">{opp.rank}</TableCell>
                  <TableCell>{opp.role}</TableCell>
                  <TableCell>{opp.department}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={opp.valueScore}
                        className="h-2 w-24 bg-gray-200"
                      />
                      <span>{opp.valueScore}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={100 - opp.effortScore}
                        className="h-2 w-24 bg-gray-200"
                      />
                      <span>{opp.effortScore}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getPriorityColor(opp.priority)} text-white`}>{opp.priority}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 