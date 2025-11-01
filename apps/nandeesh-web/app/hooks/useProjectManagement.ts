'use client';

import { useState, useEffect } from 'react';
import { Project, seedProjects, ProjectStatus, ProjectPriority } from '../projects/_types';
import { useTeamManagement } from './useTeamManagement';
import { cloudStorageService } from '@/lib/cloud-storage-service';

export function useProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { employees: teamMembers, isLoaded: teamLoaded } = useTeamManagement();

  // Load projects from cloud storage
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const cloudProjects = await cloudStorageService.getAllProjects();
        if (cloudProjects && cloudProjects.length > 0) {
          setProjects(cloudProjects);
        } else {
          // No cloud projects, use seed data
          setProjects(seedProjects);
        }
      } catch (error) {
        console.error("Failed to load projects from cloud:", error);
        // Fallback to seed data
        setProjects(seedProjects);
      } finally {
        setIsLoaded(true);
      }
    };
    
    loadProjects();
  }, []);

  const addProject = async (newProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const projectId = await cloudStorageService.addProject(newProject);
      const projectWithMetadata: Project = {
        ...newProject,
        id: projectId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProjects(prev => [...prev, projectWithMetadata]);
    } catch (error) {
      console.error("Failed to add project to cloud:", error);
      // Still add to local state for immediate UI update
      const projectWithMetadata: Project = {
        ...newProject,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProjects(prev => [...prev, projectWithMetadata]);
    }
  };

  const updateProject = async (projectId: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => {
    try {
      await cloudStorageService.updateProject(projectId, updates);
      setProjects(prev =>
        prev.map(project =>
          project.id === projectId
            ? { ...project, ...updates, updatedAt: new Date().toISOString() }
            : project
        )
      );
    } catch (error) {
      console.error("Failed to update project in cloud:", error);
      // Still update local state for immediate UI update
      setProjects(prev =>
        prev.map(project =>
          project.id === projectId
            ? { ...project, ...updates, updatedAt: new Date().toISOString() }
            : project
        )
      );
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      await cloudStorageService.deleteProject(projectId);
      setProjects(prev => prev.filter(project => project.id !== projectId));
    } catch (error) {
      console.error("Failed to delete project from cloud:", error);
      // Still delete from local state for immediate UI update
      setProjects(prev => prev.filter(project => project.id !== projectId));
    }
  };

  const getProjectsByStatus = (status: ProjectStatus) => {
    return projects.filter(project => project.status === status);
  };

  const getProjectsByPriority = (priority: ProjectPriority) => {
    return projects.filter(project => project.priority === priority);
  };

  const searchProjects = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return projects.filter(project =>
      project.name.toLowerCase().includes(lowercaseQuery) ||
      (project.description && project.description.toLowerCase().includes(lowercaseQuery)) ||
      (project.clientName && project.clientName.toLowerCase().includes(lowercaseQuery))
    );
  };

  const getAvailableAssignees = () => {
    return teamMembers.map(member => ({
      id: member.id,
      name: member.name,
      role: member.role,
      email: member.email
    }));
  };

  const getAssigneeById = (assigneeId: string) => {
    return teamMembers.find(member => member.id === assigneeId);
  };

  return {
    projects,
    isLoaded: isLoaded && teamLoaded,
    teamMembers,
    addProject,
    updateProject,
    deleteProject,
    getProjectsByStatus,
    getProjectsByPriority,
    searchProjects,
    getAvailableAssignees,
    getAssigneeById,
  };
}
