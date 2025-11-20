# Vercel Deployment Guide

## Current Status
- **Deployed URL:** https://theory-coach-ai.vercel.app
- **Tests Route:** https://theory-coach-ai.vercel.app/tests
- **Project:** Already deployed on Vercel

## Deployment Options

### Option 1: Auto-Deploy from GitHub (Recommended)
If your Vercel project is connected to GitHub (`https://github.com/fullcircleAI/Theory-Coach.AI`), it will automatically deploy when you push to the main branch.

**Steps:**
1. Push changes to GitHub (already done ✅)
2. Vercel will automatically detect and deploy
3. Check deployment status at: https://vercel.com/ai-coachs-projects-d7800c1d

### Option 2: Manual Deployment via CLI

**Step 1: Login to Vercel**
```bash
npx vercel login
```
This will open a browser for authentication.

**Step 2: Link to Existing Project**
```bash
npx vercel link
```
When prompted:
- Select "Link to existing project"
- Choose "theory-coach-ai" or enter project name
- Confirm settings

**Step 3: Deploy to Production**
```bash
npx vercel --prod
```

### Option 3: Deploy via Vercel Dashboard
1. Go to https://vercel.com/ai-coachs-projects-d7800c1d
2. Click "Deployments" tab
3. Click "Redeploy" on the latest deployment (if needed)

## Configuration

The `vercel.json` file is already configured correctly:
- ✅ SPA routing (all routes redirect to `/index.html`)
- ✅ Build command: `npm run build`
- ✅ Output directory: `build`
- ✅ Framework: `create-react-app`

## Routes Verification

All routes should work correctly:
- `/` - Old Dashboard
- `/new-dashboard` - New Dashboard
- `/tests` - Practice Tests Page
- `/mock-exam` - Mock Exam Selection
- `/settings` - Settings
- `/practice/:testId` - Practice Test
- `/mock-exam/:examId` - Mock Exam

## Troubleshooting

### If `/tests` route shows 404:
1. Check `vercel.json` has the rewrite rule
2. Ensure build completed successfully
3. Clear Vercel cache and redeploy

### If deployment fails:
1. Check build logs in Vercel dashboard
2. Verify all dependencies are in `package.json`
3. Check for TypeScript/compilation errors

## Quick Deploy Script

After logging in, you can use:
```bash
./deploy-vercel.sh
```

