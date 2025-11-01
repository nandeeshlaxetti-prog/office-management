/**
 * Cloud Storage Service for Cases
 * Handles all case data operations with Firebase Firestore
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where, 
  onSnapshot,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from './firebase-config'

export interface CloudCase {
  id?: string
  title: string
  caseNumber?: string
  cnrNumber?: string
  petitionerName?: string
  respondentName?: string
  court?: string
  courtLocation?: string
  subjectMatter?: string
  reliefSought?: string
  stage?: string
  caseStatus?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  filingDate?: string
  nextHearingDate?: string
  lastHearingDate?: string
  caseValue?: number
  assignedTo?: string
  notes?: string
  documents?: string[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
  lastUpdatedBy: string
  // Additional eCourts data
  registrationNumber?: string
  filingNumber?: string
  status?: any
  parties?: any
  acts?: any[]
  subMatters?: any[]
  iaDetails?: any[]
  categoryDetails?: any
  documentDetails?: any[]
  objections?: any[]
  history?: any[]
  orders?: any[]
  firstInformationReport?: any
  transfer?: any[]
}

export interface CloudSyncStatus {
  isOnline: boolean
  lastSync: Date | null
  pendingChanges: number
  syncErrors: string[]
  activeUsers: number
  lastActivity: Date | null
}

export interface UserActivity {
  userId: string
  userName: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW'
  entityType: 'CASE' | 'PROJECT' | 'TASK' | 'CONTACT'
  entityId: string
  entityName: string
  timestamp: Date
  details?: string
}

export interface TeamMember {
  id?: string
  name: string
  role: string
  email?: string
  phone?: string
  createdAt?: Date | Timestamp
  updatedAt?: Date | Timestamp
}

class CloudStorageService {
  private casesCollection = 'cases'
  private teamMembersCollection = 'teamMembers'
  private syncStatusCollection = 'syncStatus'
  private activitiesCollection = 'activities'
  private usersCollection = 'users'
  private isOnline = false
  private pendingChanges: CloudCase[] = []
  private syncErrors: string[] = []
  private activeUsers: number = 0
  private lastActivity: Date | null = null
  private currentUserId: string = 'user-' + Date.now() // Generate unique user ID
  private currentUserName: string = 'User ' + Math.floor(Math.random() * 1000) // Generate random user name
  private activityCallbacks: ((activity: UserActivity) => void)[] = []
  private presenceCallbacks: ((userCount: number) => void)[] = []

  constructor() {
    try {
      this.checkConnection()
      this.setupOfflineSupport()
      this.setupUserPresence()
      this.setupActivityTracking()
    } catch (error) {
      console.error('Failed to initialize cloud storage service:', error)
      this.isOnline = false
    }
  }

  /**
   * Setup user presence tracking
   */
  private setupUserPresence(): void {
    if (!this.isOnline) return

    try {
      // Register current user as active
      const userRef = doc(db, this.usersCollection, this.currentUserId)
      updateDoc(userRef, {
        isActive: true,
        lastSeen: serverTimestamp(),
        userName: this.currentUserName
      }).catch(() => {
        // User doesn't exist, create new user
        addDoc(collection(db, this.usersCollection), {
          id: this.currentUserId,
          userName: this.currentUserName,
          isActive: true,
          lastSeen: serverTimestamp(),
          createdAt: serverTimestamp()
        })
      })

      // Listen for active users count
      const usersQuery = query(
        collection(db, this.usersCollection),
        where('isActive', '==', true)
      )
      
      onSnapshot(usersQuery, (snapshot) => {
        this.activeUsers = snapshot.size
        this.presenceCallbacks.forEach(callback => callback(this.activeUsers))
      }, (error) => {
        console.error('Error in user presence listener:', error)
      })

      // Update last seen every 30 seconds
      setInterval(() => {
        if (this.isOnline) {
          updateDoc(userRef, {
            lastSeen: serverTimestamp()
          }).catch(() => {})
        }
      }, 30000)

      // Mark user as inactive when page unloads
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => {
          updateDoc(userRef, {
            isActive: false,
            lastSeen: serverTimestamp()
          }).catch(() => {})
        })
      }

    } catch (error) {
      console.error('Failed to setup user presence:', error)
    }
  }

  /**
   * Setup activity tracking
   */
  private setupActivityTracking(): void {
    if (!this.isOnline) return

    try {
      // Listen for activities
      const activitiesQuery = query(
        collection(db, this.activitiesCollection),
        orderBy('timestamp', 'desc')
      )
      
      onSnapshot(activitiesQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const activity = {
              ...change.doc.data(),
              timestamp: change.doc.data().timestamp?.toDate() || new Date()
            } as UserActivity
            
            this.lastActivity = activity.timestamp
            this.activityCallbacks.forEach(callback => callback(activity))
          }
        })
      }, (error) => {
        console.error('Error in activity tracking listener:', error)
      })
    } catch (error) {
      console.error('Failed to setup activity tracking:', error)
    }
  }

  /**
   * Log user activity
   */
  private async logActivity(
    action: UserActivity['action'],
    entityType: UserActivity['entityType'],
    entityId: string,
    entityName: string,
    details?: string
  ): Promise<void> {
    if (!this.isOnline) return

    try {
      const activity: Omit<UserActivity, 'timestamp'> = {
        userId: this.currentUserId,
        userName: this.currentUserName,
        action,
        entityType,
        entityId,
        entityName,
        details
      }

      await addDoc(collection(db, this.activitiesCollection), {
        ...activity,
        timestamp: serverTimestamp()
      })
    } catch (error) {
      console.error('Failed to log activity:', error)
    }
  }

  /**
   * Check if we're online and connected to Firebase
   */
  private async checkConnection(): Promise<void> {
    try {
      // Check if Firebase is properly configured
      if (!isFirebaseConfigured()) {
        this.isOnline = false
        console.log('⚠️ Firebase not configured - using localStorage fallback')
        return
      }

      // Try to read from Firestore to check connection
      const testQuery = query(collection(db, this.casesCollection))
      await getDocs(testQuery)
      this.isOnline = true
      console.log('✅ Connected to cloud storage')
    } catch (error) {
      this.isOnline = false
      console.log('⚠️ Offline mode - using local storage fallback:', error)
    }
  }

  /**
   * Setup offline support with local storage fallback
   */
  private setupOfflineSupport(): void {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.checkConnection()
        this.syncPendingChanges()
      })
      
      window.addEventListener('offline', () => {
        this.isOnline = false
        console.log('📱 Device went offline')
      })
    }
  }

  /**
   * Get all cases from cloud storage
   */
  async getAllCases(): Promise<CloudCase[]> {
    try {
      if (!this.isOnline) {
        return this.getLocalCases()
      }

      const casesRef = collection(db, this.casesCollection)
      const q = query(casesRef, orderBy('updatedAt', 'desc'))
      const snapshot = await getDocs(q)
      
      const cases: CloudCase[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        cases.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as CloudCase)
      })

      // Update local storage as backup
      this.saveLocalCases(cases)
      
      return cases
    } catch (error) {
      console.error('❌ Failed to fetch cases from cloud:', error)
      return this.getLocalCases()
    }
  }

  /**
   * Get a single case by ID
   */
  async getCaseById(caseId: string): Promise<CloudCase | null> {
    try {
      if (!this.isOnline) {
        const localCases = this.getLocalCases()
        return localCases.find(c => c.id === caseId) || null
      }

      const caseRef = doc(db, this.casesCollection, caseId)
      const snapshot = await getDoc(caseRef)
      
      if (snapshot.exists()) {
        const data = snapshot.data()
        return {
          id: snapshot.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as CloudCase
      }
      
      return null
    } catch (error) {
      console.error('❌ Failed to fetch case from cloud:', error)
      const localCases = this.getLocalCases()
      return localCases.find(c => c.id === caseId) || null
    }
  }

  /**
   * Add a new case to cloud storage
   */
  async addCase(caseData: Omit<CloudCase, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'lastUpdatedBy'>): Promise<string> {
    const newCase: Omit<CloudCase, 'id'> = {
      ...caseData,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user', // TODO: Get from auth
      lastUpdatedBy: 'current-user' // TODO: Get from auth
    }

    try {
      if (!this.isOnline) {
        return this.addLocalCase(newCase)
      }

      const casesRef = collection(db, this.casesCollection)
      const docRef = await addDoc(casesRef, {
        ...newCase,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // Update local storage as backup
      const localCases = this.getLocalCases()
      localCases.unshift({ ...newCase, id: docRef.id })
      this.saveLocalCases(localCases)

      // Log activity
      await this.logActivity('CREATE', 'CASE', docRef.id, newCase.title, 'Case created')

      console.log('✅ Case added to cloud storage:', docRef.id)
      return docRef.id
    } catch (error) {
      console.error('❌ Failed to add case to cloud:', error)
      return this.addLocalCase(newCase)
    }
  }

  /**
   * Update an existing case
   */
  async updateCase(caseId: string, updates: Partial<CloudCase>): Promise<boolean> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date(),
        lastUpdatedBy: 'current-user' // TODO: Get from auth
      }

      if (!this.isOnline) {
        return this.updateLocalCase(caseId, updateData)
      }

      const caseRef = doc(db, this.casesCollection, caseId)
      await updateDoc(caseRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      })

      // Update local storage as backup
      this.updateLocalCase(caseId, updateData)

      // Log activity
      await this.logActivity('UPDATE', 'CASE', caseId, updates.title || 'Unknown Case', 'Case updated')

      console.log('✅ Case updated in cloud storage:', caseId)
      return true
    } catch (error) {
      console.error('❌ Failed to update case in cloud:', error)
      return this.updateLocalCase(caseId, updates)
    }
  }

  /**
   * Delete a case
   */
  async deleteCase(caseId: string): Promise<boolean> {
    try {
      if (!this.isOnline) {
        return this.deleteLocalCase(caseId)
      }

      const caseRef = doc(db, this.casesCollection, caseId)
      await deleteDoc(caseRef)

      // Update local storage as backup
      this.deleteLocalCase(caseId)

      // Log activity
      await this.logActivity('DELETE', 'CASE', caseId, 'Deleted Case', 'Case deleted')

      console.log('✅ Case deleted from cloud storage:', caseId)
      return true
    } catch (error) {
      console.error('❌ Failed to delete case from cloud:', error)
      return this.deleteLocalCase(caseId)
    }
  }

  /**
   * Search cases with filters
   */
  async searchCases(filters: {
    query?: string
    court?: string
    status?: string
    priority?: string
    assignedTo?: string
  }): Promise<CloudCase[]> {
    try {
      const allCases = await this.getAllCases()
      
      return allCases.filter(caseItem => {
        if (filters.query) {
          const query = filters.query.toLowerCase()
          const matchesQuery = 
            caseItem.title?.toLowerCase().includes(query) ||
            caseItem.caseNumber?.toLowerCase().includes(query) ||
            caseItem.cnrNumber?.toLowerCase().includes(query) ||
            caseItem.petitionerName?.toLowerCase().includes(query) ||
            caseItem.respondentName?.toLowerCase().includes(query) ||
            caseItem.court?.toLowerCase().includes(query)
          
          if (!matchesQuery) return false
        }

        if (filters.court && caseItem.court !== filters.court) return false
        if (filters.status && caseItem.caseStatus !== filters.status) return false
        if (filters.priority && caseItem.priority !== filters.priority) return false
        if (filters.assignedTo && caseItem.assignedTo !== filters.assignedTo) return false

        return true
      })
    } catch (error) {
      console.error('❌ Failed to search cases:', error)
      return []
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribeToCases(callback: (cases: CloudCase[]) => void): () => void {
    if (!this.isOnline) {
      // Fallback to local storage polling
      const interval = setInterval(() => {
        callback(this.getLocalCases())
      }, 5000)
      
      return () => clearInterval(interval)
    }

    const casesRef = collection(db, this.casesCollection)
    const q = query(casesRef, orderBy('updatedAt', 'desc'))
    
    return onSnapshot(q, (snapshot) => {
      const cases: CloudCase[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        cases.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as CloudCase)
      })
      
      // Update local storage as backup
      this.saveLocalCases(cases)
      callback(cases)
    })
  }

  /**
   * Sync pending changes when back online
   */
  private async syncPendingChanges(): Promise<void> {
    if (this.pendingChanges.length === 0) return

    console.log(`🔄 Syncing ${this.pendingChanges.length} pending changes...`)
    
    for (const caseData of this.pendingChanges) {
      try {
        if (caseData.id) {
          await this.updateCase(caseData.id, caseData)
        } else {
          await this.addCase(caseData)
        }
      } catch (error) {
        this.syncErrors.push(`Failed to sync case: ${error}`)
      }
    }

    this.pendingChanges = []
  }

  /**
   * Get sync status
   */
  getSyncStatus(): CloudSyncStatus {
    return {
      isOnline: this.isOnline,
      lastSync: this.isOnline ? new Date() : null,
      pendingChanges: this.pendingChanges.length,
      syncErrors: this.syncErrors,
      activeUsers: this.activeUsers,
      lastActivity: this.lastActivity
    }
  }

  /**
   * Subscribe to user activities
   */
  onActivity(callback: (activity: UserActivity) => void): () => void {
    this.activityCallbacks.push(callback)
    
    return () => {
      const index = this.activityCallbacks.indexOf(callback)
      if (index > -1) {
        this.activityCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Subscribe to user presence changes
   */
  onPresenceChange(callback: (userCount: number) => void): () => void {
    this.presenceCallbacks.push(callback)
    
    return () => {
      const index = this.presenceCallbacks.indexOf(callback)
      if (index > -1) {
        this.presenceCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Get current user info
   */
  getCurrentUser(): { id: string; name: string } {
    return {
      id: this.currentUserId,
      name: this.currentUserName
    }
  }

  // Local storage fallback methods
  private getLocalCases(): CloudCase[] {
    try {
      const stored = localStorage.getItem('legal-cases-cloud-backup')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('❌ Failed to load local cases:', error)
      return []
    }
  }

  private saveLocalCases(cases: CloudCase[]): void {
    try {
      localStorage.setItem('legal-cases-cloud-backup', JSON.stringify(cases))
    } catch (error) {
      console.error('❌ Failed to save local cases:', error)
    }
  }

  private addLocalCase(caseData: Omit<CloudCase, 'id'>): string {
    const localCases = this.getLocalCases()
    const newId = `local-${Date.now()}`
    localCases.unshift({ ...caseData, id: newId })
    this.saveLocalCases(localCases)
    return newId
  }

  private updateLocalCase(caseId: string, updates: Partial<CloudCase>): boolean {
    const localCases = this.getLocalCases()
    const index = localCases.findIndex(c => c.id === caseId)
    if (index !== -1) {
      localCases[index] = { ...localCases[index], ...updates }
      this.saveLocalCases(localCases)
      return true
    }
    return false
  }

  private deleteLocalCase(caseId: string): boolean {
    const localCases = this.getLocalCases()
    const filtered = localCases.filter(c => c.id !== caseId)
    if (filtered.length !== localCases.length) {
      this.saveLocalCases(filtered)
      return true
    }
    return false
  }
}

// Export singleton instance
export const cloudStorageService = new CloudStorageService()
