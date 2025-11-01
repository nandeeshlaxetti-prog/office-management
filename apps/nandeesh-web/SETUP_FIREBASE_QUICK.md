# Quick Firebase Setup Guide

## Step 1: Create Firebase Project

1. Go to: https://console.firebase.google.com/
2. Click **"Add project"** or **"Create a project"**
3. Enter project name (e.g., "legal-cases-app")
4. Click **"Continue"**
5. (Optional) Enable Google Analytics
6. Click **"Create project"**
7. Click **"Continue"**

## Step 2: Enable Firestore

1. In your Firebase project, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
4. Select a region close to you
5. Click **"Enable"**

## Step 3: Get Configuration

1. Click the ⚙️ **gear icon** next to "Project Overview"
2. Scroll down to **"Your apps"** section
3. Click **</> Web** icon to add a web app
4. Register your app:
   - App nickname: "Legal Cases App"
   - (Optional) Enable Firebase Hosting
5. Click **"Register app"**
6. Copy the configuration values that look like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

## Step 4: Configure Your App

Open `apps/nandeesh-web/.env.local` and add your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

## Step 5: Restart Server

Restart your development server to apply the changes.

## Verify Connection

1. Open the app in your browser
2. Open Developer Tools (F12)
3. Check the Console tab
4. You should see: **"✅ Connected to cloud storage"**

## Test Cloud Storage

1. Add a case in the app
2. Check Firebase Console > Firestore Database
3. You should see the case in the `cases` collection

## Troubleshooting

### "Firebase not configured - using localStorage fallback"

- Check that `.env.local` file exists in `apps/nandeesh-web/`
- Verify all environment variables are set correctly
- Restart your development server

### "Failed to connect to cloud storage"

- Check your internet connection
- Verify Firestore is enabled in Firebase Console
- Check Firestore security rules (should allow read/write for testing)

## Firestore Security Rules (Development)

For testing, update your Firestore security rules:

1. Go to Firebase Console > Firestore Database > Rules
2. Use these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click **"Publish"**

## Ready to Use!

Once connected, your enhanced cloud storage functions will work:
- ✅ `getAllCloudData()` - Fetch all cloud data
- ✅ `exportAllCloudData()` - Export as JSON
- ✅ `importCloudData()` - Import from JSON
- ✅ `getDetailedStatistics()` - Get analytics

Enjoy your cloud storage! 🚀








