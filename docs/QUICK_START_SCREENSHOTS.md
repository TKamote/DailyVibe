# Quick Start: Taking Google Play Store Screenshots

## 🚀 Step-by-Step Guide

### Step 1: Download Android Studio (5 minutes)
**Direct link:** https://developer.android.com/studio

Or download via terminal:
```bash
# Download Android Studio for macOS
curl -L -o ~/Downloads/android-studio.dmg \
  "https://redirector.gvt1.com/edgedl/android/studio/install/2024.1.1.11/android-studio-2024.1.1.11-mac.dmg"

# Open the installer
open ~/Downloads/android-studio.dmg
```

### Step 2: Install Android Studio (10-15 minutes)
1. Drag Android Studio to Applications folder
2. Open Android Studio
3. Choose **Standard** installation
4. Accept licenses and wait for SDK download

### Step 3: Create an Emulator (5 minutes)
1. Open Android Studio
2. Click **Tools** → **Device Manager**
3. Click **Create Device**
4. Select **Pixel 6** (or Pixel 7)
5. Click **Next**
5. Select **API 34 (Android 14)** → Click **Download** if needed
6. Click **Next** → **Finish**

### Step 4: Start Emulator (2-3 minutes first time)
1. In Device Manager, click **▶️ Play** button
2. Wait for emulator to boot (shows Android home screen)

### Step 5: Add Android SDK to PATH (One-time setup)
Add this to your `~/.zshrc` file:
```bash
export PATH="$HOME/Library/Android/sdk/platform-tools:$PATH"
```

Then reload:
```bash
source ~/.zshrc
```

### Step 6: Run Your App on Emulator
```bash
# Make sure you're in the project directory
cd /Users/davidv.onquit/GitHubCodes/DailyVibe

# Start Expo
npm start

# Press 'a' to open on Android emulator
# OR use:
npx expo run:android
```

### Step 7: Take Screenshots
**Option A: Using the script (Easiest)**
```bash
# Take a screenshot (saves to Desktop/DailyVibe-Screenshots/)
./scripts/take-screenshot.sh home-screen
./scripts/take-screenshot.sh add-habit
./scripts/take-screenshot.sh stats
./scripts/take-screenshot.sh settings
```

**Option B: Using adb command**
```bash
adb exec-out screencap -p > ~/Desktop/screenshot.png
```

**Option C: Using Android Studio**
- Click the camera icon in the emulator toolbar

## 📸 Recommended Screenshots

Take these 6-8 screenshots for Google Play Store:

1. **home-screen.png** - Main screen with habits list
2. **add-habit.png** - Adding a new habit
3. **stats.png** - Statistics and streaks
4. **settings.png** - App settings
5. **edit-habit.png** - Editing a habit
6. **calendar-view.png** - Calendar view (if available)
7. **dark-mode.png** - Dark mode view
8. **streak-display.png** - Streak visualization

## ✅ Checklist Before Taking Screenshots

- [ ] Emulator is running and fully booted
- [ ] App is installed and running on emulator
- [ ] Sample data is added (create some habits)
- [ ] App is in a clean state (no debug overlays)
- [ ] Using light mode (unless showing dark mode feature)
- [ ] All screens are navigated to and ready

## 🎯 Quick Commands Reference

```bash
# Check if emulator is connected
adb devices

# Start Expo and open on Android
npm start
# Then press 'a'

# Take screenshot with script
./scripts/take-screenshot.sh screenshot-name

# Take screenshot manually
adb exec-out screencap -p > ~/Desktop/screenshot.png

# List all screenshots
ls ~/Desktop/DailyVibe-Screenshots/
```

## 📱 Google Play Store Requirements

- **Minimum:** 2 phone screenshots
- **Maximum:** 8 phone screenshots
- **Size:** 1080 x 1920 pixels (portrait) or 1920 x 1080 (landscape)
- **Format:** PNG or JPEG
- **File size:** Max 8MB per image

## 🐛 Troubleshooting

**"adb: command not found"**
```bash
# Add to ~/.zshrc
export PATH="$HOME/Library/Android/sdk/platform-tools:$PATH"
source ~/.zshrc
```

**"No devices found"**
- Make sure emulator is running
- Wait for it to fully boot
- Check: `adb devices`

**App won't install**
- Make sure emulator is fully booted
- Try: `adb kill-server && adb start-server`
- Restart Expo: `npm start` then press 'a'

**Screenshots are blurry**
- Use Pixel 6 or Pixel 7 (higher DPI)
- Increase emulator resolution in Device Manager

## 🎨 After Taking Screenshots

1. Review screenshots in `~/Desktop/DailyVibe-Screenshots/`
2. Edit if needed (crop, adjust brightness)
3. Ensure all are 1080x1920 or 1920x1080
4. Upload to Google Play Console when creating your listing

---

**Need help?** Check the detailed guide: `docs/ANDROID_STUDIO_SETUP.md`


