'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-state'

interface AuthGuardProps {
  children: React.ReactNode
}

// Define protected routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/cases',
  '/tasks', 
  '/projects',
  '/contacts',
  '/team',
  '/integrations',
  '/settings',
  '/my-work',
  '/cause-list'
]

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/firebase-test'
]

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return

    // Check if current route is protected
    const isProtectedRoute = PROTECTED_ROUTES.some(route => 
      pathname.startsWith(route)
    )
    
    // Check if current route is public
    const isPublicRoute = PUBLIC_ROUTES.some(route => 
      pathname === route || pathname.startsWith(route + '/')
    )

    // If it's a protected route and user is not authenticated, redirect to login
    if (isProtectedRoute && !isAuthenticated) {
      router.replace('/login')
      return
    }

    // If user is authenticated and trying to access login page, redirect to dashboard
    if (isAuthenticated && pathname === '/login') {
      router.replace('/dashboard')
      return
    }

    // If user is authenticated and on root page, redirect to dashboard
    if (isAuthenticated && pathname === '/') {
      router.replace('/dashboard')
      return
    }

    // If user is NOT authenticated and on root page, redirect to login
    if (!isAuthenticated && pathname === '/') {
      router.replace('/login')
      return
    }
  }, [isAuthenticated, isLoading, pathname, router])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Check if current route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  )

  // If it's a protected route and user is not authenticated, don't render anything
  if (isProtectedRoute && !isAuthenticated) {
    return null
  }

  return <>{children}</>
}