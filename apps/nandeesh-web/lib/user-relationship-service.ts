/**
 * User Relationship Service
 * Manages connections between Users, Team Members, and Clients
 */

import { doc, getDoc, setDoc, getDocs, query, collection, where, updateDoc } from 'firebase/firestore'
import { db } from './firebase-config'

export interface UserRelationship {
  id?: string
  userId: string // Firebase Auth user UID
  entityType: 'TEAM_MEMBER' | 'CLIENT' | 'CONTACT'
  entityId: string // ID of team member, client, or contact
  entityEmail?: string // For verification
  relationshipType: 'PRIMARY' | 'SECONDARY' | 'ALIAS'
  notes?: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

/**
 * Link a Firebase Auth user to a team member
 */
export async function linkUserToTeamMember(
  userId: string,
  teamMemberId: string,
  teamMemberEmail?: string
): Promise<string> {
  try {
    const relationship: Omit<UserRelationship, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      entityType: 'TEAM_MEMBER',
      entityId: teamMemberId,
      entityEmail: teamMemberEmail,
      relationshipType: 'PRIMARY',
      isActive: true
    }

    const relationshipRef = await setDoc(
      doc(db, 'user_relationships', `${userId}_TEAM_MEMBER_${teamMemberId}`),
      {
        ...relationship,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    )

    console.log('✅ User linked to team member:', userId, teamMemberId)
    return `${userId}_TEAM_MEMBER_${teamMemberId}`
  } catch (error) {
    console.error('❌ Failed to link user to team member:', error)
    throw error
  }
}

/**
 * Link a Firebase Auth user to a client
 */
export async function linkUserToClient(
  userId: string,
  clientId: string,
  clientEmail?: string
): Promise<string> {
  try {
    const relationshipRef = await setDoc(
      doc(db, 'user_relationships', `${userId}_CLIENT_${clientId}`),
      {
        userId,
        entityType: 'CLIENT',
        entityId: clientId,
        entityEmail: clientEmail,
        relationshipType: 'PRIMARY',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    )

    console.log('✅ User linked to client:', userId, clientId)
    return `${userId}_CLIENT_${clientId}`
  } catch (error) {
    console.error('❌ Failed to link user to client:', error)
    throw error
  }
}

/**
 * Link a Firebase Auth user to a contact
 */
export async function linkUserToContact(
  userId: string,
  contactId: string,
  contactEmail?: string
): Promise<string> {
  try {
    const relationshipRef = await setDoc(
      doc(db, 'user_relationships', `${userId}_CONTACT_${contactId}`),
      {
        userId,
        entityType: 'CONTACT',
        entityId: contactId,
        entityEmail: contactEmail,
        relationshipType: 'PRIMARY',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    )

    console.log('✅ User linked to contact:', userId, contactId)
    return `${userId}_CONTACT_${contactId}`
  } catch (error) {
    console.error('❌ Failed to link user to contact:', error)
    throw error
  }
}

/**
 * Get all entities linked to a user
 */
export async function getUserRelationships(userId: string): Promise<UserRelationship[]> {
  try {
    const q = query(
      collection(db, 'user_relationships'),
      where('userId', '==', userId),
      where('isActive', '==', true)
    )
    const snapshot = await getDocs(q)
    
    const relationships: UserRelationship[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      relationships.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as UserRelationship)
    })

    return relationships
  } catch (error) {
    console.error('❌ Failed to get user relationships:', error)
    return []
  }
}

/**
 * Find user linked to a team member by email
 */
export async function findUserByTeamMemberEmail(email: string): Promise<string | null> {
  try {
    const q = query(
      collection(db, 'user_relationships'),
      where('entityType', '==', 'TEAM_MEMBER'),
      where('entityEmail', '==', email),
      where('isActive', '==', true)
    )
    const snapshot = await getDocs(q)
    
    if (!snapshot.empty) {
      const relationship = snapshot.docs[0].data()
      return relationship.userId
    }
    
    return null
  } catch (error) {
    console.error('❌ Failed to find user by team member email:', error)
    return null
  }
}

/**
 * Update relationship
 */
export async function updateUserRelationship(
  relationshipId: string,
  updates: Partial<UserRelationship>
): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'user_relationships', relationshipId), {
      ...updates,
      updatedAt: new Date()
    })
    
    return true
  } catch (error) {
    console.error('❌ Failed to update user relationship:', error)
    return false
  }
}

/**
 * Unlink user from entity (soft delete)
 */
export async function unlinkUserFromEntity(relationshipId: string): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'user_relationships', relationshipId), {
      isActive: false,
      updatedAt: new Date()
    })
    
    console.log('✅ User unlinked from entity:', relationshipId)
    return true
  } catch (error) {
    console.error('❌ Failed to unlink user from entity:', error)
    return false
  }
}

