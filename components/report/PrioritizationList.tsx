import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PrioritizedItem } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PrioritizationListProps {
  prioritizedItems: PrioritizedItem[];
  title: string;
  description?: string;
}

const PrioritizationList: React.FC<PrioritizationListProps> = ({
  prioritizedItems,
  title,
  description
}) => {
  // Define priority badge styling
  const priorityBadges = {
    high: "bg-red-100 text-red-800",
    medium: "bg-orange-100 text-orange-800",
    low: "bg-yellow-100 text-yellow-800",
    not_recommended: "bg-green-100 text-green-800"
  };
  
  const priorityLabels = {
    high: "High",
    medium: "Medium",
    low: "Low",
    not_recommended: "Not Recommended"
  };
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Rank</TableHead>
                <TableHead>Role/Function</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Value Score</TableHead>
                <TableHead>Effort Score</TableHead>
                <TableHead>Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prioritizedItems.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-neutral-600">{item.department}</TableCell>
                  <TableCell>{item.valueScore}/5</TableCell>
                  <TableCell>{item.effortScore}/5</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityBadges[item.priority]}`}>
                      {priorityLabels[item.priority]}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrioritizationList;
