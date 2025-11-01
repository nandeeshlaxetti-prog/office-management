import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase-config'

export interface UserProfile {
  email: string
  phoneNumber?: string
  name?: string
  role?: string
  createdAt: Date
  lastLoginAt: Date
}

export class FirebaseAuthService {
  // Allowed email addresses and domains for access control
  private static readonly ALLOWED_EMAILS: string[] = [
    'nandeesh@lnnlegal.in',
    'admin@lnnlegal.in',
    // Add more allowed email addresses here
  ]

  private static readonly ALLOWED_DOMAINS: string[] = [
    '@lnnlegal.in',
    '@gmail.com', // Allow all Gmail users (remove if you want to restrict)
    // Add more allowed domains here
  ]

  /**
   * Check if an email is whitelisted
   */
  private static isEmailWhitelisted(email: string): boolean {
    // Check exact email match
    if (this.ALLOWED_EMAILS.includes(email)) {
      return true
    }

    // Check domain match
    for (const domain of this.ALLOWED_DOMAINS) {
      if (email.endsWith(domain)) {
        return true
      }
    }

    return false
  }

  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<UserProfile> {
    if (!auth) {
      throw new Error('Firebase not initialized')
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Update last login time
      await this.updateLastLogin(user.uid)
      
      // Get user profile
      const profile = await this.getUserProfile(user.uid)
      return profile
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code))
    }
  }

  // Sign up with email and password
  static async signUp(email: string, password: string, name?: string): Promise<UserProfile> {
    if (!auth || !db) {
      throw new Error('Firebase not initialized')
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Update user display name
      if (name) {
        await updateProfile(user, { displayName: name })
      }
      
      // Create user profile in Firestore
      const profile: UserProfile = {
        email: user.email!,
        name: name || user.displayName || '',
        role: 'user',
        createdAt: new Date(),
        lastLoginAt: new Date()
      }
      
      await setDoc(doc(db, 'users', user.uid), profile)
      
      return profile
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code))
    }
  }

  // Sign in with Google
  static async signInWithGoogle(): Promise<UserProfile> {
    if (!auth) {
      throw new Error('Firebase not initialized')
    }
    
    try {
      console.log('🔐 Starting Google Sign-In...')
      
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      const user = userCredential.user
      
      console.log('✅ Google Sign-In successful, user:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      })

      // Check if user's email is whitelisted
      if (user.email && !this.isEmailWhitelisted(user.email)) {
        // Sign out the user immediately
        await signOut(auth)
        
        console.log('❌ Access denied for email:', user.email)
        throw new Error('Access denied: Your email address is not authorized to access this application. Please contact your administrator.')
      }
      
      console.log('✅ Email whitelist check passed for:', user.email)
      
      // Update last login time
      await this.updateLastLogin(user.uid)
      
      // Get or create user profile
      const profile = await this.getOrCreateGoogleUserProfile(user)
      
      console.log('✅ Returning profile:', profile)
      
      // Try to link user to team member by email
      try {
        // Dynamic import to avoid circular dependency
        const { cloudStorageService } = await import('./cloud-storage-service')
        await cloudStorageService.linkCurrentUserToTeamMember()
      } catch (linkError) {
        console.log('ℹ️ Could not link user to team member (may not exist yet):', linkError)
      }
      
      return profile
    } catch (error: any) {
      console.error('❌ Google Sign-In error:', error)
      throw new Error(this.getErrorMessage(error.code))
    }
  }

  // Get or create user profile for Google auth
  private static async getOrCreateGoogleUserProfile(user: User): Promise<UserProfile> {
    try {
      console.log('🔍 Google user data:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      })
      
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      
      if (userDoc.exists()) {
        const data = userDoc.data()
        const profile = {
          email: data.email || user.email || '',
          phoneNumber: data.phoneNumber,
          name: data.name || user.displayName || '',
          role: data.role || 'user',
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLoginAt: new Date()
        }
        
        console.log('✅ Existing profile:', profile)
        
        // Update profile if missing email or name
        if (!profile.email || !profile.name) {
          await setDoc(doc(db, 'users', user.uid), profile, { merge: true })
          console.log('🔧 Updated profile with missing data')
        }
        
        return profile
      } else {
        // Create new profile for Google auth user
        const profile: UserProfile = {
          email: user.email || '',
          phoneNumber: user.phoneNumber,
          name: user.displayName || '',
          role: 'user',
          createdAt: new Date(),
          lastLoginAt: new Date()
        }
        
        console.log('✅ Creating new profile:', profile)
        
        await setDoc(doc(db, 'users', user.uid), profile)
        return profile
      }
    } catch (error) {
      console.error('❌ Error in getOrCreateGoogleUserProfile:', error)
      throw new Error('Failed to get user profile')
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    if (!auth) {
      return // No-op if Firebase not initialized
    }
    
    try {
      await signOut(auth)
    } catch (error: any) {
      console.error('Firebase sign out error:', error)
    }
  }

  // Get current user
  static getCurrentUser(): User | null {
    if (!auth) {
      return null
    }
    return auth.currentUser
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback: (user: User | null) => void) {
    if (!auth) {
      // Return a no-op unsubscribe function
      return () => {}
    }
    return onAuthStateChanged(auth, callback)
  }

  // Get user profile from Firestore
  static async getUserProfile(uid: string): Promise<UserProfile> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      
      if (userDoc.exists()) {
        const data = userDoc.data()
        return {
          email: data.email,
          phoneNumber: data.phoneNumber,
          name: data.name || '',
          role: data.role || 'user',
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLoginAt: data.lastLoginAt?.toDate() || new Date()
        }
      } else {
        // If no profile exists, create one from auth user
        const user = auth.currentUser
        if (user) {
          const profile: UserProfile = {
            email: user.email || '',
            phoneNumber: user.phoneNumber || '',
            name: user.displayName || '',
            role: 'user',
            createdAt: new Date(),
            lastLoginAt: new Date()
          }
          await setDoc(doc(db, 'users', uid), profile)
          return profile
        }
        throw new Error('User not found')
      }
    } catch (error) {
      throw new Error('Failed to get user profile')
    }
  }

  // Update last login time
  static async updateLastLogin(uid: string): Promise<void> {
    try {
      await setDoc(doc(db, 'users', uid), {
        lastLoginAt: new Date()
      }, { merge: true })
    } catch (error) {
      console.error('Failed to update last login:', error)
    }
  }

  // Get user-friendly error messages
  private static getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No user found with this email address'
      case 'auth/wrong-password':
        return 'Incorrect password'
      case 'auth/invalid-email':
        return 'Invalid email address'
      case 'auth/user-disabled':
        return 'This user account has been disabled'
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later'
      case 'auth/email-already-in-use':
        return 'An account with this email already exists'
      case 'auth/weak-password':
        return 'Password should be at least 6 characters'
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection'
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed'
      case 'auth/cancelled-popup-request':
        return 'Only one popup request is allowed at a time'
      default:
        return 'Authentication failed. Please try again'
    }
  }
}
