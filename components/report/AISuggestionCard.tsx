import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AISuggestion } from "@shared/schema";
import { ExternalLink } from "lucide-react";

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
              <ul className="text-sm space-y-4">
                {suggestion.capabilities.map((capability, capIndex) => (
                  <li key={capIndex} className="flex items-start">
                    <span className="material-icons text-primary-600 mr-2 text-sm">check_circle</span>
                    <div className="w-full">
                      <div className="font-medium">{capability.name}</div>
                      <div className="text-xs text-neutral-600 mb-2">{capability.description}</div>
                      
                      {/* Recommended AI Tools */}
                      {capability.recommendedTools && capability.recommendedTools.length > 0 && (
                        <div className="mt-2 bg-white p-2 rounded border border-primary-100">
                          <p className="text-xs font-medium text-primary-700 mb-1">Recommended Tools:</p>
                          <div className="flex flex-wrap gap-2">
                            {capability.recommendedTools.map((tool, toolIndex) => (
                              <div key={toolIndex} className="flex items-center bg-primary-50 px-2 py-1 rounded text-xs">
                                <span className="font-medium">{tool.name}</span>
                                {tool.websiteUrl && (
                                  <a 
                                    href={tool.websiteUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="ml-1 text-primary-600 hover:text-primary-800"
                                  >
                                    <ExternalLink size={12} />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
