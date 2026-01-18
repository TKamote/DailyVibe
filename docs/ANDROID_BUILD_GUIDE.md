Android Build Guide - Without EAS Credits

This guide shows you how to build Android APKs manually without using EAS build credits, so you can test and submit to Google Play Console directly.

================================================================================
OPTION 1: Local Android Build (Recommended for Testing)
================================================================================

Build APK locally without using EAS credits:

1. Make sure you have Android Studio and Android SDK installed

2. Increment version numbers first:
   ```bash
   npm run increment-version
   ```

3. Build locally:
   ```bash
   npx expo run:android --variant release
   ```
   
   Or build APK directly:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   
   APK will be in: `android/app/build/outputs/apk/release/app-release.apk`

4. Install on device:
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

================================================================================
OPTION 2: EAS Build for Development (Uses Credits but Good for Testing)
================================================================================

If you want to use EAS but save credits:

1. Increment version:
   ```bash
   npm run increment-version
   ```

2. Build development version:
   ```bash
   npm run build:android:dev
   ```
   
   This uses the "development" profile which might use fewer credits.

================================================================================
OPTION 3: Manual Submission to Google Play (No EAS Credits)
================================================================================

1. Build APK locally (Option 1)

2. Go to Google Play Console → Your App → Production/Testing → Create Release

3. Upload the APK/AAB file

4. Fill in release notes and submit

No EAS credits needed!

================================================================================
VERSION INCREMENT SCRIPT
================================================================================

The script automatically increments:
- app.json → version (patch version: 1.0.6 → 1.0.7)
- app.json → ios.buildNumber (4 → 5)
- app.json → android.versionCode (10 → 11)
- package.json → version (1.0.6 → 1.0.7)

Run manually:
```bash
npm run increment-version
```

Or it runs automatically before builds:
```bash
npm run build:android
npm run build:ios
```

================================================================================
CURRENT VERSION NUMBERS
================================================================================

Check your current versions:
- Version: 1.0.6
- iOS buildNumber: 4
- Android versionCode: 10

After running increment-version:
- Version: 1.0.7
- iOS buildNumber: 5
- Android versionCode: 11

================================================================================
TIPS
================================================================================

1. Always run increment-version before building
2. Check versions are synced before submitting
3. For Android testing, use local builds to save EAS credits
4. Only use EAS for production builds you're submitting to stores
5. Keep version numbers in sync across all files

================================================================================
TROUBLESHOOTING
================================================================================

Issue: "Version already exists in Play Console"
Solution: Increment versionCode in app.json → android.versionCode

Issue: "Build number conflict"
Solution: Increment buildNumber in app.json → ios.buildNumber

Issue: Script doesn't increment
Solution: Make sure script is executable: `chmod +x scripts/increment-version.sh`

