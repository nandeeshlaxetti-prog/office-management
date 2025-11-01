'use client';

import { useState } from 'react';
import { Employee, Role } from '../../team/types';
import { RoleBadge } from '../../team/_components/RoleBadge';
import { NewMemberModal } from '../../team/_components/NewMemberModal';
import { useTeamManagement } from '../../hooks/useTeamManagement';

export function TeamManagement() {
  const { employees, isLoaded, addMember, updateMemberRole, removeMember } = useTeamManagement();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddMember = (newMember: Employee) => {
    addMember(newMember);
  };

  const handleRoleChange = (employeeId: string, newRole: Role) => {
    updateMemberRole(employeeId, newRole);
  };

  const handleRemoveMember = (employeeId: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      removeMember(employeeId);
    }
  };

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Team Management</h3>
            <p className="text-sm text-gray-600">Add, edit, and remove team members</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Team Management</h3>
          <p className="text-sm text-gray-600">Add, edit, and remove team members</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          aria-label="Add new team member"
        >
          Add Member
        </button>
      </div>

      {/* Team Members List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-900">Current Team Members ({employees.length})</h4>
        </div>
        
        <div className="divide-y divide-gray-200">
          {employees.map((employee) => (
            <div key={employee.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {employee.name}
                  </p>
                  {employee.email && (
                    <p className="text-sm text-gray-500 truncate">
                      {employee.email}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Role Badge */}
                <RoleBadge 
                  role={employee.role} 
                  showPrimary={employee.role === 'Partner'} 
                />
                
                {/* Role Change Dropdown */}
                <select
                  value={employee.role}
                  onChange={(e) => handleRoleChange(employee.id, e.target.value as Role)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label={`Change role for ${employee.name}`}
                >
                  <option value="Partner">Partner</option>
                  <option value="Associate">Associate</option>
                  <option value="Clerk">Clerk</option>
                  <option value="Intern">Intern</option>
                </select>
                
                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveMember(employee.id)}
                  className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md p-1"
                  aria-label={`Remove ${employee.name}`}
                  title="Remove team member"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {employees.length === 0 && (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500 text-sm">No team members found.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <NewMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddMember={handleAddMember}
      />
    </div>
  );
}

