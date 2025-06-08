import React from 'react';
import { Department } from '@/lib/session/sessionTypes';

interface DepartmentWithOptionalRoles extends Department {
    roles?: { id: number; title: string }[];
}

interface DepartmentCardProps {
    department: DepartmentWithOptionalRoles;
    isSelected: boolean;
    onClick: () => void;
    showRoleCount?: boolean;
}

const DepartmentCard: React.FC<DepartmentCardProps> = ({ department, isSelected, onClick, showRoleCount }) => {
    return (
        <button
            onClick={onClick}
            className={`w-full p-4 text-left border rounded-lg transition-all ${
                isSelected ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300 hover:border-gray-400'
            }`}
        >
            <h3 className="font-semibold text-lg">{department.name}</h3>
            {department.description && <p className="text-sm text-gray-600 mt-1">{department.description}</p>}
            {showRoleCount && (
                <div className="text-xs text-gray-500 mt-2">
                    {department.roles?.length || 0} {(department.roles?.length || 0) === 1 ? 'role' : 'roles'} available
                </div>
            )}
        </button>
    );
};

export default DepartmentCard; 