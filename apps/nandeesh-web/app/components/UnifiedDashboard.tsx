/**
 * Unified Dashboard Component
 * Shows interconnected data across all entities with seamless navigation
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { unifiedDataService } from '@/lib/unified-data-service'
import { cloudStorageService } from '@/lib/cloud-storage-service'
import DailyCauseList from '@/app/components/DailyCauseList'
import { 
  FolderIcon, 
  UserIcon, 
  BriefcaseIcon, 
  ClipboardDocumentListIcon,
  PhoneIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { StaggeredCards } from '@/components/anim/StaggeredList'
import { AnimatedButton } from '@/components/ui/animated-button'

interface DashboardStats {
  totalCases: number
  totalClients: number
  totalProjects: number
  totalTasks: number
  recentActivities: any[]
  upcomingDeadlines: any[]
  activeCollaborations: any[]
}

export default function UnifiedDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    totalClients: 0,
    totalProjects: 0,
    totalTasks: 0,
    recentActivities: [],
    upcomingDeadlines: [],
    activeCollaborations: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [activeUsers, setActiveUsers] = useState(0)

  useEffect(() => {
    loadDashboardData()
    
    // Subscribe to user presence changes
    const unsubscribe = cloudStorageService.onPresenceChange((userCount) => {
      setActiveUsers(userCount)
    })

    return unsubscribe
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const dashboardStats = await unifiedDataService.getDashboardSummary()
      setStats(dashboardStats)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const quickActions = [
    { name: 'New Case', href: '/cases', icon: FolderIcon, color: 'bg-blue-600 hover:bg-blue-700' },
    { name: 'Add Client', href: '/contacts', icon: UserIcon, color: 'bg-green-600 hover:bg-green-700' },
    { name: 'Create Project', href: '/projects', icon: BriefcaseIcon, color: 'bg-purple-600 hover:bg-purple-700' },
    { name: 'New Task', href: '/tasks', icon: ClipboardDocumentListIcon, color: 'bg-orange-600 hover:bg-orange-700' }
  ]

  const entityStats = [
    { 
      name: 'Cases', 
      count: stats.totalCases, 
      href: '/cases', 
      icon: FolderIcon, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Active legal cases'
    },
    { 
      name: 'Clients', 
      count: stats.totalClients, 
      href: '/contacts', 
      icon: UserIcon, 
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Client relationships'
    },
    { 
      name: 'Projects', 
      count: stats.totalProjects, 
      href: '/projects', 
      icon: BriefcaseIcon, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Ongoing projects'
    },
    { 
      name: 'Tasks', 
      count: stats.totalTasks, 
      href: '/tasks', 
      icon: ClipboardDocumentListIcon, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'Pending tasks'
    }
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="animate-pulse">
                <div className="h-12 w-12 bg-gray-300 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Collaboration Status */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Unified Legal Workspace</h2>
            <p className="text-blue-100">
              All your cases, clients, and projects in one integrated platform
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 text-blue-100 mb-1">
              <UserGroupIcon className="h-5 w-5" />
              <span className="text-sm">Active Users</span>
            </div>
            <div className="text-2xl font-bold">{activeUsers}</div>
          </div>
        </div>
      </div>

      {/* Entity Statistics */}
      <StaggeredCards className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {entityStats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.count}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{stat.description}</p>
          </Link>
        ))}
      </StaggeredCards>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className={`${action.color} text-white p-4 rounded-lg text-center transition-colors`}
            >
              <action.icon className="h-6 w-6 mx-auto mb-2" />
              <span className="text-sm font-medium">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Daily Cause List */}
      <DailyCauseList />

      {/* Interconnected Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Relationships */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Integrated Features</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Cases ↔ Clients</p>
                <p className="text-xs text-gray-600">Automatically link cases to client profiles</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Projects ↔ Teams</p>
                <p className="text-xs text-gray-600">Assign team members to project tasks</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Tasks ↔ Cases</p>
                <p className="text-xs text-gray-600">Track case-specific task progress</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Real-time Collaboration</p>
                <p className="text-xs text-gray-600">Live updates across all connected users</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Shortcuts */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Navigation Shortcuts</h3>
          <div className="space-y-3">
            <Link
              href="/cases"
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <FolderIcon className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Manage Cases</span>
              </div>
              <span className="text-xs text-gray-500">{stats.totalCases} total</span>
            </Link>
            
            <Link
              href="/contacts"
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <UserIcon className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Client Directory</span>
              </div>
              <span className="text-xs text-gray-500">{stats.totalClients} contacts</span>
            </Link>
            
            <Link
              href="/projects"
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <BriefcaseIcon className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">Project Management</span>
              </div>
              <span className="text-xs text-gray-500">{stats.totalProjects} active</span>
            </Link>
            
            <Link
              href="/collaboration-demo"
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <UserGroupIcon className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium">Collaboration Demo</span>
              </div>
              <span className="text-xs text-gray-500">See it in action</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}




