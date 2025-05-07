"use client"

import { useRef, useEffect, useState } from "react"
import * as d3 from "d3"
import { HeatmapData, ValueLevel, EffortLevel, PriorityLevel } from "@shared/schema"

interface MatrixItem {
  x: number
  y: number
  value: string
  priority: string
}

interface PriorityMatrixProps {
  data?: MatrixItem[] 
  heatmapData?: HeatmapData
  isVisible: boolean // Prop to know when the matrix is visible
}

export function PriorityMatrix({ data, heatmapData, isVisible }: PriorityMatrixProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [matrixData, setMatrixData] = useState<MatrixItem[]>([])

  // Process heatmapData if provided
  useEffect(() => {
    if (data) {
      setMatrixData(data)
    } else if (heatmapData?.matrix) {
      try {
        // Convert heatmapData to the format needed for the matrix
        const convertedData: MatrixItem[] = []
        
        // Handle both possible formats of heatmapData.matrix
        if ('high' in heatmapData.matrix && 'medium' in heatmapData.matrix && 'low' in heatmapData.matrix) {
          // Complex nested structure
          const valueLevels: (keyof typeof heatmapData.matrix)[] = ['high', 'medium', 'low']
          const effortLevels = ['high', 'medium', 'low']
          
          valueLevels.forEach((valueLevel, valueIndex) => {
            const valueSection = heatmapData.matrix[valueLevel]
            if (valueSection) {
              effortLevels.forEach((effortLevel, effortIndex) => {
                const effortSection = valueSection[effortLevel as keyof typeof valueSection]
                if (effortSection && typeof effortSection === 'object' && 'priority' in effortSection) {
                  const priority = effortSection.priority as PriorityLevel
                  convertedData.push({
                    x: effortIndex,
                    y: valueIndex,
                    value: getPriorityLabel(priority),
                    priority: priority
                  })
                }
              })
            }
          })
        } else {
          // Simple flattened structure with keys like "high_low"
          const valueLevels = ["high", "medium", "low"] as const
          const effortLevels = ["high", "medium", "low"] as const
          
          valueLevels.forEach((value, valueIndex) => {
            effortLevels.forEach((effort, effortIndex) => {
              // Try both formats: "high_low" and "HIGH_LOW"
              const key1 = `${value}_${effort}` as keyof typeof heatmapData.matrix
              const key2 = `${value.toUpperCase()}_${effort.toUpperCase()}` as keyof typeof heatmapData.matrix
              
              let priority: PriorityLevel
              if (typeof key1 === 'string' && key1 in heatmapData.matrix) {
                priority = (heatmapData.matrix as unknown as Record<string, PriorityLevel>)[key1]
              } else if (typeof key2 === 'string' && key2 in heatmapData.matrix) {
                priority = (heatmapData.matrix as unknown as Record<string, PriorityLevel>)[key2]
              } else {
                priority = "medium" as PriorityLevel // Default
              }
              
              convertedData.push({
                x: effortIndex,
                y: valueIndex,
                value: getPriorityLabel(priority),
                priority: priority
              })
            })
          })
        }
        
        // If we couldn't generate any data, create a default 3x3 grid
        if (convertedData.length === 0) {
          const defaultPriorities = [
            "low", "low", "medium",
            "low", "medium", "high",
            "medium", "high", "high"
          ] as PriorityLevel[]
          
          for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
              const index = y * 3 + x
              const priority = defaultPriorities[index]
              convertedData.push({
                x,
                y,
                value: getPriorityLabel(priority),
                priority
              })
            }
          }
        }
        
        setMatrixData(convertedData)
      } catch (err) {
        console.error("Error processing heatmap data:", err)
        // Create default matrix if there's an error
        setMatrixData(createDefaultMatrix())
      }
    } else {
      // Create default matrix if no data is provided
      setMatrixData(createDefaultMatrix())
    }
  }, [data, heatmapData])

  // Create a default matrix
  const createDefaultMatrix = (): MatrixItem[] => {
    const defaultPriorities = [
      "low", "low", "medium",
      "low", "medium", "high",
      "medium", "high", "high"
    ] as PriorityLevel[]
    
    const result: MatrixItem[] = []
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const index = y * 3 + x
        const priority = defaultPriorities[index]
        result.push({
          x,
          y,
          value: getPriorityLabel(priority),
          priority
        })
      }
    }
    return result
  }

  // Helper function to convert PriorityLevel to display label
  const getPriorityLabel = (priority: PriorityLevel | string): string => {
    switch (priority) {
      case "high": return "Transform"
      case "medium": return "Monitor"
      case "low": return "Consider"
      case "not_recommended": return "Deprioritize"
      case "HIGH": return "Transform"
      case "MEDIUM": return "Monitor"
      case "LOW": return "Consider"
      case "IGNORE": return "Deprioritize"
      default: return "Consider"
    }
  }

  // Function to render the matrix
  const renderMatrix = () => {
    if (!svgRef.current || matrixData.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    // Skip rendering if dimensions are not available yet
    if (width === 0 || height === 0) return

    // Increase left margin to prevent overlap
    const margin = { top: 50, right: 50, bottom: 100, left: 150 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom

    const cellWidth = innerWidth / 3
    const cellHeight = innerHeight / 3

    // Create color scale
    const colorScale = (priority: string) => {
      switch (priority.toLowerCase()) {
        case "high":
          return "#e84c2b"
        case "medium":
          return "#f8a97a"
        case "low":
        case "not_recommended":
          return "#e2e8f0"
        default:
          return "#e2e8f0"
      }
    }

    // Create the main group
    const g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`)

    // Add cells
    g.selectAll("rect")
      .data(matrixData)
      .enter()
      .append("rect")
      .attr("x", (d) => d.x * cellWidth)
      .attr("y", (d) => (2 - d.y) * cellHeight) // Invert y-axis
      .attr("width", cellWidth)
      .attr("height", cellHeight)
      .attr("fill", (d) => colorScale(d.priority))
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 2)
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("opacity", 0.9)

    // Add text labels
    g.selectAll("text.cell-label")
      .data(matrixData)
      .enter()
      .append("text")
      .attr("class", "cell-label")
      .attr("x", (d) => d.x * cellWidth + cellWidth / 2)
      .attr("y", (d) => (2 - d.y) * cellHeight + cellHeight / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", (d) => (d.priority.toLowerCase() === "low" ? "#4b5563" : "white"))
      .attr("font-weight", "bold")
      .text((d) => d.value)

    // Add x-axis labels with better positioning
    const xLabels = ["High Effort", "Medium Effort", "Low Effort"]
    g.selectAll(".x-label")
      .data(xLabels)
      .enter()
      .append("text")
      .attr("class", "x-label")
      .attr("x", (d, i) => i * cellWidth + cellWidth / 2)
      .attr("y", innerHeight + 30) // Position closer to the matrix
      .attr("text-anchor", "middle")
      .attr("fill", "#4b5563")
      .attr("font-size", "14px")
      .text((d) => d)

    // Add y-axis labels with better positioning
    const yLabels = ["Low Value", "Medium Value", "High Value"]
    g.selectAll(".y-label")
      .data(yLabels)
      .enter()
      .append("text")
      .attr("class", "y-label")
      .attr("x", -20) // Position closer to the matrix but not too close
      .attr("y", (d, i) => (2 - i) * cellHeight + cellHeight / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("fill", "#4b5563")
      .attr("font-size", "14px")
      .text((d) => d)

    // Add axis titles with better positioning
    // X-axis title (Implementation Effort)
    g.append("text")
      .attr("class", "axis-title")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 70) // Position further from the axis labels
      .attr("text-anchor", "middle")
      .attr("fill", "#4b5563")
      .attr("font-weight", "bold")
      .attr("font-size", "16px")
      .text("Implementation Effort")

    // Y-axis title (Business Value) - Move it further left to avoid overlap
    g.append("text")
      .attr("class", "axis-title")
      .attr("transform", `rotate(-90)`)
      .attr("x", -innerHeight / 2)
      .attr("y", -110) // Move further left to avoid overlap with y-axis labels
      .attr("text-anchor", "middle")
      .attr("fill", "#4b5563")
      .attr("font-weight", "bold")
      .attr("font-size", "16px")
      .text("Business Value")

    setIsInitialized(true)
  }

  // Effect to handle initial render and visibility changes
  useEffect(() => {
    if (isVisible) {
      // Use a small timeout to ensure the DOM has updated
      const timer = setTimeout(() => {
        renderMatrix()
      }, 50)

      return () => clearTimeout(timer)
    }
  }, [isVisible, matrixData])

  // Effect to handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isVisible) {
        renderMatrix()
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [isVisible, matrixData])

  return (
    <div className="relative w-full h-[500px]">
      <svg ref={svgRef} width="100%" height="100%" className="overflow-visible"></svg>
      {!isInitialized && isVisible && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e84c2b]"></div>
        </div>
      )}
    </div>
  )
} 