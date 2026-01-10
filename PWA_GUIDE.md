# Flow Planner - iPad PWA Guide

## Quick Start

### Installing on iPad

1. **Open Safari** on your iPad
2. Go to your Flow Planner URL
3. Tap the **Share** button (📤)
4. Scroll and tap **"Add to Home Screen"**
5. Tap **"Add"** in the top right
6. Done! Find the app on your home screen

---

## What You Get

✅ **Works like a native app**
- Full screen (no browser UI)
- Custom Flow Planner icon
- Launch from home screen
- Appears in app switcher

✅ **Works offline**
- View tasks and calendar
- Read notes
- Auto-syncs when back online

✅ **All features included**
- Calendar & tasks
- Notes & journal
- Drag & drop
- Firebase sync

---

## Testing Locally

### On Your Computer
```bash
# Start the app
npm start
```

### Get Your IP Address
```bash
# Find your computer's IP
ifconfig | grep "inet " | grep -v 127.0.0.1
# Example output: inet 192.168.1.100
```

### On iPad
1. Open Safari
2. Go to `http://YOUR_IP:3000`
   - Example: `http://192.168.1.100:3000`
3. Follow installation steps above

**Note:** iPad and computer must be on same WiFi network

---

## Deploying for Production

### Option 1: Firebase Hosting (Recommended)

```bash
# Install Firebase CLI (one time)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting
# Select: Use existing project
# Select: Your Firebase project
# Public directory: build
# Single-page app: Yes
# Overwrite index.html: No

# Build and deploy
npm run build
firebase deploy

# You'll get a URL like:
# https://your-project.web.app
```

### Option 2: Vercel (Easiest)

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Import your repository
4. Build command: `npm run build`
5. Output directory: `build`
6. Deploy!

### Option 3: Netlify

