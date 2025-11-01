# Firebase Setup CLI Script for Windows
# This script helps you configure Firebase for cloud storage

Write-Host "🚀 Firebase Cloud Storage Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
$firebaseInstalled = Get-Command firebase -ErrorAction SilentlyContinue

if (-not $firebaseInstalled) {
    Write-Host "❌ Firebase CLI is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install it using one of the following methods:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Using npm" -ForegroundColor Cyan
    Write-Host "  npm install -g firebase-tools"
    Write-Host ""
    Write-Host "Option 2: Using pnpm" -ForegroundColor Cyan
    Write-Host "  pnpm add -g firebase-tools"
    Write-Host ""
    Write-Host "After installation, run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Firebase CLI is installed" -ForegroundColor Green
Write-Host ""

# Prompt user for Firebase project details
Write-Host "Please provide your Firebase configuration:" -ForegroundColor Yellow
Write-Host ""
$FIREBASE_API_KEY = Read-Host "Firebase API Key"
$FIREBASE_AUTH_DOMAIN = Read-Host "Firebase Auth Domain"
$FIREBASE_PROJECT_ID = Read-Host "Firebase Project ID"
$FIREBASE_STORAGE_BUCKET = Read-Host "Firebase Storage Bucket"
$FIREBASE_MESSAGING_SENDER_ID = Read-Host "Firebase Messaging Sender ID"
$FIREBASE_APP_ID = Read-Host "Firebase App ID"

# Create .env.local file
$envContent = @"
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=${FIREBASE_API_KEY}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${FIREBASE_AUTH_DOMAIN}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${FIREBASE_STORAGE_BUCKET}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${FIREBASE_MESSAGING_SENDER_ID}
NEXT_PUBLIC_FIREBASE_APP_ID=${FIREBASE_APP_ID}
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host ""
Write-Host "✅ Firebase configuration saved to .env.local" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart your development server"
Write-Host "2. Check the browser console for '✅ Connected to cloud storage'"
Write-Host "3. Test by adding a case - it should sync to Firebase"
Write-Host ""
Write-Host "If you need to get your Firebase config:" -ForegroundColor Yellow
Write-Host "1. Go to https://console.firebase.google.com/"
Write-Host "2. Select your project"
Write-Host "3. Go to Project Settings > General > Your apps"
Write-Host "4. Copy the config values"








