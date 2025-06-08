import React from 'react';
import { JobRole } from '@/lib/session/sessionTypes';

interface RoleCardProps {
    role: JobRole;
    isSelected: boolean;
    onClick: () => void;
    showSkills?: boolean;
    showLevel?: boolean;
}

const RoleCard: React.FC<RoleCardProps> = ({ role, isSelected, onClick, showSkills, showLevel }) => {
    return (
        <button
            onClick={onClick}
            className={`w-full p-4 text-left border rounded-lg transition-all ${
                isSelected ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300 hover:border-gray-400'
            }`}
        >
            <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg">{role.title}</h3>
                {showLevel && role.level && <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">{role.level}</span>}
            </div>
            {role.description && <p className="text-sm text-gray-600 mt-1">{role.description}</p>}
            {showSkills && role.skills && role.skills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {role.skills.slice(0, 5).map(skill => (
                        <span key={skill} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {skill}
                        </span>
                    ))}
                </div>
            )}
        </button>
    );
};

export default RoleCard; 