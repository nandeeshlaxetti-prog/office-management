# Vercel Deployment Guide - Office Management

## 🚀 Deploy via Vercel Web Dashboard (Recommended)

The Vercel CLI is having some configuration issues, so let's use the web interface which is more reliable for initial setup.

### Step-by-Step Instructions:

1. **Import Your GitHub Repository**
   - Go to: https://vercel.com/new
   - Click "Import Git Repository"
   - Select your GitHub account: `nandeeshlaxetti-prog`
   - Find and select: `office-management`
   - Click "Import"

2. **Configure Your Project**
   - **Project Name**: `office-management` (will be auto-filled)
   - **Framework Preset**: Next.js (should be auto-detected)
   - **Root Directory**: Click "Edit" and select `apps/nandeesh-web`
   - **Build Command**: `pnpm build` (default is fine)
   - **Output Directory**: `.next` (default is fine)
   - **Install Command**: `pnpm install`

3. **Environment Variables** (Optional - add these if needed)
   - `NODE_ENV` = `production`
   - `APP_MODE` = `web`
   - `QUEUE_BACKEND` = `local`
   - `LOG_LEVEL` = `info`
   
   Add Firebase environment variables if you have them:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (usually 2-5 minutes)
   - Your app will be live at: `https://office-management-xxx.vercel.app`

## ✅ After Successful Deployment

Once deployed, you can:

### Link Your Local Project to Vercel:
```bash
cd C:\Users\nande\Desktop\Application
vercel link
```

### Deploy Future Updates:
```bash
git add .
git commit -m "Your changes"
git push
```
(Vercel will automatically deploy when you push to GitHub)

Or deploy manually:
```bash
vercel --prod
```

## 🔧 Project Settings

- **Production Domain**: Will be `office-management.vercel.app` (or custom domain)
- **GitHub Integration**: Auto-deploys on push to master
- **Framework**: Next.js 14
- **Node Version**: 18.x or higher
- **Package Manager**: pnpm

## 📝 Important Notes

- The monorepo structure is set up with root directory as `apps/nandeesh-web`
- Automatic deployments will trigger on every push to the main/master branch
- Preview deployments will be created for pull requests
- You can add custom domains in the Vercel dashboard

## 🌐 Your Repository

- GitHub: https://github.com/nandeeshlaxetti-prog/office-management
- Vercel Dashboard: https://vercel.com/dashboard

---

**Quick Start**: Just follow steps 1-4 above and your app will be live in minutes! 🎉

