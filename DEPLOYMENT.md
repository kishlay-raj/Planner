# Deployment Guide - Flow Planner

## Current Setup

**Platform:** Google App Engine (GAE)  
**Runtime:** Node.js 20  
**Instance:** F1 (free tier)

---

## Quick Deploy

```bash
# One command deployment
npm run deploy
```

This will:
1. Build the React app (`npm run build`)
2. Deploy to Google App Engine (`gcloud app deploy --quiet`)

---

## Step-by-Step Deployment

### Prerequisites

1. **Google Cloud SDK installed**
   ```bash
   # Check if installed
   gcloud --version
   
   # If not installed, download from:
   # https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticated with Google Cloud**
   ```bash
   # Login to your Google account
   gcloud auth login
   
   # Set your project
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Project ID configured**
   - Find your project ID in Google Cloud Console
   - Or run: `gcloud projects list`

### Deployment Steps

#### 1. Test Locally
```bash
# Run tests
npm test

# Start development server
npm start

# Test production build locally
npm run build
npm run start-prod
```

#### 2. Commit Changes
```bash
# Add all changes
git add .

# Commit
git commit -m "Your commit message"

# Push to GitHub (optional but recommended)
git push origin main
```

#### 3. Build for Production
```bash
# Create optimized production build
npm run build
```

This creates a `build/` folder with:
- Minified JavaScript
- Optimized CSS
- Compressed assets
- Service worker for PWA

#### 4. Deploy to GAE
```bash
# Deploy using npm script
npm run deploy

# Or deploy manually
gcloud app deploy --quiet
```

#### 5. Verify Deployment
```bash
# Open deployed app
gcloud app browse

# View logs
gcloud app logs tail -s default

# Check status
gcloud app describe
```

---

## Configuration Files

### app.yaml
Location: `/app.yaml`

```yaml
runtime: nodejs20          # Node.js version
env: standard             # Standard environment
instance_class: F1        # Free tier instance

handlers:
  # Serve static files
  - url: /(.*\.(json|ico|js|css|png|jpg...))$
    static_files: build/\1
    secure: always
    
  # Serve React app
  - url: /.*
    static_files: build/index.html
    secure: always

automatic_scaling:
  min_instances: 1        # Always-on
  max_instances: 1        # Keep costs low
```

### dispatch.yaml (if exists)
Used for routing between multiple services.

---

## Deployment Checklist

Before deploying:
- [ ] All tests pass (`npm test`)
- [ ] Code committed to git
- [ ] Environment variables updated (if any)
- [ ] Firebase config is correct
- [ ] Build succeeds locally
- [ ] Tested in production mode locally

After deploying:
- [ ] App loads correctly
- [ ] Login works
- [ ] Data syncs with Firebase
- [ ] PWA installs correctly
- [ ] No console errors

---

## Common Issues & Solutions

### Issue: "gcloud: command not found"
**Solution:**
```bash
# Install Google Cloud SDK
# Visit: https://cloud.google.com/sdk/docs/install
```

### Issue: "ERROR: (gcloud.app.deploy) You do not have permission"
**Solution:**
```bash
# Re-authenticate
gcloud auth login

# Set correct project
gcloud config set project YOUR_PROJECT_ID
```

### Issue: "Build failed"
**Solution:**
```bash
# Clear cache and rebuild
rm -rf build node_modules
npm install
npm run build
```

### Issue: "App Engine deployment failed"
**Solution:**
```bash
# Check app.yaml syntax
# Verify build/ folder exists
# Check GAE quotas in console
```

### Issue: "PWA not working after deploy"
**Solution:**
- Service worker needs HTTPS (GAE provides this)
- Clear browser cache
- Check `manifest.json` is accessible
- Verify service worker registers in console

---

## Deployment Environments

### Production
```bash
# Deploy to default service (production)
npm run deploy
```

### Staging (Optional)
Create `stage.yaml`:
```yaml
service: staging
runtime: nodejs20
# ... (same as app.yaml)
```

Deploy to staging:
```bash
gcloud app deploy stage.yaml
```

---

## Monitoring & Logs

### View Logs
```bash
# Real-time logs
gcloud app logs tail -s default

# Last 100 lines
gcloud app logs read --limit=100

# Filter by severity
gcloud app logs read --level=ERROR
```

### Metrics
```bash
# Open Cloud Console metrics
gcloud app open-console --logs
```

Or visit: [Google Cloud Console](https://console.cloud.google.com)
- Navigate to App Engine → Services
- View metrics, logs, and instances

---

## Costs

**F1 Instance (Free Tier):**
- 28 frontend instance hours/day FREE
- 1GB outgoing bandwidth/day FREE
- App Engine Flexible not used (would cost money)

Your current setup likely stays in free tier!

---

## Rollback

If deployment breaks something:

```bash
# List versions
gcloud app versions list

# Rollback to previous version
gcloud app versions migrate PREVIOUS_VERSION

# Delete bad version
gcloud app versions delete BAD_VERSION
```

---

## Custom Domain (Optional)

1. **Verify domain in Google Cloud Console**
2. **Add custom domain**
   ```bash
   gcloud app domain-mappings create yourdomain.com
   ```
3. **Update DNS records** (provided by Google)

---

## Automated Deployment (CI/CD)

### GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GAE

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to GAE
        uses: google-github-actions/deploy-appengine@v0.2.0
        with:
          credentials: ${{ secrets.GCP_SA_KEY }}
          project_id: YOUR_PROJECT_ID
```

---

## Quick Reference

```bash
# Deploy
npm run deploy

# View app
gcloud app browse

# View logs
gcloud app logs tail -s default

# Check versions
gcloud app versions list

# Switch traffic
gcloud app services set-traffic default --splits VERSION=1
```

---

## Your Deployment History

Based on your setup:
1. ✅ App configured for GAE (app.yaml exists)
2. ✅ Build script configured (package.json)
3. ✅ Deploy script ready (`npm run deploy`)
4. ✅ PWA configured (manifest.json, service worker)

**To deploy now:**
```bash
npm run deploy
```

---

## Post-Deployment

### Test PWA on iPad
1. Open deployed URL in Safari
2. Tap Share → Add to Home Screen
3. Install and test!

### Monitor
- Check Google Cloud Console for errors
- Monitor Firebase Analytics
- Review user feedback

---

**Status:** Ready to deploy! 🚀

Run `npm run deploy` when you're ready.
