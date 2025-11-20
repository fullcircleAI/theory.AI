# 🚀 Deploy to Vercel - Quick Guide

## ✅ **PRE-DEPLOYMENT CHECKLIST**
- [x] Build completes successfully
- [x] All warnings cleaned up
- [x] Code committed to GitHub
- [x] `vercel.json` configured correctly
- [ ] Authenticated with Vercel
- [ ] Deployed to production

---

## 🎯 **DEPLOYMENT STEPS**

### **Step 1: Authenticate with Vercel**
```bash
npx vercel login
```
- This will open a browser window
- Click "Continue" to authenticate
- Return to terminal when done

### **Step 2: Link to Existing Project (if needed)**
```bash
npx vercel link
```
- Select "Link to existing project"
- Choose "theory-coach-ai" or your project name
- Confirm settings

### **Step 3: Deploy to Production**
```bash
npx vercel --prod
```
- This will deploy to: https://theory-coach-ai.vercel.app
- Wait for deployment to complete
- Check the URL provided

---

## 🔍 **VERIFY DEPLOYMENT**

### **Test These URLs:**
1. **Dashboard:** https://theory-coach-ai.vercel.app/new-dashboard
2. **Practice Tests:** https://theory-coach-ai.vercel.app/tests
3. **Mock Exam:** https://theory-coach-ai.vercel.app/mock-exam
4. **Settings:** https://theory-coach-ai.vercel.app/settings

### **Check:**
- [ ] All routes load correctly
- [ ] No console errors
- [ ] Navigation works
- [ ] Dashboard displays correctly
- [ ] Practice tests load
- [ ] Mock exams accessible

---

## 🎬 **FOR SHARK TANK**

**Primary URL:** https://theory-coach-ai.vercel.app/new-dashboard

**Demo Flow:**
1. Start at `/new-dashboard` - Show AI insights
2. Click "Start" → Navigate to practice test
3. Complete test → Show results page
4. Click "Next Test" → Show adaptive learning
5. Navigate to `/mock-exam` → Show dynamic mock exams

---

## 🐛 **TROUBLESHOOTING**

### **If deployment fails:**
1. Check build logs in Vercel dashboard
2. Verify `vercel.json` is correct
3. Check for environment variables needed
4. Verify GitHub connection (if auto-deploy)

### **If routes don't work:**
- Verify `vercel.json` has the rewrite rule
- Check SPA routing is enabled
- Clear browser cache

---

## 📝 **NOTES**

- **Auto-deploy:** If GitHub is connected, pushing to main branch auto-deploys
- **Manual deploy:** Use `npx vercel --prod` for manual deployments
- **Preview:** Use `npx vercel` (without --prod) for preview deployments

---

**🎯 Ready to deploy! Run the commands above.**

