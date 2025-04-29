import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryCardProps {
  title: string;
  content: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, content }) => {
  // Split the content by paragraphs for better formatting
  const paragraphs = content.split('\n').filter(p => p.trim().length > 0);
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none text-neutral-700">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
