 // steps/role-selection-step.tsx
import { useSession } from '@/lib/session/SessionContext';
import { JobRole } from '@/lib/session/sessionTypes';
import { useState } from 'react';

export const RoleSelectionStep = () => {
  const { session, updateStepData } = useSession();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRoles = session.jobRoles.filter((role: JobRole) =>
    role.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    role.departmentId === session.selectedDepartment?.id
  );

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search roles..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <div className="grid grid-cols-2 gap-4">
        {filteredRoles.map((role: JobRole) => (
          <button
            key={role.id}
            onClick={() => updateStepData('role-selection', { role })}
            className={`p-4 border rounded ${
              session.selectedJobRole?.id === role.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'hover:border-gray-400'
            }`}
          >
            <h3 className="font-medium">{role.title}</h3>
            <p className="text-sm text-gray-500">{role.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoleSelectionStep;