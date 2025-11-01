# 🔧 Vercel Deployment Error Fix - Root Directory Configuration

## Error Message
```
Error: No Next.js version detected. Make sure your package.json has "next" in either "dependencies" or "devDependencies". Also check your Root Directory setting matches the directory of your package.json file.
```

## Problem
Even though Next.js is installed (`+ next 14.0.0` shows in logs), Vercel can't detect it because:
- The project is a **monorepo** with Next.js in `apps/nandeesh-web/`
- Vercel is looking for `package.json` at the root level
- But our Next.js `package.json` is in `apps/nandeesh-web/package.json`

## Solution: Configure Root Directory in Vercel Dashboard

### Step 1: Open Project Settings
Go to: https://vercel.com/nandeeshs-projects-8f92dec2/office-management/settings

### Step 2: Set Root Directory
1. Scroll down to **"Build & Development Settings"**
2. Find **"Root Directory"**
3. Click **"Edit"**
4. Set to: `apps/nandeesh-web`
5. Click **"Save"**

### Step 3: Update Build Settings (if needed)
Once Root Directory is set, update these settings:

**Framework Preset**: Next.js (auto-detected)

**Build Command**: `pnpm build` (remove the `cd apps/nandeesh-web &&` part)

**Output Directory**: `.next` (remove the `apps/nandeesh-web/` prefix)

**Install Command**: `pnpm install --no-frozen-lockfile` (remove the `cd` part)

### Step 4: Redeploy
After saving settings, trigger a new deployment:
- Click **"Deployments"** tab
- Click **"Redeploy"** on the latest deployment

## Alternative: Remove Root vercel.json (Recommended)

Since we're now deploying the `office-management` project (not the old `nandeesh-web`), we should remove the root `vercel.json` that's causing conflicts:

```bash
cd C:\Users\nande\Desktop\Application
git rm vercel.json
git commit -m "Remove root vercel.json - use dashboard settings for monorepo"
git push
```

Then configure everything via Vercel dashboard as described above.

## Why This Happened

We have TWO Vercel configurations:
1. **Root `vercel.json`** - Uses manual `cd` commands
2. **`apps/nandeesh-web/vercel.json`** - Proper app config

When deploying to the `office-management` project from GitHub, Vercel reads the root `vercel.json` which has:
```json
{
  "buildCommand": "cd apps/nandeesh-web && pnpm build",
  "installCommand": "cd apps/nandeesh-web && pnpm install --no-frozen-lockfile"
}
```

This installs packages correctly BUT Vercel's Next.js detection runs BEFORE the `cd` command, so it looks for `package.json` at the root (where there's no Next.js).

## Correct Configuration

### Option 1: Dashboard Configuration (Recommended)
- **Root Directory**: `apps/nandeesh-web`
- **Build Command**: `pnpm build`
- **Install Command**: `pnpm install --no-frozen-lockfile`
- **Output Directory**: `.next`
- **No root vercel.json**

### Option 2: Root vercel.json with rootDirectory
Keep root `vercel.json` but add `rootDirectory`:
```json
{
  "version": 2,
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "installCommand": "pnpm install --no-frozen-lockfile",
  "framework": "nextjs",
  "rootDirectory": "apps/nandeesh-web"
}
```

But this is redundant if you set it in the dashboard.

## Quick Fix Steps

### Fastest Solution:
1. **Delete root vercel.json** (it's causing conflicts)
2. **Set Root Directory in Vercel dashboard** to `apps/nandeesh-web`
3. **Redeploy**

I'll do this for you now...

---

**Issue**: Vercel can't find Next.js in monorepo  
**Cause**: Root directory not configured  
**Fix**: Set `apps/nandeesh-web` as Root Directory in Vercel settings

