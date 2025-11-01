# Cloud Storage Setup Guide

## Overview

This application includes cloud storage capabilities using **Firebase Firestore**. The cloud storage service provides:

- **Real-time Sync**: Cases and data sync in real-time across devices
- **Collaboration**: Multiple users can work simultaneously
- **Activity Tracking**: See what other users are doing
- **Offline Support**: Automatic fallback to localStorage when offline
- **Data Backup**: Automatic backup to cloud storage

## Current Status

✅ **Cloud Storage Service**: Fully implemented  
✅ **Fallback Support**: Works with localStorage when Firebase not configured  
⚠️ **Firebase Configuration**: Needs to be set up (currently using demo config)

## Quick Setup (5 minutes)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name (e.g., "legal-cases-app")
4. Enable/disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Firestore

1. In your Firebase project, click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose **"Start in test mode"** (for development)
4. Select a region close to you
5. Click "Enable"

### Step 3: Get Configuration

1. Click the gear icon ⚙️ next to "Project Overview"
2. Scroll down to "Your apps"
3. Click "Add app" and select **Web** (</> icon)
4. Register your app (app nickname: "Legal Cases App")
5. Copy the configuration values

### Step 4: Configure Environment Variables

Create a file `.env.local` in `apps/nandeesh-web/` with your Firebase config:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# Optional: Analytics
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Step 5: Test Cloud Storage

1. Restart your development server
2. Open http://localhost:3000
3. Open browser console and check for "✅ Connected to cloud storage"
4. Try adding a case - it should sync to Firebase
5. Open multiple browser tabs to see real-time collaboration

## Features

### Real-time Collaboration

Multiple users can:
- See all cases in real-time
- View active users count
- See recent activities
- Work offline with automatic sync

### Activity Tracking

Monitor user activities:
- Case creation
- Case updates
- Case deletion
- User presence

### Offline Support

- Automatically falls back to localStorage when offline
- Syncs changes when back online
- No data loss

## Testing Cloud Storage

### Test in Browser Console

```javascript
// Check if Firebase is configured
import { isFirebaseConfigured } from '@/lib/firebase-config'
console.log('Firebase configured:', isFirebaseConfigured())

// Check cloud storage status
import { cloudStorageService } from '@/lib/cloud-storage-service'
console.log('Cloud storage status:', cloudStorageService.getSyncStatus())
```

### Test Real-time Sync

1. Open the app in two browser tabs
2. Add a case in tab 1
3. The case should appear in tab 2 immediately

## Troubleshooting

### "Firebase not configured - using localStorage fallback"

**Solution**: Check your `.env.local` file exists and has the correct Firebase config values.

### "Failed to connect to cloud storage"

**Solution**: 
1. Check your internet connection
2. Verify Firebase project exists and Firestore is enabled
3. Check Firestore security rules (should allow read/write for testing)

### Cases not syncing

**Solution**:
1. Open browser console
2. Check for error messages
3. Verify Firebase project ID is correct

## Firestore Security Rules

For development, use these rules in Firestore:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

For production, use authenticated access:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## API Reference

### CloudStorageService

```typescript
// Get all cases
const cases = await cloudStorageService.getAllCases()

// Get single case
const caseData = await cloudStorageService.getCaseById(id)

// Add case
const caseId = await cloudStorageService.addCase(caseData)

// Update case
await cloudStorageService.updateCase(caseId, updates)

// Delete case
await cloudStorageService.deleteCase(caseId)

// Search cases
const results = await cloudStorageService.searchCases({ query: 'search term' })

// Get sync status
const status = cloudStorageService.getSyncStatus()

// Subscribe to real-time updates
const unsubscribe = cloudStorageService.subscribeToCases((cases) => {
  console.log('Cases updated:', cases)
})

// Subscribe to activities
const unsubscribeActivities = cloudStorageService.onActivity((activity) => {
  console.log('User activity:', activity)
})

// Subscribe to presence changes
const unsubscribePresence = cloudStorageService.onPresenceChange((userCount) => {
  console.log('Active users:', userCount)
})
```

## Cost Considerations

Firebase Firestore has a generous free tier:
- 50K reads/day
- 20K writes/day
- 20K deletes/day
- 1GB storage

For most small to medium applications, the free tier is sufficient.

## Migration from localStorage

The app automatically migrates data from localStorage to cloud storage when Firebase is configured. Check the migration service for more details.

## Support

For issues or questions:
1. Check this guide
2. Check Firebase documentation
3. Check browser console for errors
4. Verify environment variables are set correctly








