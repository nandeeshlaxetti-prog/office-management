# Firebase CLI Auto-Connect Script
# This script logs into Firebase, lists projects, and extracts configuration

Write-Host "🔐 Firebase CLI Connection Script" -ForegroundColor Cyan
Write-Host "===============================`n" -ForegroundColor Cyan

# Step 1: Check if Firebase CLI is installed
Write-Host "Checking Firebase CLI installation..." -ForegroundColor Yellow
$firebaseInstalled = Get-Command firebase -ErrorAction SilentlyContinue

if (-not $firebaseInstalled) {
    Write-Host "❌ Firebase CLI is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing Firebase CLI..." -ForegroundColor Yellow
    npm install -g firebase-tools
    Write-Host "✅ Firebase CLI installed successfully" -ForegroundColor Green
}

Write-Host "✅ Firebase CLI is ready" -ForegroundColor Green
Write-Host ""

# Step 2: Login to Firebase
Write-Host "Step 1: Firebase Authentication" -ForegroundColor Cyan
Write-Host "--------------------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host "You will be prompted to log in to Firebase." -ForegroundColor Yellow
Write-Host "This will open a browser window for authentication." -ForegroundColor Yellow
Write-Host ""
$proceed = Read-Host "Press Enter to continue with login, or type 'skip' to skip this step"

if ($proceed -ne "skip") {
    firebase login
    Write-Host "✅ Firebase login completed" -ForegroundColor Green
}

Write-Host ""

# Step 3: List available projects
Write-Host "Step 2: Available Firebase Projects" -ForegroundColor Cyan
Write-Host "-------------------------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host "Fetching your Firebase projects..." -ForegroundColor Yellow
firebase projects:list
Write-Host ""

# Step 4: Select and initialize project
Write-Host "Step 3: Project Setup" -ForegroundColor Cyan
Write-Host "--------------------" -ForegroundColor Cyan
Write-Host ""
$projectId = Read-Host "Enter your Firebase Project ID (or create a new one)"

if ([string]::IsNullOrWhiteSpace($projectId)) {
    Write-Host "Creating new Firebase project..." -ForegroundColor Yellow
    $projectName = Read-Host "Enter project name"
    firebase projects:create $projectName
    $projectId = $projectName
}

Write-Host ""
Write-Host "✅ Using project: $projectId" -ForegroundColor Green

# Step 5: Initialize Firestore
Write-Host ""
Write-Host "Step 4: Firestore Setup" -ForegroundColor Cyan
Write-Host "----------------------" -ForegroundColor Cyan
Write-Host "Initializing Firestore..." -ForegroundColor Yellow
firebase init firestore --project $projectId --yes

# Step 6: Initialize Web App
Write-Host ""
Write-Host "Step 5: Web App Configuration" -ForegroundColor Cyan
Write-Host "-----------------------------" -ForegroundColor Cyan
Write-Host ""
$webAppNickname = Read-Host "Enter web app nickname (default: web)"

if ([string]::IsNullOrWhiteSpace($webAppNickname)) {
    $webAppNickname = "web"
}

# Create web app
firebase apps:create WEB $webAppNickname --project $projectId

# Step 7: Get web app configuration
Write-Host ""
Write-Host "Step 6: Retrieving Configuration" -ForegroundColor Cyan
Write-Host "--------------------------------" -ForegroundColor Cyan
Write-Host "Fetching your Firebase configuration..." -ForegroundColor Yellow
Write-Host ""

# Get app configuration
$config = firebase apps:sdkconfig WEB --project $projectId

# Parse the configuration
Write-Host "Raw config output:" -ForegroundColor Gray
Write-Host $config -ForegroundColor Gray
Write-Host ""

# Extract values (this is a simplified parser)
$apiKey = ($config | Select-String -Pattern 'apiKey:\s*"(.*?)"' | ForEach-Object { $_.Matches.Groups[1].Value })
$authDomain = ($config | Select-String -Pattern 'authDomain:\s*"(.*?)"' | ForEach-Object { $_.Matches.Groups[1].Value })
$projectIdValue = ($config | Select-String -Pattern 'projectId:\s*"(.*?)"' | ForEach-Object { $_.Matches.Groups[1].Value })
$storageBucket = ($config | Select-String -Pattern 'storageBucket:\s*"(.*?)"' | ForEach-Object { $_.Matches.Groups[1].Value })
$messagingSenderId = ($config | Select-String -Pattern 'messagingSenderId:\s*"(.*?)"' | ForEach-Object { $_.Matches.Groups[1].Value })
$appId = ($config | Select-String -Pattern 'appId:\s*"(.*?)"' | ForEach-Object { $_.Matches.Groups[1].Value })

# If parsing failed, ask user to manually enter
if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Host "⚠️  Could not auto-detect configuration." -ForegroundColor Yellow
    Write-Host "Please get your config from Firebase Console:" -ForegroundColor Yellow
    Write-Host "https://console.firebase.google.com/project/$projectId/settings/general" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Manually entering configuration..." -ForegroundColor Yellow
    Write-Host ""
    $apiKey = Read-Host "Firebase API Key"
    $authDomain = Read-Host "Auth Domain"
    $projectIdValue = Read-Host "Project ID"
    $storageBucket = Read-Host "Storage Bucket"
    $messagingSenderId = Read-Host "Messaging Sender ID"
    $appId = Read-Host "App ID"
}

# Step 8: Write to .env.local
Write-Host ""
Write-Host "Step 7: Saving Configuration" -ForegroundColor Cyan
Write-Host "----------------------------" -ForegroundColor Cyan

$envContent = @"
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=$apiKey
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$authDomain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$projectIdValue
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$storageBucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$messagingSenderId
NEXT_PUBLIC_FIREBASE_APP_ID=$appId
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host "Configuration saved to .env.local" -ForegroundColor Green
Write-Host ""
Write-Host "Configuration details:" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host "API Key: $apiKey" -ForegroundColor White
Write-Host "Auth Domain: $authDomain" -ForegroundColor White
Write-Host "Project ID: $projectIdValue" -ForegroundColor White
Write-Host "Storage Bucket: $storageBucket" -ForegroundColor White
Write-Host "Messaging Sender ID: $messagingSenderId" -ForegroundColor White
Write-Host "App ID: $appId" -ForegroundColor White
Write-Host ""

# Step 9: Summary
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart your development server" -ForegroundColor White
Write-Host "2. Check browser console for '✅ Connected to cloud storage'" -ForegroundColor White
Write-Host "3. Test by adding a case - it should sync to Firebase" -ForegroundColor White
Write-Host ""
Write-Host "Your Firebase console: https://console.firebase.google.com/project/$projectId" -ForegroundColor Cyan
Write-Host ""
