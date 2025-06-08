"use client";

import React from 'react';
import { Badge } from "@/components/ui/badge";

interface Role {
  id: number;
  title: string;
}

interface RoleSelectorProps {
  roles: Role[];
  selectedRoles: string[];
  onRoleToggle: (roleTitle: string) => void;
}

export function RoleSelector({ roles, selectedRoles, onRoleToggle }: RoleSelectorProps) {
  if (!roles || roles.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No roles available for selection.
      </div>
    );
  }

  const handleRoleClick = (e: React.MouseEvent, roleTitle: string) => {
    e.preventDefault();
    try {
      onRoleToggle(roleTitle);
    } catch (error) {
      console.error('Error toggling role:', error);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((role) => {
        const isSelected = selectedRoles.includes(role.title);
        
        return (
          <Badge
            key={role.id}
            variant={isSelected ? "default" : "outline"}
            className={`cursor-pointer transition-all hover:scale-105 ${
              isSelected 
                ? "bg-[#e84c2b] hover:bg-[#d63916] text-white" 
                : "hover:bg-gray-100 text-gray-700 border-gray-300"
            }`}
            onClick={(e) => handleRoleClick(e, role.title)}
          >
            {role.title}
          </Badge>
        );
      })}
    </div>
  );
} 