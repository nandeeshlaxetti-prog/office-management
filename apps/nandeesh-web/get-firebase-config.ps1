# Firebase Configuration Script
Write-Host "Firebase Configuration" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""

# Project details
$projectId = "lnn-legal-app"
$apiKey = "AIzaSyCDoZu4RNkSCn7uYpX1W9e83zwdfJ2ivoY"
$authDomain = "lnn-legal-app.firebaseapp.com"
$storageBucket = "lnn-legal-app.appspot.com"
$messagingSenderId = "114196336810"
$appId = "1:114196336810:web:default"

Write-Host "Project ID: $projectId" -ForegroundColor Yellow
Write-Host "API Key: $apiKey" -ForegroundColor Yellow
Write-Host ""
Write-Host "Getting full config from Firebase Console..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Visit this URL to get your App ID:" -ForegroundColor Cyan
Write-Host "https://console.firebase.google.com/project/lnn-legal-app/settings/general" -ForegroundColor White
Write-Host ""

# Get App ID from user
$appId = Read-Host "Enter your App ID (or press Enter to use default)"

if ([string]::IsNullOrWhiteSpace($appId)) {
    $appId = "1:114196336810:web:default"
}

# Create .env.local file
Write-Host ""
Write-Host "Saving configuration to .env.local..." -ForegroundColor Yellow

$content = @"
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=$apiKey
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$authDomain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$projectId
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$storageBucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$messagingSenderId
NEXT_PUBLIC_FIREBASE_APP_ID=$appId
"@

$content | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host ""
Write-Host "Configuration saved!" -ForegroundColor Green
Write-Host ""
Write-Host "Configuration details:" -ForegroundColor Cyan
Write-Host "API Key: $apiKey" -ForegroundColor White
Write-Host "Auth Domain: $authDomain" -ForegroundColor White
Write-Host "Project ID: $projectId" -ForegroundColor White
Write-Host "Storage Bucket: $storageBucket" -ForegroundColor White
Write-Host "Messaging Sender ID: $messagingSenderId" -ForegroundColor White
Write-Host "App ID: $appId" -ForegroundColor White
Write-Host ""
Write-Host "Next: Restart your dev server and check browser console" -ForegroundColor Cyan








