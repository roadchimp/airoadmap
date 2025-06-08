import React, { useState, useMemo } from 'react';
import { useSession } from '@/lib/session/SessionContext';
import { Department } from '@/lib/session/sessionTypes';
import SearchInput from '../../../../../../components/ui/search-input'; 
import DepartmentCard from '../../../../../../components/ui/department-card';

const DepartmentSelectionStep: React.FC = () => {
  const { 
    session, 
    departments, 
    selectDepartment,
    updateStepData 
  } = useSession();
  
  const [searchTerm, setSearchTerm] = useState('');
  const selectedDepartmentId = session.steps.find(step => step.id === 'department-selection')?.data.department?.id;

  const filteredDepartments = useMemo(() => {
    if (!searchTerm.trim()) return departments;
    
    return departments.filter(dept =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [departments, searchTerm]);

  const handleDepartmentSelect = (department: Department) => {
    selectDepartment(department);
    updateStepData('department-selection', { department, selectedAt: new Date().toISOString() });
  };

  if (departments.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading departments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Select Your Department
        </h3>
        <p className="text-gray-600">
          Choose the department that best matches your role or the assessment you want to create.
        </p>
      </div>

      <div className="max-w-md">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search departments..."
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDepartments.map((department) => (
          <DepartmentCard
            key={department.id}
            department={department}
            isSelected={selectedDepartmentId === department.id}
            onClick={() => handleDepartmentSelect(department)}
            showRoleCount={true}
          />
        ))}
      </div>
    </div>
  );
};

export default DepartmentSelectionStep; 