"use client"

import { PrioritizedItem } from "@shared/schema"
import OpportunitiesTab from "@/components/report/OpportunitiesTab"

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
  // If we have legacy format data, convert it to the PrioritizedItem format
  const formattedItems: PrioritizedItem[] = opportunities 
    ? opportunities.map(opp => ({
        id: opp.id,
        title: opp.role || "Unknown Role",
        department: opp.department || "",
        valueScore: opp.valueScore,
        effortScore: opp.effortScore,
        priority: mapPriorityToLevel(opp.priority),
        valueLevel: mapValueToLevel(opp.valueScore),
        effortLevel: mapEffortToLevel(opp.effortScore)
      }))
    : prioritizedItems || [];

  // Helper function to convert display label to PriorityLevel
  function mapPriorityToLevel(priority: string) {
    switch (priority.toLowerCase()) {
      case "high": return "high"
      case "medium": return "medium" 
      case "low": return "low"
      default: return "medium"
    }
  }

  // Helper function to map value score to value level
  function mapValueToLevel(score: number) {
    if (score >= 80) return "high";
    if (score >= 60) return "medium";
    return "low";
  }

  // Helper function to map effort score to effort level
  function mapEffortToLevel(score: number) {
    if (score >= 80) return "high";
    if (score >= 60) return "medium";
    return "low";
  }

  return (
    <OpportunitiesTab 
      prioritizedItems={formattedItems}
      title="Prioritized Opportunities"
      description="Ranked list of roles and functions based on transformation potential."
    />
  )
} 