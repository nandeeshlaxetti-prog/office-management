'use client';

import { useState, useEffect } from 'react';
import { Employee, Role, seedEmployees } from '../team/types';
import { cloudStorageService } from '../../lib/cloud-storage-service';

export function useTeamManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadEmployees = async (skipLoadingState = false) => {
    try {
      console.log('🔄 Loading team members from Firestore...')
      
      const cloudMembers = await cloudStorageService.getAllTeamMembersSimple()
      
      if (cloudMembers && cloudMembers.length > 0) {
        console.log('✅ Loaded', cloudMembers.length, 'team members from Firestore')
        
        const employeeList: Employee[] = cloudMembers.map(member => ({
          id: member.id || `emp-${Date.now()}`,
          name: member.name,
          role: member.role as Role,
          email: member.email,
          phone: member.phone
        }))
        
        setEmployees(employeeList)
      } else {
        console.log('📦 No team members in Firestore - starting fresh')
        setEmployees([])
      }
    } catch (error) {
      console.error('❌ Error loading team data from Firestore:', error)
      setEmployees([])
    } finally {
      if (!skipLoadingState) {
        setIsLoaded(true)
      }
    }
  }

  // Load data from Firestore on mount
  useEffect(() => {
    loadEmployees()
  }, []);

  // Note: We don't save to localStorage here anymore since we're using Firestore
  // The localStorage save was causing the "different team members in different browsers" issue

  const addMember = async (newMember: Employee) => {
    try {
      console.log('💾 Adding team member to Firestore...')
      
      // Save to Firestore
      const memberId = await cloudStorageService.addTeamMemberSimple({
        name: newMember.name,
        role: newMember.role,
        email: newMember.email,
        phone: newMember.phone
      })
      
      console.log('✅ Team member added to Firestore:', memberId)
      
      // Reload from Firestore to ensure we have the latest data
      await loadEmployees(true)
    } catch (error) {
      console.error('❌ Failed to add team member:', error)
      // Fallback to local state
      setEmployees(prev => [...prev, newMember])
    }
  };

  const updateMemberRole = async (employeeId: string, newRole: Role) => {
    try {
      console.log('💾 Updating team member role in Firestore...')
      
      // Update in Firestore
      await cloudStorageService.updateTeamMemberSimple(employeeId, { role: newRole })
      
      console.log('✅ Team member role updated in Firestore')
      
      // Update local state
      setEmployees(prev => 
        prev.map(emp => 
          emp.id === employeeId ? { ...emp, role: newRole } : emp
        )
      )
    } catch (error) {
      console.error('❌ Failed to update team member:', error)
      // Fallback to local state
      setEmployees(prev => 
        prev.map(emp => 
          emp.id === employeeId ? { ...emp, role: newRole } : emp
        )
      )
    }
  };

  const removeMember = async (employeeId: string) => {
    try {
      console.log('💾 Removing team member from Firestore...')
      
      // Delete from Firestore
      await cloudStorageService.deleteTeamMemberSimple(employeeId)
      
      console.log('✅ Team member removed from Firestore')
      
      // Reload from Firestore to ensure we have the latest data
      await loadEmployees(true)
    } catch (error) {
      console.error('❌ Failed to remove team member:', error)
      // Fallback to local state
      setEmployees(prev => prev.filter(emp => emp.id !== employeeId))
    }
  };

  const resetToDefault = () => {
    setEmployees(seedEmployees);
  };

  return {
    employees,
    isLoaded,
    addMember,
    updateMemberRole,
    removeMember,
    resetToDefault,
  };
}
