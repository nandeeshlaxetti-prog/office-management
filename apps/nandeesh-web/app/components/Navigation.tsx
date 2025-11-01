'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { LogoWithText } from './Logo'
import { useAuth } from '@/lib/auth-state'
import { cloudStorageService } from '@/lib/cloud-storage-service'
import UnifiedSearch from './UnifiedSearch'
import { ChevronDownIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { ThemeToggle } from '../../components/theme-toggle'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isAuthenticated } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [displayName, setDisplayName] = useState<string | undefined>(user?.name || user?.email)
  const [displayInitial, setDisplayInitial] = useState<string>('U')

  useEffect(() => {
    if (user?.email) {
      loadTeamMemberName()
    }
  }, [user])

  const loadTeamMemberName = async () => {
    try {
      const teamMembers = await cloudStorageService.getAllTeamMembersSimple()
      const matchingMember = teamMembers.find(m => 
        m.email && m.email.toLowerCase() === user?.email?.toLowerCase()
      )
      
      if (matchingMember && matchingMember.name) {
        console.log('✅ Navigation: Found team member name:', matchingMember.name)
        setDisplayName(matchingMember.name)
        setDisplayInitial(matchingMember.name.charAt(0).toUpperCase())
      } else {
        setDisplayName(user?.name || user?.email)
        setDisplayInitial(user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U')
      }
    } catch (error) {
      console.error('❌ Navigation: Failed to load team member name:', error)
      setDisplayName(user?.name || user?.email)
      setDisplayInitial(user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U')
    }
  }

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'Cases', href: '/cases', icon: '📁' },
    { name: 'Tasks', href: '/tasks', icon: '📋' },
    { name: 'Projects', href: '/projects', icon: '📊' },
    { name: 'Clients', href: '/contacts', icon: '👤' },
    { name: 'Team', href: '/team', icon: '👥' },
    { name: 'Integrations', href: '/integrations', icon: '🔗' },
    { name: 'Settings', href: '/settings', icon: '⚙️' },
  ]

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <LogoWithText size="md" />
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Unified Search */}
          <div className="hidden md:block">
            <UnifiedSearch />
          </div>

          {/* User Menu / Mobile menu button */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-lg px-3 py-2 transition-colors"
                >
                  <div className="h-8 w-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {displayInitial}
                    </span>
                  </div>
                  <span className="hidden sm:block font-medium">{displayName || 'User'}</span>
                  <ChevronDownIcon className="h-4 w-4" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{displayName || 'User'}</p>
                      <p className="text-xs text-gray-500">{user.email || 'No email'}</p>
                    </div>
                    <button
                      onClick={() => {
                        logout()
                        setShowUserMenu(false)
                        router.push('/login')
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-amber-600 hover:to-amber-700 transition-all duration-200"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => {
                  const mobileMenu = document.getElementById('mobile-menu')
                  if (mobileMenu) {
                    mobileMenu.classList.toggle('hidden')
                  }
                }}
                className="text-gray-600 hover:text-gray-900 p-2"
              >
                <span className="text-xl">☰</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div id="mobile-menu" className="hidden md:hidden border-t">
          <div className="py-2 space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

