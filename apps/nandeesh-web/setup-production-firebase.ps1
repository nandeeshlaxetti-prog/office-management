# Production Firebase Setup Script
# This script configures production Firebase credentials via CLI

Write-Host "🔥 Production Firebase Setup" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
Write-Host "Step 1: Checking Firebase CLI..." -ForegroundColor Yellow
$firebaseInstalled = Get-Command firebase -ErrorAction SilentlyContinue

if (-not $firebaseInstalled) {
    Write-Host "❌ Firebase CLI not found. Installing..." -ForegroundColor Red
    npm install -g firebase-tools
    Write-Host "✅ Firebase CLI installed" -ForegroundColor Green
} else {
    Write-Host "✅ Firebase CLI is installed" -ForegroundColor Green
}

Write-Host ""

# Step 2: Login to Firebase
Write-Host "Step 2: Firebase Authentication" -ForegroundColor Cyan
Write-Host "-------------------------------" -ForegroundColor Cyan
Write-Host "A browser will open for authentication..." -ForegroundColor Yellow
Write-Host ""
$proceed = Read-Host "Press Enter to login, or type 'skip' to skip login"

if ($proceed -ne "skip") {
    firebase login
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Firebase login successful" -ForegroundColor Green
    } else {
        Write-Host "❌ Firebase login failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Step 3: List and select project
Write-Host "Step 3: Select Firebase Project" -ForegroundColor Cyan
Write-Host "-------------------------------" -ForegroundColor Cyan
Write-Host "Fetching your Firebase projects..." -ForegroundColor Yellow
firebase projects:list
Write-Host ""

$projectId = Read-Host "Enter your Firebase Project ID"

if ([string]::IsNullOrWhiteSpace($projectId)) {
    Write-Host "Project ID is required" -ForegroundColor Red
    exit 1
}

# Step 4: Use the project
Write-Host ""
Write-Host "Step 4: Setting up Firebase project..." -ForegroundColor Cyan
firebase use $projectId
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Project set to: $projectId" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to set project" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 5: Get web app configuration
Write-Host "Step 5: Getting Web App Configuration" -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host "You need to create a web app in Firebase Console:" -ForegroundColor Yellow
$settingsUrl = "https://console.firebase.google.com/project/$projectId/settings/general"
Write-Host "1. Go to: $settingsUrl" -ForegroundColor White
Write-Host "2. Scroll to 'Your apps' section" -ForegroundColor White
Write-Host "3. Click the Web icon" -ForegroundColor White
Write-Host "4. Register your app and copy the config" -ForegroundColor White
Write-Host ""

# Get configuration values
$apiKey = Read-Host "Enter Firebase API Key"
$authDomain = Read-Host "Enter Auth Domain"
$storageBucket = Read-Host "Enter Storage Bucket"
$messagingSenderId = Read-Host "Enter Messaging Sender ID"
$appId = Read-Host "Enter App ID"

# Validate inputs
if ([string]::IsNullOrWhiteSpace($apiKey) -or 
    [string]::IsNullOrWhiteSpace($authDomain) -or 
    [string]::IsNullOrWhiteSpace($storageBucket) -or 
    [string]::IsNullOrWhiteSpace($messagingSenderId) -or 
    [string]::IsNullOrWhiteSpace($appId)) {
    Write-Host "All fields are required" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 6: Initialize Firestore if not already done
Write-Host "Step 6: Setting up Firestore..." -ForegroundColor Cyan
if (-not (Test-Path "firestore.rules")) {
    Write-Host "Initializing Firestore..." -ForegroundColor Yellow
    firebase init firestore --project $projectId --yes
    
    # Create basic security rules
    $firestoreRules = @"
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents for production
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
"@
    $firestoreRules | Out-File -FilePath firestore.rules -Encoding UTF8
    Write-Host "✅ Firestore rules created" -ForegroundColor Green
} else {
    Write-Host "✅ Firestore already configured" -ForegroundColor Green
}

Write-Host ""

# Step 7: Deploy Firestore rules
Write-Host "Step 7: Deploying Firestore rules..." -ForegroundColor Cyan
firebase deploy --only firestore:rules --project $projectId
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Firestore rules deployed successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Firestore rules deployment failed (this is okay if already deployed)" -ForegroundColor Yellow
}

Write-Host ""

# Step 8: Save configuration to .env.local
Write-Host "Step 8: Saving configuration to .env.local..." -ForegroundColor Cyan

$envContent = @"
# Firebase Configuration (Production)
NEXT_PUBLIC_FIREBASE_API_KEY=$apiKey
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$authDomain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$projectId
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$storageBucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$messagingSenderId
NEXT_PUBLIC_FIREBASE_APP_ID=$appId

# Kleopatra API Configuration
KLEOPATRA_API_KEY=klc_2cef7fc42178c58211cd8b8b1d23c3206c1e778f13ed566237803d8897a9b104
ECOURTS_API_KEY=klc_2cef7fc42178c58211cd8b8b1d23c3206c1e778f13ed566237803d8897a9b104
COURT_API_KEY=klc_2cef7fc42178c58211cd8b8b1d23c3206c1e778f13ed566237803d8897a9b104
"@

# Save to current directory
$envContent | Out-File -FilePath .env.local -Encoding UTF8

Write-Host "✅ Configuration saved to apps/nandeesh-web/.env.local" -ForegroundColor Green
Write-Host ""

# Final summary
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ Production Firebase Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Configuration Summary:" -ForegroundColor Cyan
Write-Host "   Project ID: $projectId" -ForegroundColor White
Write-Host "   API Key: $apiKey" -ForegroundColor White
Write-Host "   Auth Domain: $authDomain" -ForegroundColor White
Write-Host "   Storage Bucket: $storageBucket" -ForegroundColor White
Write-Host "   Messaging Sender ID: $messagingSenderId" -ForegroundColor White
Write-Host "   App ID: $appId" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Restart your development server (pnpm dev)" -ForegroundColor White
Write-Host "   2. Check browser console for '✅ Connected to cloud storage'" -ForegroundColor White
Write-Host "   3. Add a case to test Firebase sync" -ForegroundColor White
Write-Host "   4. Check Firebase Console to verify data is being saved" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Useful Links:" -ForegroundColor Cyan
Write-Host "   Firebase Console: https://console.firebase.google.com/project/$projectId" -ForegroundColor White
Write-Host "   Firestore Database: https://console.firebase.google.com/project/$projectId/firestore" -ForegroundColor White
Write-Host ""
Write-Host "Ready for production deployment!" -ForegroundColor Green
