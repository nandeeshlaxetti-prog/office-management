'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { FirebaseAuthService, UserProfile } from './firebase-auth'
import { useEffect } from 'react'

interface AuthState {
  isAuthenticated: boolean
  user: UserProfile | null
  isLoading: boolean
  login: (credentials: { email: string; password: string; remember: boolean }) => Promise<void>
  logout: () => void
  setAuthenticated: (authenticated: boolean, user?: UserProfile) => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      isLoading: true,

      login: async ({ email, password, remember }) => {
        set({ isLoading: true })
        
        try {
          // Use Firebase authentication
          const profile = await FirebaseAuthService.signIn(email, password)
          
          set({ 
            isAuthenticated: true, 
            user: profile,
            isLoading: false 
          })
          
          return
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          await FirebaseAuthService.signOut()
        } catch (error) {
          console.error('Firebase logout error:', error)
        }
        
        set({ 
          isAuthenticated: false, 
          user: null,
          isLoading: false 
        })
      },

      setAuthenticated: (authenticated, user) => {
        set({ 
          isAuthenticated: authenticated, 
          user: user || null,
          isLoading: false
        })
      }
    }),
    {
      name: 'auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user
      })
    }
  )
)

// Hook to initialize Firebase auth state listener
export const useFirebaseAuth = () => {
  const { setAuthenticated } = useAuth()

  useEffect(() => {
    try {
      const unsubscribe = FirebaseAuthService.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const profile = await FirebaseAuthService.getUserProfile(firebaseUser.uid)
            setAuthenticated(true, profile)
          } catch (error) {
            console.warn('Failed to get user profile:', error)
            setAuthenticated(false)
          }
        } else {
          setAuthenticated(false)
        }
      })

      return () => unsubscribe()
    } catch (error) {
      // Firebase not configured or initialization error - silently set as not authenticated
      console.warn('Firebase auth initialization warning:', error)
      setAuthenticated(false)
    }
  }, [setAuthenticated])
}
