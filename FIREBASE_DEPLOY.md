# Firebase Hosting Deployment Guide

## Quick Deploy

```bash
# Build and deploy in one command
npm run build && firebase deploy --only hosting
```

---

## Your Firebase Setup

**Site:** flowplanner  
**URL:** https://flowplanner.web.app/  
**Public Directory:** build/  

---

## Step-by-Step Deployment

### 1. Build the App
```bash
npm run build
```

Creates optimized production build in `build/` folder.

### 2. Deploy to Firebase
```bash
firebase deploy --only hosting
```

### 3. Open Your Site
```bash
firebase open hosting:site
```

Or visit: https://flowplanner.web.app/

---

## Full Deployment Process

```bash
# 1. Make sure you're logged in
firebase login

# 2. Check which project you're deploying to
firebase use

# 3. Run tests
npm test

# 4. Build production version
npm run build

# 5. Deploy
firebase deploy --only hosting

# 6. Visit your site
open https://flowplanner.web.app/
```

---

## Firebase Commands

```bash
# Login to Firebase
firebase login

# List your projects
firebase projects:list

# Set active project
firebase use YOUR_PROJECT_ID

# Deploy hosting only
firebase deploy --only hosting

# Deploy everything (hosting + functions if any)
firebase deploy

# View deployment history
firebase hosting:channel:list

# Open Firebase Console
firebase open

# Open your website
firebase open hosting:site
```

---

## Configuration (firebase.json)

```json
{
  "hosting": {
    "site": "flowplanner",
    "public": "build",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

This ensures:
- All routes go to index.html (React Router works)
- Build folder is served
- Deployed to flowplanner.web.app

---

## Deployment Checklist

Before deploying:
- [ ] Code committed to git
- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Firebase project selected

After deploying:
- [ ] Visit https://flowplanner.web.app/
- [ ] Test login
- [ ] Test PWA installation
- [ ] Check Firebase console for errors

---

## PWA on Firebase Hosting

Your PWA files are automatically deployed:
- ✅ `manifest.json`
- ✅ `service-worker.js`
- ✅ App icons
- ✅ HTTPS (automatic with Firebase)

**To install on iPad:**
1. Open https://flowplanner.web.app/ in Safari
2. Tap Share → Add to Home Screen
3. Done!

---

## Rollback

```bash
# List previous deployments
firebase hosting:channel:list

# Rollback to previous version
# (Not directly supported, but you can redeploy old code)
git checkout PREVIOUS_COMMIT
npm run build
firebase deploy --only hosting
git checkout main
```

---

## Custom Domain (Optional)

1. **Add domain in Firebase Console**
   - Firebase Console → Hosting → Add custom domain

2. **Update DNS records** (provided by Firebase)

3. **SSL automatically provisioned**

---

## Monitoring

### View Logs
Firebase Console → Hosting → View logs

### Analytics
Firebase Console → Analytics

### Performance
Firebase Console → Performance

---

## Costs

Firebase Hosting Free Tier:
- 10 GB storage
- 360 MB/day bandwidth
- Custom domain with SSL

Your app likely stays in free tier!

---

## Troubleshooting

### "Firebase command not found"
```bash
npm install -g firebase-tools
firebase login
```

### "Not authorized"
```bash
firebase login
firebase use YOUR_PROJECT_ID
```

### "Build folder not found"
```bash
npm run build
# Then deploy again
```

### "PWA not working"
- Clear browser cache
- Check manifest.json is accessible
- Verify service worker in DevTools

---

## Quick Reference

```bash
# Deploy
npm run build && firebase deploy --only hosting

# View site
open https://flowplanner.web.app/

# Check logs
firebase hosting:channel:list

# Change project
firebase use PROJECT_ID
```

---

**Ready to deploy!**

Run:
```bash
npm run build && firebase deploy --only hosting
```

Your app will be live at: **https://flowplanner.web.app/** 🚀
