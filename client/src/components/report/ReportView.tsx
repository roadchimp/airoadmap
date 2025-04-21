import React from "react";
import { Button } from "@/components/ui/button";
import SummaryCard from "./SummaryCard";
import HeatmapDisplay from "./HeatmapDisplay";
import PrioritizationList from "./PrioritizationList";
import AISuggestionCard from "./AISuggestionCard";
import KPIPlaceholderCard from "./KPIPlaceholderCard";
import CommentaryBox from "./CommentaryBox";
import { PrioritizedItem, HeatmapData, AISuggestion, PerformanceImpact } from "@shared/schema";

interface ReportViewProps {
  title: string;
  generatedAt: Date;
  executiveSummary: string;
  prioritizationData: {
    heatmap: HeatmapData;
    prioritizedItems: PrioritizedItem[];
  };
  aiSuggestions: AISuggestion[];
  performanceImpact: PerformanceImpact;
  consultantCommentary: string;
  onUpdateCommentary?: (commentary: string) => void;
  isEditable?: boolean;
}

const ReportView: React.FC<ReportViewProps> = ({
  title,
  generatedAt,
  executiveSummary,
  prioritizationData,
  aiSuggestions,
  performanceImpact,
  consultantCommentary,
  onUpdateCommentary,
  isEditable = false
}) => {
  const handlePrint = () => {
    window.print();
  };
  
  const handleExportPDF = () => {
    // In a real implementation, this would generate a PDF
    alert("Export to PDF functionality would be implemented here");
  };
  
  const handleShare = () => {
    // In a real implementation, this would show sharing options
    alert("Share functionality would be implemented here");
  };
  
  const formattedDate = new Date(generatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  
  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="text-neutral-500 text-sm">Generated on {formattedDate}</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <span className="material-icons text-sm mr-1 align-text-bottom">print</span>
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <span className="material-icons text-sm mr-1 align-text-bottom">download</span>
            Export PDF
          </Button>
          <Button onClick={handleShare}>
            <span className="material-icons text-sm mr-1 align-text-bottom">share</span>
            Share
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SummaryCard title="Executive Summary" content={executiveSummary} />
          
          <HeatmapDisplay
            heatmapData={prioritizationData.heatmap}
            title="AI Transformation Priority Matrix"
            description="This heatmap shows the relative priority of different roles/functions based on potential value and implementation ease."
          />
          
          <PrioritizationList
            prioritizedItems={prioritizationData.prioritizedItems}
            title="Prioritized Opportunities"
            description="Ranked list of roles and functions based on transformation potential."
          />
        </div>
        
        <div>
          <AISuggestionCard
            aiSuggestions={aiSuggestions}
            title="AI Solution Recommendations"
          />
          
          <KPIPlaceholderCard
            performanceImpact={performanceImpact}
            title="Expected Performance Impact"
          />
          
          <CommentaryBox
            commentary={consultantCommentary}
            title="Consultant Commentary"
            onUpdate={onUpdateCommentary}
            isEditable={isEditable}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportView;
