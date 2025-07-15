"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { FullAICapability, ToolWithMappedCapabilities, ReportWithMetricsAndRules } from "@/server/storage"
import type { PerformanceImpact } from '@shared/schema'

interface ExecutivePdfLayoutProps {
  report: ReportWithMetricsAndRules
  capabilities: FullAICapability[]
  tools: ToolWithMappedCapabilities[]
}

export function ExecutivePdfLayout({ report, capabilities, tools }: ExecutivePdfLayoutProps) {
  // Helper functions
  const getPriorityColor = (valueScore: number) => {
    if (valueScore > 75) return "bg-[#e84c2b]"
    if (valueScore > 50) return "bg-[#f8a97a]"
    return "bg-gray-500"
  }

  const getPriorityLabel = (valueScore: number) => {
    if (valueScore > 75) return "High"
    if (valueScore > 50) return "Medium"
    return "Low"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Sort capabilities by value score for prioritization
  const sortedCapabilities = [...capabilities].sort((a, b) => {
    const aScore = Number(a.valueScore || a.default_value_score || 0)
    const bScore = Number(b.valueScore || b.default_value_score || 0)
    return bScore - aScore
  })

  // Get top capabilities for executive summary
  const topCapabilities = sortedCapabilities.slice(0, 5)

  // AI Adoption Score data - Fix data access
  const aiAdoptionData = report?.aiAdoptionScoreDetails as any
  const aiScore = aiAdoptionData?.score || aiAdoptionData?.overallScore || 0
  const aiComponents = aiAdoptionData?.components || {}

  // ROI calculations
  const performanceImpact = report.performanceImpact as PerformanceImpact
  const estimatedRoi = performanceImpact?.estimatedRoi || 0

  // Priority Matrix Helper Functions
  const getQuadrant = (capability: FullAICapability) => {
    const impact = Number(capability.valueScore || capability.default_value_score || 0)
    const feasibility = Number(capability.feasibilityScore || capability.default_feasibility_score || 0)
    if (impact > 50 && feasibility > 50) return "Quick Wins"
    if (impact > 50 && feasibility <= 50) return "Strategic Investments"
    if (impact <= 50 && feasibility > 50) return "Low-Hanging Fruit"
    return "Deprioritize"
  }

  const quadrantData = capabilities.map((cap) => ({ ...cap, quadrant: getQuadrant(cap) }))
  const quickWins = quadrantData.filter((d) => d.quadrant === "Quick Wins")
  const strategicInvestments = quadrantData.filter((d) => d.quadrant === "Strategic Investments")
  const lowHangingFruit = quadrantData.filter((d) => d.quadrant === "Low-Hanging Fruit")
  const deprioritize = quadrantData.filter((d) => d.quadrant === "Deprioritize")

  return (
    <div className="executive-pdf-layout">
      
      {/* PAGE 1: Title Page */}
      <div className="pdf-page">
        <div className="title-page">
          <div className="title-page-content">
            <div className="title-header">
              <div className="main-title">AI TRANSFORMATION<br />ASSESSMENT</div>
                             <div className="organization-name">{report.organizationName || 'Default Organization'}</div>
              <div className="assessment-subtitle">{report.assessment?.title || 'Assessment'}</div>
            </div>
            <div className="title-page-footer">
              <div className="generation-date">
                Generated on {new Date(report.generatedAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
  
      {/* PAGE 2: Executive Summary */}
      <div className="pdf-page">
        <div className="executive-summary-full-page">
          <h1 className="section-title">Executive Summary</h1>
          <div className="summary-content-full">
            {report.executiveSummary?.split('\n\n').map((paragraph, index) => (
              <p key={index} className="summary-paragraph-full">
                {paragraph.trim()}
              </p>
            )) || (
              <p className="summary-paragraph-full">
                This assessment identifies key opportunities for AI implementation across your organization, focusing on high-impact areas that align with strategic objectives and operational priorities.
              </p>
            )}
          </div>
        </div>
      </div>
  
      {/* PAGE 3: KPIs + Organization Profile + AI Adoption Score */}
      <div className="pdf-page">
        <h1 className="section-title">Key Performance Indicators</h1>
        
        <div className="metrics-grid">
          <div className="metric-card primary-metric">
            <div className="metric-header">
              <h3>AI Adoption<br />Score</h3>
              <span className="metric-subtitle">Overall Readiness</span>
            </div>
            <div className="metric-value">
              <span className="metric-number-large">{Math.round(aiScore)}</span>
              <span className="metric-unit">/100</span>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <h3>Expected ROI</h3>
              <span className="metric-subtitle">Annual Impact</span>
            </div>
            <div className="metric-value">
              <span className="metric-number-small">{formatCurrency(estimatedRoi)}</span>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <h3>High-Priority<br />Opportunities</h3>
              <span className="metric-subtitle">Ready for Implementation</span>
            </div>
            <div className="metric-value">
              <span className="metric-number-small">{topCapabilities.length}</span>
              <span className="metric-unit">capabilities</span>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <h3>Implementation<br />Timeline</h3>
              <span className="metric-subtitle">Quick Wins Available</span>
            </div>
            <div className="metric-value">
              <span className="metric-number-small">3-6</span>
              <span className="metric-unit">months</span>
            </div>
          </div>
        </div>
  
        <h2 className="subsection-title">Organization Profile</h2>
        <div className="company-profile">
          <div className="profile-grid">
            <div className="profile-item">
              <span className="profile-label">Industry</span>
              <span className="profile-value">{report.assessment?.industry || 'Software & Technology'} (Mature)</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Growth Stage</span>
                             <span className="profile-value">{report.assessment?.companyStage || 'Early Growth'}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Strategic Focus</span>
              <span className="profile-value">{report.assessment?.strategicFocus || 'Efficiency & Productivity'}</span>
            </div>
          </div>
        </div>
  
        <h2 className="subsection-title">AI Adoption Score™ Analysis</h2>
        <p className="section-subtitle">Detailed breakdown of organizational AI readiness factors</p>
        
        <div className="score-breakdown compact-page3">
          <div className="score-components">
            {Object.entries(aiComponents).map(([key, value]) => (
              <div key={key} className="score-component">
                <div className="component-header">
                  <span className="component-label">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                  <span className="component-score">{Math.round(Number(value) || 0)}%</span>
                </div>
                <div className="component-bar">
                  <div className="component-fill" style={{ width: `${Number(value) || 0}%` }}></div>
                </div>
                <p className="component-description">
                  {key === 'timeSavings' && 'Contribution to overall AI adoption readiness'}
                  {key === 'adoptionRate' && 'Percentage of users actively leveraging AI tools on a monthly basis'}
                  {key === 'costEfficiency' && 'Cost-effectiveness ratio of AI licenses versus equivalent human labor'}
                  {key === 'toolSprawlReduction' && 'Contribution to overall AI adoption readiness'}
                  {key === 'performanceImprovement' && 'Aggregate improvement across key performance metrics'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
  
            {/* PAGE 4: Priority Matrix */}
      <div className="pdf-page">
        <h1 className="section-title">AI Capability Prioritization Matrix</h1>
        <p className="section-subtitle">Strategic positioning of capabilities by business value and implementation feasibility</p>
        
        <div className="priority-matrix">
          <div className="matrix-container">
            <div className="matrix-grid">
              <div className="quadrant strategic-investments">
                <div className="quadrant-title">Strategic Investments</div>
                <div className="quadrant-count">{strategicInvestments.length}</div>
                <div className="quadrant-subtitle">High Value, Complex Implementation</div>
              </div>
              <div className="quadrant quick-wins">
                <div className="quadrant-title">Quick Wins</div>
                <div className="quadrant-count">{quickWins.length}</div>
                <div className="quadrant-subtitle">High Value, Easy Implementation</div>
              </div>
              <div className="quadrant deprioritize">
                <div className="quadrant-title">Deprioritize</div>
                <div className="quadrant-count">{deprioritize.length}</div>
                <div className="quadrant-subtitle">Low Value, Complex Implementation</div>
              </div>
              <div className="quadrant low-hanging-fruit">
                <div className="quadrant-title">Low-Hanging Fruit</div>
                <div className="quadrant-count">{lowHangingFruit.length}</div>
                <div className="quadrant-subtitle">Low Value, Easy Implementation</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 5: Strategic Recommendations */}
      <div className="pdf-page">
        <h1 className="section-title">Strategic Recommendations</h1>
        <p className="section-subtitle">Prioritized AI capabilities ranked by business value and implementation feasibility</p>
        
        <div className="recommendations-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priority</TableHead>
                <TableHead>AI Capability</TableHead>
                <TableHead>Business Value</TableHead>
                <TableHead>Implementation</TableHead>
                <TableHead>Timeline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCapabilities.slice(0, 5).map((capability, index) => {
                const valueScore = Number(capability.valueScore || capability.default_value_score || 0)
                const feasibilityScore = Number(capability.feasibilityScore || capability.default_feasibility_score || 0)
                
                return (
                  <TableRow key={capability.id}>
                    <TableCell>
                      <div className="priority-cell">
                        <span className="priority-number">{index + 1}</span>
                        <Badge className={`priority-badge ${getPriorityColor(valueScore)}`}>
                          {getPriorityLabel(valueScore)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="capability-cell">
                        <span className="capability-name">{capability.name}</span>
                        <span className="capability-category">{capability.category}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="score-cell">
                        <span className="score-number">{Math.round(valueScore)}</span>
                        <div className="score-bar">
                          <div className="score-fill" style={{ width: `${valueScore}%` }}></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="score-cell">
                        <span className="score-number">{Math.round(feasibilityScore)}</span>
                        <div className="score-bar">
                          <div className="score-fill" style={{ width: `${feasibilityScore}%` }}></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="timeline-badge">
                        {feasibilityScore > 75 ? '1-3 months' : 
                         feasibilityScore > 50 ? '3-6 months' : '6-12 months'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
  
      {/* PAGE 6: Implementation Roadmap + Tools + Commentary */}
      <div className="pdf-page">
        <h1 className="section-title">Implementation Roadmap</h1>
        <p className="section-subtitle">Phased approach to AI transformation</p>
        
        <div className="roadmap-condensed">
          <div className="roadmap-phases-grid">
            <div className="phase-card">
              <div className="phase-header">
                <h3 className="phase-title">Phase 1: Quick Wins</h3>
                <div className="phase-timeline">Months 1-3</div>
              </div>
              <ul className="phase-items-compact">
                {quickWins.slice(0, 3).map((capability, index) => (
                  <li key={index} className="phase-item-compact">{capability.name}</li>
                ))}
              </ul>
            </div>
            
            <div className="phase-card">
              <div className="phase-header">
                <h3 className="phase-title">Phase 2: Strategic Initiatives</h3>
                <div className="phase-timeline">Months 4-9</div>
              </div>
              <ul className="phase-items-compact">
                {strategicInvestments.slice(0, 3).map((capability, index) => (
                  <li key={index} className="phase-item-compact">{capability.name}</li>
                ))}
              </ul>
            </div>
            
            <div className="phase-card">
              <div className="phase-header">
                <h3 className="phase-title">Phase 3: Advanced Capabilities</h3>
                <div className="phase-timeline">Months 10-12</div>
              </div>
              <ul className="phase-items-compact">
                {lowHangingFruit.slice(0, 3).map((capability, index) => (
                  <li key={index} className="phase-item-compact">{capability.name}</li>
                ))}
              </ul>
            </div>
          </div>
  
          <div className="next-steps-condensed">
            <h3 className="subsection-title">Recommended Next Steps</h3>
            <ul className="next-steps-list-compact">
              <li>Establish AI governance framework and steering committee</li>
              <li>Begin Phase 1 implementation with highest-priority capabilities</li>
              <li>Develop change management plan and training programs</li>
              <li>Set up success metrics and monitoring systems</li>
              <li>Plan resource allocation for subsequent phases</li>
            </ul>
          </div>
        </div>
  
        <h2 className="subsection-title">Appendix: Recommended AI Tools</h2>
        <div className="tools-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Use Case</TableHead>
                <TableHead>License</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tools.slice(0, 5).map((tool, index) => (
                <TableRow key={index}>
                  <TableCell className="tool-name">{tool.tool_name}</TableCell>
                  <TableCell className="tool-category">{tool.primary_category}</TableCell>
                  <TableCell className="tool-description">{tool.description || 'AI automation and optimization'}</TableCell>
                  <TableCell className="tool-license">{tool.license_type || 'Commercial'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
  
        <h2 className="subsection-title">Consultant Commentary</h2>
        <div className="consultant-commentary">
          <p className="commentary-content">
            This assessment provides a comprehensive analysis of AI transformation opportunities tailored to your organization's specific context, industry, and strategic objectives. The recommendations prioritize high-impact, feasible implementations that can deliver measurable business value in the near term while building foundation for long-term AI adoption.
          </p>
        </div>
      </div>
  
    </div>
  )
  
}

// Helper function for component descriptions
function getComponentDescription(key: string): string {
  const descriptions: Record<string, string> = {
    adoptionRate: "Percentage of users actively leveraging AI tools on a monthly basis",
    timeSaved: "Average time savings per user through AI automation and assistance", 
    costEfficiency: "Cost-effectiveness ratio of AI licenses versus equivalent human labor",
    performanceImprovement: "Aggregate improvement across key performance metrics",
    toolSprawl: "Impact on tool consolidation versus fragmentation"
  }
  return descriptions[key] || "Contribution to overall AI adoption readiness"
} 