# Firebase CLI Connection Script
Write-Host "Firebase CLI Connection Script" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
Write-Host "Checking Firebase CLI..." -ForegroundColor Yellow
$firebaseInstalled = Get-Command firebase -ErrorAction SilentlyContinue

if (-not $firebaseInstalled) {
    Write-Host "Firebase CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g firebase-tools
}

Write-Host "Firebase CLI ready" -ForegroundColor Green
Write-Host ""

# Step 1: Login
Write-Host "Step 1: Firebase Login" -ForegroundColor Cyan
Write-Host "A browser will open for authentication" -ForegroundColor Yellow
firebase login

Write-Host ""

# Step 2: List projects
Write-Host "Step 2: List Projects" -ForegroundColor Cyan
firebase projects:list

Write-Host ""
$projectId = Read-Host "Enter your Firebase Project ID"

# Step 3: Initialize Firestore
Write-Host ""
Write-Host "Step 3: Initialize Firestore" -ForegroundColor Cyan
firebase init firestore --project $projectId

# Step 4: Get web app config
Write-Host ""
Write-Host "Step 4: Get Configuration" -ForegroundColor Cyan
Write-Host ""
Write-Host "Now you need to create a web app and get the config:" -ForegroundColor Yellow
Write-Host "1. Go to: https://console.firebase.google.com/project/$projectId/settings/general" -ForegroundColor Cyan
Write-Host "2. Scroll to 'Your apps' section" -ForegroundColor Yellow
Write-Host "3. Click the Web icon </>" -ForegroundColor Yellow
Write-Host "4. Register your app and copy the config" -ForegroundColor Yellow
Write-Host ""

$apiKey = Read-Host "Enter Firebase API Key"
$authDomain = Read-Host "Enter Auth Domain"
$storageBucket = Read-Host "Enter Storage Bucket"
$messagingSenderId = Read-Host "Enter Messaging Sender ID"
$appId = Read-Host "Enter App ID"

# Step 5: Save to .env.local
Write-Host ""
Write-Host "Step 5: Saving Configuration" -ForegroundColor Cyan

$content = "# Firebase Configuration`n"
$content += "NEXT_PUBLIC_FIREBASE_API_KEY=$apiKey`n"
$content += "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$authDomain`n"
$content += "NEXT_PUBLIC_FIREBASE_PROJECT_ID=$projectId`n"
$content += "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$storageBucket`n"
$content += "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$messagingSenderId`n"
$content += "NEXT_PUBLIC_FIREBASE_APP_ID=$appId`n"

$content | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host ""
Write-Host "Configuration saved to .env.local" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart your development server"
Write-Host "2. Check browser console for connection message"
Write-Host "3. Test by adding a case"








