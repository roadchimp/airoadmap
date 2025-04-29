import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AISuggestion } from "@shared/schema";

interface AISuggestionCardProps {
  aiSuggestions: AISuggestion[];
  title: string;
}

const AISuggestionCard: React.FC<AISuggestionCardProps> = ({ aiSuggestions, title }) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {aiSuggestions.map((suggestion, index) => (
            <div key={index} className="border border-primary-100 bg-primary-50 p-4 rounded-md">
              <h4 className="font-medium text-primary-800 mb-2">{suggestion.roleTitle}</h4>
              <p className="text-sm text-primary-700 mb-3">Recommended AI capabilities to implement:</p>
              <ul className="text-sm space-y-2">
                {suggestion.capabilities.map((capability, capIndex) => (
                  <li key={capIndex} className="flex items-start">
                    <span className="material-icons text-primary-600 mr-2 text-sm">check_circle</span>
                    <div>
                      <div className="font-medium">{capability.name}</div>
                      <div className="text-xs text-neutral-600">{capability.description}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AISuggestionCard;
