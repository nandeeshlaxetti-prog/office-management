#!/bin/bash

# Firebase Setup CLI Script
# This script helps you configure Firebase for cloud storage

echo "🚀 Firebase Cloud Storage Setup"
echo "================================"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed."
    echo ""
    echo "Please install it using one of the following methods:"
    echo ""
    echo "Option 1: Using npm"
    echo "  npm install -g firebase-tools"
    echo ""
    echo "Option 2: Using pnpm"
    echo "  pnpm add -g firebase-tools"
    echo ""
    echo "After installation, run this script again."
    exit 1
fi

echo "✅ Firebase CLI is installed"
echo ""

# Prompt user for Firebase project details
echo "Please provide your Firebase configuration:"
echo ""
read -p "Firebase API Key: " FIREBASE_API_KEY
read -p "Firebase Auth Domain: " FIREBASE_AUTH_DOMAIN
read -p "Firebase Project ID: " FIREBASE_PROJECT_ID
read -p "Firebase Storage Bucket: " FIREBASE_STORAGE_BUCKET
read -p "Firebase Messaging Sender ID: " FIREBASE_MESSAGING_SENDER_ID
read -p "Firebase App ID: " FIREBASE_APP_ID

# Create .env.local file
cat > .env.local << EOF
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=${FIREBASE_API_KEY}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${FIREBASE_AUTH_DOMAIN}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${FIREBASE_STORAGE_BUCKET}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${FIREBASE_MESSAGING_SENDER_ID}
NEXT_PUBLIC_FIREBASE_APP_ID=${FIREBASE_APP_ID}
EOF

echo ""
echo "✅ Firebase configuration saved to .env.local"
echo ""
echo "Next steps:"
echo "1. Restart your development server"
echo "2. Check the browser console for '✅ Connected to cloud storage'"
echo "3. Test by adding a case - it should sync to Firebase"
echo ""
echo "If you need to get your Firebase config:"
echo "1. Go to https://console.firebase.google.com/"
echo "2. Select your project"
echo "3. Go to Project Settings > General > Your apps"
echo "4. Copy the config values"








