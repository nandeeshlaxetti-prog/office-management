# Firebase Setup - Quick Links

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Firebase Project
👉 **Go to:** https://console.firebase.google.com/

1. Click **"Add project"**
2. Name: "legal-cases-app" (or your preference)
3. Continue → Create project

### Step 2: Enable Firestore
👉 **In Firebase Console:**
1. Click **"Firestore Database"** (left sidebar)
2. Click **"Create database"**
3. Select **"Start in test mode"**
4. Choose region → Enable

### Step 3: Get Web App Config
👉 **In Firebase Console:**
1. Click ⚙️ **gear icon** → Project Settings
2. Scroll to **"Your apps"**
3. Click **</> Web** icon
4. Register app → Copy config

### Step 4: Configure Environment

Edit `apps/nandeesh-web/.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...paste_your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123
```

### Step 5: Restart & Test

1. Restart dev server
2. Check browser console for: **"✅ Connected to cloud storage"**
3. Add a case → Check Firebase Console → Firestore

## 📚 Complete Documentation

- **Setup Guide:** `SETUP_FIREBASE_QUICK.md`
- **API Docs:** `ENHANCED_CLOUD_STORAGE_API.md`
- **Examples:** `examples/cloud-storage-examples.ts`

## ✅ Enhanced Functions Ready

Once configured, these functions work:
- `getAllCloudData()` - Fetch everything
- `exportAllCloudData()` - Backup to JSON
- `importCloudData()` - Restore from JSON
- `getDetailedStatistics()` - Analytics

## 🔗 Useful Links

- Firebase Console: https://console.firebase.google.com/
- Firebase Docs: https://firebase.google.com/docs
- Firestore Rules: https://console.firebase.google.com/ → Firestore → Rules

## 💡 Quick Test

After setup, open browser console and run:
```javascript
import { cloudStorageService } from '@/lib/cloud-storage-service'
const data = await cloudStorageService.getAllCloudData()
console.log('Cloud data:', data)
```








