'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-state'
import { useRouter } from 'next/navigation'
import { cloudStorageService } from '@/lib/cloud-storage-service'
import UnifiedDashboard from '@/app/components/UnifiedDashboard'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [displayName, setDisplayName] = useState<string | undefined>(user?.name || user?.email)

  useEffect(() => {
    loadTeamMemberName()
  }, [user])

  const loadTeamMemberName = async () => {
    try {
      if (user?.email) {
        // Try to find team member with matching email
        const teamMembers = await cloudStorageService.getAllTeamMembersSimple()
        const matchingMember = teamMembers.find(m => 
          m.email && m.email.toLowerCase() === user.email?.toLowerCase()
        )
        
        if (matchingMember && matchingMember.name) {
          console.log('✅ Found team member name:', matchingMember.name)
          setDisplayName(matchingMember.name)
        } else {
          console.log('ℹ️ No team member found for:', user.email)
          setDisplayName(user?.name || user?.email)
        }
      }
    } catch (error) {
      console.error('❌ Failed to load team member name:', error)
      setDisplayName(user?.name || user?.email)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {displayName || 'User'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening with your legal practice today.
          </p>
        </div>
        <UnifiedDashboard />
      </main>
    </div>
  )
}