1. Run `npm run build`
2. Go to [netlify.com](https://netlify.com)
3. Drag & drop the `build/` folder
4. Done!

---

## Installation Instructions for Users

Share this with anyone who wants to install:

### iPad Installation
1. Open **Safari** (must use Safari, not Chrome)
2. Go to [YOUR_APP_URL]
3. Tap **Share** button (square with arrow)
4. Select **"Add to Home Screen"**
5. Tap **"Add"**

### iPhone Installation
Same steps as iPad!

### Desktop (Chrome/Edge)
1. Open the URL in Chrome or Edge
2. Click the install icon (➕) in address bar
3. Click "Install"

---

## Features

### Offline Mode
**What works offline:**
- View all existing tasks
- Browse calendar
- Read notes and journal entries
- Navigate all screens

**What needs internet:**
- Sync changes to cloud
- Google sign-in
- Real-time updates from other devices

**Auto-sync:**
When you reconnect, all changes automatically sync!

### Storage
- Data cached on device
- Syncs with Firebase cloud
- Works on multiple devices

---

## Troubleshooting

### Can't Find "Add to Home Screen"
**Solution:** Make sure you're using **Safari**, not Chrome or another browser.

### Icon Not Showing
**Fix:**
1. Make sure the app is built: `npm run build`
2. Icons are in `public/` folder
3. Rebuild and redeploy

### PWA Not Working
**Checklist:**
- [ ] Using Safari on iPad
- [ ] URL uses HTTPS (or localhost)
- [ ] `manifest.json` is accessible
- [ ] Service worker registered (check console)

### Updates Not Showing
**Solution:**
1. Close the PWA completely
2. Reopen the PWA
3. Or: Open Safari, visit URL, clear cache

**Clear cache:**
1. iPad Settings → Safari
2. Clear History and Website Data
3. Reinstall PWA

### "Not Secure" Warning
**Production only:**
- PWA requires HTTPS
- Use Firebase Hosting, Vercel, or Netlify (all provide free HTTPS)
- Or add SSL certificate to your domain

**Development:**
- `localhost` works without HTTPS
- Use your computer's IP when testing on iPad

---

## Updating the App

### For Developers

1. **Make your code changes**
2. **Test locally:**
   ```bash
   npm start
   ```
3. **Build for production:**
   ```bash
   npm run build
   ```
4. **Deploy:**
   ```bash
   firebase deploy
   # or push to GitHub (if using Vercel/Netlify)
   ```

### For Users
**Automatic:** Next time they open the app, it updates automatically!

**Manual refresh:**
- Pull down to refresh
- Or close and reopen app

---

## Development Workflow

```bash
# 1. Make changes to your React code
# Edit files in src/

# 2. Test in browser
npm start
# Opens http://localhost:3000

# 3. Test PWA locally
npm run build
npx serve -s build

# 4. Test on iPad
# Use your computer's IP: http://192.168.1.X:3000

# 5. Deploy to production
npm run build
firebase deploy
```

---

## Files Added for PWA

```
public/
├── manifest.json          # PWA configuration
├── service-worker.js      # Offline functionality
├── icon-192.png          # Small icon
└── icon-512.png          # Large icon

src/
└── index.js              # Service worker registration (updated)

public/
└── index.html            # PWA meta tags (updated)
```

---

## Common Issues

### Issue: Service worker not registering
**Check console for:**
```
PWA: Service Worker registered successfully
```

**If you see errors:**
- Make sure `service-worker.js` is in `public/` folder
- Build the app: `npm run build`
- Service worker only works on HTTPS or localhost

### Issue: App looks weird on iPad
**Responsive design:**
- App should adapt to iPad screen size
- Test on different orientations
- Check viewport meta tag in `index.html`

### Issue: Can't login on iPad
**Google sign-in:**
- Make sure redirect URLs are configured in Firebase Console
- Add your production URL to authorized domains
- Test in Safari (not in-app browser)

---

## Advanced Configuration

### Custom Domain
1. Buy domain (e.g., flowplanner.app)
2. Connect to hosting provider
3. Update Firebase/Vercel DNS settings
4. Get free SSL certificate (automatic)

### Update Icon
1. Replace `public/icon-512.png` with new icon (512x512 px)
2. Generate smaller icon:
   ```bash
   sips -z 192 192 public/icon-512.png --out public/icon-192.png
   ```
3. Rebuild and deploy

### Customize Manifest
Edit `public/manifest.json`:
```json
{
  "short_name": "Flow",
  "name": "Flow Planner Pro",
  "theme_color": "#1976d2",
  "background_color": "#ffffff"
}
```

---

## Testing Checklist

Before deploying:
- [ ] App installs from Safari on iPad
- [ ] Icon appears correctly on home screen
- [ ] Launches in full screen
- [ ] All features work
- [ ] Works offline (test in airplane mode)
- [ ] Syncs data when back online
- [ ] Looks good on iPad (portrait & landscape)
- [ ] Google sign-in works
- [ ] Updates work (make a change, deploy, verify update)

---

## Quick Reference

### Local Development
```bash
npm start                    # Dev server
npm run build               # Production build
npx serve -s build          # Test production build locally
```

### Deployment
```bash
npm run build && firebase deploy    # Firebase
git push origin main                # Vercel/Netlify (auto-deploy)
```

### iPad Installation
Safari → URL → Share → Add to Home Screen

### Troubleshooting
Clear cache: Settings → Safari → Clear History

---

## Support

**PWA not working?**
1. Check browser console for errors
2. Verify HTTPS (or using localhost)
3. Test service worker registration
4. Clear cache and reinstall

**Need help?**
- Check Firebase/Vercel documentation
- Test on different devices
- Use browser DevTools

---

## Resources

- [PWA Documentation](https://web.dev/pwa/)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- [Vercel Deployment](https://vercel.com/docs)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**Your Flow Planner is now a fully functional PWA!** 🎉

Users can install it on iPad, iPhone, Android, and desktop like a native app.
