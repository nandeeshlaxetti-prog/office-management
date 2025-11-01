# 🔌 Disconnecting from "nandeesh-web" - Action Plan

## Current Situation

### ✅ What's CORRECT:
1. **Local Project Connection**: Connected to `office-management` ✅
   - File: `apps/nandeesh-web/.vercel/project.json`
   - Project ID: `prj_NGUBVGYlv60nNgHleto4iral9Yf8`
   - Project Name: `office-management`

2. **GitHub Repository**: Renamed to `office-management` ✅
   - URL: https://github.com/nandeeshlaxetti-prog/office-management

### ❌ What Needs to be Fixed:

1. **Two Vercel Projects Exist**:
   - `office-management` ← **Use this one!** ✅
   - `nandeesh-web` ← **Delete this!** ❌

2. **Folder Name Still Old**:
   - Current: `apps/nandeesh-web` ❌
   - Should be: `apps/office-management-web` or `apps/web` ✅

3. **Root Directory Not Set**:
   - Vercel doesn't know where to find Next.js
   - Needs: Root Directory = `apps/nandeesh-web` (for now)

## Action Plan

### Step 1: Set Root Directory in Vercel Dashboard

**For office-management project:**

1. Go to: https://vercel.com/nandeeshs-projects-8f92dec2/office-management/settings
2. Find **"Build & Development Settings"**
3. Click **"Edit"** next to **"Root Directory"**
4. Set to: `apps/nandeesh-web` (current folder name)
5. Click **"Save"**
6. Go to **Deployments** tab → Click **"Redeploy"**

### Step 2: Delete Old "nandeesh-web" Project

1. Go to: https://vercel.com/nandeeshs-projects-8f92dec2/nandeesh-web/settings
2. Scroll to bottom
3. Find **"Delete Project"** section
4. Click **"Delete"**
5. Type project name to confirm
6. Confirm deletion

This will:
- ✅ Remove old project completely
- ✅ Free up the "nandeesh-web" name
- ✅ Avoid confusion

### Step 3: Verify GitHub Connection

**Ensure GitHub repo is connected to office-management (not nandeesh-web):**

1. Go to: https://vercel.com/nandeeshs-projects-8f92dec2/office-management/settings/git
2. Verify it shows: `github.com/nandeeshlaxetti-prog/office-management`
3. Check **"Production Branch"** is set to: `master`

### Step 4: (Optional) Rename Folder

After completing the above steps, you can rename the folder:

**When no files are open:**

```powershell
# Close all editors first!
cd C:\Users\nande\Desktop\Application
Move-Item -Path "apps\nandeesh-web" -Destination "apps\web"

# Update references
git add -A
git commit -m "Rename folder from nandeesh-web to web"
git push
```

Then update Vercel Root Directory to: `apps/web`

## Current Deployment Status

| Aspect | Old (nandeesh-web) | New (office-management) |
|--------|-------------------|------------------------|
| **Vercel Project** | ❌ Exists but unused | ✅ Active |
| **Local Connection** | ❌ Disconnected | ✅ Connected |
| **GitHub Repo** | ❌ Old name | ✅ Renamed |
| **Production URL** | nandeesh-web.vercel.app | office-management-...vercel.app |
| **Folder Name** | `apps/nandeesh-web` | `apps/nandeesh-web` (needs rename) |

## Summary

**What We've Already Done:**
- ✅ Created new "office-management" Vercel project
- ✅ Connected local project to "office-management"
- ✅ Renamed GitHub repo to "office-management"
- ✅ Updated package.json and README

**What You Need to Do NOW:**

1. **Set Root Directory** in Vercel dashboard (office-management project)
   - Set to: `apps/nandeesh-web`
   - This will fix the "No Next.js version detected" error

2. **Delete old "nandeesh-web" project** from Vercel
   - Prevents confusion
   - Removes old deployments

3. **Redeploy** after setting Root Directory

**After That Works:**
4. (Optional) Rename folder to `apps/web` when convenient
5. Update Root Directory to match new folder name

## Quick Links

- **office-management settings**: https://vercel.com/nandeeshs-projects-8f92dec2/office-management/settings
- **nandeesh-web settings** (to delete): https://vercel.com/nandeeshs-projects-8f92dec2/nandeesh-web/settings
- **GitHub repo**: https://github.com/nandeeshlaxetti-prog/office-management

---

**Status**: Local project IS connected to office-management ✅  
**Action Required**: Set Root Directory in Vercel dashboard + Delete old project  
**Priority**: HIGH - Deployment currently failing

