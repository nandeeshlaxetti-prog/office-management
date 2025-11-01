'use client';

import { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority } from '../tasks/_types';
import { useTeamManagement } from './useTeamManagement';
import { cloudStorageService } from '@/lib/cloud-storage-service';

// Seed data for tasks
const seedTasks: Task[] = [
  {
    id: '1',
    title: 'Review contract for ABC Corp',
    description: 'Review the service agreement contract for ABC Corporation',
    status: 'todo',
    priority: 'high',
    assigneeId: '1',
    dueDate: '2024-02-15',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    projectId: '1',
    tags: ['contract', 'review']
  },
  {
    id: '2',
    title: 'Prepare court documents',
    description: 'Prepare all necessary documents for the upcoming court hearing',
    status: 'in-progress',
    priority: 'urgent',
    assigneeId: '2',
    dueDate: '2024-02-10',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    projectId: '2',
    tags: ['court', 'documents']
  },
  {
    id: '3',
    title: 'Client meeting preparation',
    description: 'Prepare agenda and materials for client meeting',
    status: 'review',
    priority: 'medium',
    assigneeId: '1',
    dueDate: '2024-02-20',
    createdAt: '2024-01-18T11:00:00Z',
    updatedAt: '2024-01-22T16:45:00Z',
    projectId: '1',
    tags: ['meeting', 'client']
  },
  {
    id: '4',
    title: 'Research case law',
    description: 'Research relevant case law for the ongoing litigation',
    status: 'done',
    priority: 'medium',
    assigneeId: '3',
    dueDate: '2024-01-25',
    createdAt: '2024-01-05T08:00:00Z',
    updatedAt: '2024-01-25T17:00:00Z',
    projectId: '2',
    tags: ['research', 'case-law']
  },
  {
    id: '5',
    title: 'Update client database',
    description: 'Update client contact information and case status',
    status: 'todo',
    priority: 'low',
    assigneeId: '2',
    dueDate: '2024-03-01',
    createdAt: '2024-01-20T13:00:00Z',
    updatedAt: '2024-01-20T13:00:00Z',
    projectId: '3',
    tags: ['database', 'maintenance']
  }
];

export function useTaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { employees: teamMembers, isLoaded: teamLoaded } = useTeamManagement();

  // Load tasks from cloud storage
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const cloudTasks = await cloudStorageService.getAllTasks();
        if (cloudTasks && cloudTasks.length > 0) {
          setTasks(cloudTasks);
        } else {
          // No cloud tasks, use seed data
          setTasks(seedTasks);
        }
      } catch (error) {
        console.error("Failed to load tasks from cloud:", error);
        // Fallback to seed data
        setTasks(seedTasks);
      } finally {
        setIsLoaded(true);
      }
    };
    
    loadTasks();
  }, []);

  const addTask = async (newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const taskId = await cloudStorageService.addTask(newTask);
      const taskWithMetadata: Task = {
        ...newTask,
        id: taskId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTasks(prev => [...prev, taskWithMetadata]);
    } catch (error) {
      console.error("Failed to add task to cloud:", error);
      // Still add to local state for immediate UI update
      const taskWithMetadata: Task = {
        ...newTask,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTasks(prev => [...prev, taskWithMetadata]);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    try {
      await cloudStorageService.updateTask(taskId, updates);
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId
            ? { ...task, ...updates, updatedAt: new Date().toISOString() }
            : task
        )
      );
    } catch (error) {
      console.error("Failed to update task in cloud:", error);
      // Still update local state for immediate UI update
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId
            ? { ...task, ...updates, updatedAt: new Date().toISOString() }
            : task
        )
      );
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await cloudStorageService.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error("Failed to delete task from cloud:", error);
      // Still delete from local state for immediate UI update
      setTasks(prev => prev.filter(task => task.id !== taskId));
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const getTasksByPriority = (priority: TaskPriority) => {
    return tasks.filter(task => task.priority === priority);
  };

  const searchTasks = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return tasks.filter(task =>
      task.title.toLowerCase().includes(lowercaseQuery) ||
      (task.description && task.description.toLowerCase().includes(lowercaseQuery)) ||
      (task.tags && task.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)))
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

  const getAssigneeName = (assigneeId?: string) => {
    if (!assigneeId) return 'Unassigned';
    const assignee = getAssigneeById(assigneeId);
    return assignee ? assignee.name : 'Unknown';
  };

  return {
    tasks,
    isLoaded: isLoaded && teamLoaded,
    teamMembers,
    addTask,
    updateTask,
    deleteTask,
    getTasksByStatus,
    getTasksByPriority,
    searchTasks,
    getAvailableAssignees,
    getAssigneeById,
    getAssigneeName,
  };
}
