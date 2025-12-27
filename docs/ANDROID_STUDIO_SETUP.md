# Android Studio Setup Guide for Google Play Store Screenshots

## Quick Download Link
**Direct Download (macOS):**
https://developer.android.com/studio

Or use this direct link:
https://redirector.gvt1.com/edgedl/android/studio/install/2024.1.1.11/android-studio-2024.1.1.11-mac.dmg

## Installation Steps

### 1. Download Android Studio
- Visit: https://developer.android.com/studio
- Click "Download Android Studio" (it will detect macOS automatically)
- The download is approximately 1GB

### 2. Install Android Studio
1. Open the downloaded `.dmg` file
2. Drag "Android Studio" to your Applications folder
3. Open Android Studio from Applications
4. Follow the setup wizard:
   - Choose "Standard" installation type
   - Accept the license agreements
   - Let it download the Android SDK components (this may take 10-20 minutes)

### 3. Install Android SDK Components
- Android Studio will automatically download:
  - Android SDK
  - Android SDK Platform
  - Android Virtual Device (AVD)

### 4. Create an Android Virtual Device (Emulator)
1. In Android Studio, click **Tools** → **Device Manager** (or click the Device Manager icon in the toolbar)
2. Click **Create Device**
3. Select a device definition:
   - **Recommended for screenshots:** Pixel 6 or Pixel 7 (most common for Play Store)
   - Or choose Pixel 5 if you want a smaller device
4. Click **Next**
5. Select a system image:
   - **Recommended:** Latest API Level (e.g., API 34 - Android 14)
   - Click **Download** if needed (this will take a few minutes)
   - Click **Next** after download completes
6. Verify configuration:
   - Name: Keep default or customize (e.g., "Pixel_6_API_34")
   - Click **Finish**

### 5. Start the Emulator
1. In Device Manager, click the **Play** button (▶️) next to your created device
2. Wait for the emulator to boot (first time may take 2-3 minutes)

## Running Your Expo App on the Emulator

### Option 1: Using Expo CLI (Recommended)
```bash
# Make sure your emulator is running first
npm start
# Then press 'a' to open on Android emulator
```

### Option 2: Using Expo Run
```bash
npx expo run:android
```

## Taking Screenshots for Google Play Store

### Google Play Store Screenshot Requirements:
- **Phone screenshots:** At least 2, up to 8 screenshots
- **Tablet screenshots (optional):** At least 2, up to 8 screenshots
- **Recommended sizes:**
  - Phone: 1080 x 1920 pixels (portrait) or 1920 x 1080 (landscape)
  - Tablet: 1200 x 1920 pixels (portrait) or 1920 x 1200 (landscape)

### Method 1: Using Android Studio's Built-in Screenshot Tool
1. With your app running on the emulator
2. In Android Studio, click the **Camera** icon in the emulator toolbar
3. Screenshot will be saved automatically
4. Location: Usually in `~/Pictures/` or check Android Studio's notification

### Method 2: Using Emulator Controls
1. Click the **...** (three dots) button on the emulator toolbar
2. Go to **Camera** tab
3. Click **Take Screenshot**
4. Save the screenshot

### Method 3: Using Command Line (Fastest)
```bash
# Take a screenshot (replace with your device name)
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png ~/Desktop/screenshot.png
```

Or use this one-liner:
```bash
adb exec-out screencap -p > ~/Desktop/screenshot.png
```

### Method 4: Using Keyboard Shortcut
- **macOS:** `Cmd + S` (while emulator is focused)
- Screenshot saves to: `~/Pictures/` or check Android Studio notification

## Recommended Screenshots to Take

For your DailyVibe app, capture these screens:

1. **Home Screen** - Shows habit list (with some sample habits)
2. **Add Habit Screen** - Shows the habit creation form
3. **Stats Screen** - Shows streak and statistics
4. **Settings Screen** - Shows app settings
5. **Habit Detail/Edit** - Shows habit editing interface
6. **Calendar View** (if available) - Shows calendar with habit tracking

## Tips for Great Screenshots

1. **Add Sample Data:** Make sure your app has some sample habits before taking screenshots
2. **Use Light Mode:** Google Play Store typically shows light mode screenshots better
3. **Clean UI:** Remove any debug indicators or development tools
4. **Consistent Device:** Use the same device (e.g., Pixel 6) for all screenshots
5. **High Resolution:** Ensure emulator is set to high DPI for crisp screenshots

## Quick Commands Reference

```bash
# Check if emulator is connected
adb devices

# List all available devices
adb devices -l

# Take screenshot (saves to Desktop)
adb exec-out screencap -p > ~/Desktop/screenshot-$(date +%Y%m%d-%H%M%S).png

# Start your Expo app on Android
npm start
# Then press 'a'

# Or directly run on Android
npx expo run:android
```

## Troubleshooting

### Emulator won't start
- Check if virtualization is enabled in your Mac's System Settings
- Try increasing emulator RAM: Device Manager → Edit → Show Advanced Settings → RAM: 4096 MB

### App won't install
- Make sure emulator is fully booted (wait for home screen)
- Try: `adb kill-server && adb start-server`

### Screenshots are low quality
- Increase emulator resolution in Device Manager → Edit → Resolution
- Use a device with higher DPI (e.g., Pixel 6 Pro instead of Pixel 6)

## Next Steps After Screenshots

1. Edit screenshots if needed (crop, adjust brightness)
2. Organize screenshots in a folder
3. Upload to Google Play Console when creating your app listing
4. Consider creating a feature graphic (1024 x 500 pixels) for the Play Store banner


