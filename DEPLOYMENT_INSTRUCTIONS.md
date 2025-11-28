# 🚀 Deployment Instructions for Theory.AI

## Step 1: Create GitHub Repository

Since the repository doesn't exist yet, you need to create it first:

### Option A: Using GitHub Website
1. Go to https://github.com/new
2. Repository name: `theory-ai` (or `Theory-Coach.AI`)
3. Description: "AI-powered Dutch driving theory test preparation app"
4. Make it **Public** or **Private** (your choice)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **"Create repository"**

### Option B: Using GitHub CLI (if installed)
```bash
gh repo create fullcircleAI/theory-ai --public --source=. --remote=origin --push
```

## Step 2: Push to GitHub

After creating the repository, run:
```bash
git push -u origin main
```

## Step 3: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)
1. Go to https://vercel.com/dashboard
2. Click **"Add New Project"**
3. Import your GitHub repository: `fullcircleAI/theory-ai`
4. Vercel will auto-detect the settings:
   - Framework: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
5. **Add Environment Variables:**
   - `REACT_APP_HUGGINGFACE_API_KEY` = `hf_...` (your API key from `.env` file)
6. Click **"Deploy"**

### Option B: Via Vercel CLI
```bash
# Login to Vercel (if not already)
npx vercel login

# Deploy
npx vercel --prod
```

## Step 4: Verify Deployment

After deployment:
1. Check your Vercel dashboard for the deployment URL
2. Test the app at the provided URL
3. Verify Hugging Face API is working in production

## 📝 Notes

- The `.env` file is gitignored, so you need to add `REACT_APP_HUGGINGFACE_API_KEY` in Vercel's environment variables
- The `vercel.json` is already configured for React Router
- All builds should work automatically after connecting GitHub

