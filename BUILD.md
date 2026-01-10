# Building Flow Planner Desktop App

## Quick Reference

### Build for Mac
```bash
npm run electron:build:mac
```

This creates:
- `dist/Flow Planner.app` - Mac application
- `dist/Flow Planner-0.1.0.dmg` - Installer (share this)
- `dist/Flow Planner-0.1.0-mac.zip` - Archive

### Installation
1. Open `dist/` folder
2. Double-click `Flow Planner-0.1.0.dmg`
3. Drag app to Applications folder

### Development Mode
```bash
npm run electron:dev
```

## Build Process

1. **Stop any running servers** (port 3000)
2. **Run build command:**
   ```bash
   npm run electron:build:mac
   ```
3. **Wait** (~2-5 minutes for first build)
4. **Find output** in `dist/` folder

## Distributing

### Share the .dmg file:
- Located: `dist/Flow Planner-0.1.0.dmg`
- Users download and drag app to Applications

### Or share the .app directly:
- Located: `dist/Flow Planner.app`
- Compress as ZIP if sharing
- Users drag to Applications

## Troubleshooting

### Port 3000 already in use
```bash
# Find and kill process
lsof -i :3000
kill -9 <PID>
```

### Clean rebuild
```bash
rm -rf dist build
npm run electron:build:mac
```

### macOS Security Warning
**First launch:** System Settings → Privacy & Security → "Open Anyway"

**Or remove quarantine:**
```bash
xattr -cr "/Applications/Flow Planner.app"
```

## Version Updates

To update version number:

1. Edit `package.json`:
   ```json
   "version": "0.2.0"
   ```

2. Rebuild:
   ```bash
   npm run electron:build:mac
   ```

New files: `Flow Planner-0.2.0.dmg`, etc.

---

**Commands Summary:**
- `npm run electron:dev` - Development
- `npm run electron:build:mac` - Build for Mac
- `npm start` - Web version only
