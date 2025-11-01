# Test Firebase Connection Script
Write-Host "Testing Firebase Connection..." -ForegroundColor Cyan
Write-Host "=============================`n" -ForegroundColor Cyan

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "✅ .env.local file found" -ForegroundColor Green
    
    # Read environment variables
    $envContent = Get-Content ".env.local"
    Write-Host "`nEnvironment Variables:" -ForegroundColor Yellow
    $envContent | ForEach-Object {
        if ($_ -notmatch "^#" -and $_ -match "=") {
            $key = ($_ -split "=")[0]
            $value = ($_ -split "=")[1]
            if ($key -eq "NEXT_PUBLIC_FIREBASE_API_KEY") {
                Write-Host "$key=$($value.Substring(0, [Math]::Min(20, $value.Length)))..." -ForegroundColor White
            } else {
                Write-Host "$key=$value" -ForegroundColor White
            }
        }
    }
} else {
    Write-Host "❌ .env.local file not found" -ForegroundColor Red
}

Write-Host ""

# Check Firebase CLI login status
Write-Host "Checking Firebase CLI authentication..." -ForegroundColor Yellow
try {
    $authInfo = firebase projects:list 2>&1
    if ($authInfo -match "lnn-legal-app") {
        Write-Host "✅ Firebase CLI is authenticated" -ForegroundColor Green
        Write-Host "✅ Project 'lnn-legal-app' is accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ Unable to access project" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error checking authentication" -ForegroundColor Red
}

Write-Host ""

# Verify Firestore is enabled
Write-Host "Verifying Firestore database..." -ForegroundColor Yellow
Write-Host "Visit: https://console.firebase.google.com/project/lnn-legal-app/firestore" -ForegroundColor Cyan
Write-Host ""
Write-Host "Make sure:" -ForegroundColor Yellow
Write-Host "1. Firestore Database is enabled" -ForegroundColor White
Write-Host "2. Create database in 'test mode' for development" -ForegroundColor White
Write-Host "3. Security rules allow read/write access" -ForegroundColor White

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Ensure Firestore is enabled in Firebase Console" -ForegroundColor White
Write-Host "2. Add test data to verify connection" -ForegroundColor White
Write-Host "3. Check browser console for connection status" -ForegroundColor White








