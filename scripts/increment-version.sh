#!/bin/bash

# Version increment script - Updates ALL version numbers everywhere
# This ensures iOS native files, Android native files, and app.json stay in sync

echo "📦 Incrementing version numbers in ALL files..."
echo ""

# Read current version from app.json
CURRENT_VERSION=$(grep '"version"' app.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
CURRENT_IOS_BUILD=$(grep -A 3 '"ios"' app.json | grep 'buildNumber' | sed 's/.*"buildNumber": "\(.*\)".*/\1/')
# Extract versionCode - handle both with and without trailing comma
CURRENT_ANDROID_VERSION=$(grep -A 5 '"android"' app.json | grep 'versionCode' | sed 's/.*"versionCode": *\([0-9]*\).*/\1/' | tr -d ',' | tr -d ' ')

echo "Current versions:"
echo "  Version: $CURRENT_VERSION"
echo "  iOS buildNumber: $CURRENT_IOS_BUILD"
echo "  Android versionCode: $CURRENT_ANDROID_VERSION"
echo ""

# Increment version (patch version)
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}
NEW_PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"

# Increment iOS buildNumber
NEW_IOS_BUILD=$((CURRENT_IOS_BUILD + 1))

# Increment Android versionCode
NEW_ANDROID_VERSION=$((CURRENT_ANDROID_VERSION + 1))

echo "New versions:"
echo "  Version: $NEW_VERSION"
echo "  iOS buildNumber: $NEW_IOS_BUILD"
echo "  Android versionCode: $NEW_ANDROID_VERSION"
echo ""

# Determine sed command based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    SED_CMD="sed -i ''"
else
    SED_CMD="sed -i"
fi

# ============================================================================
# 1. Update app.json
# ============================================================================
echo "📝 Updating app.json..."
$SED_CMD "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" app.json
$SED_CMD "s/\"buildNumber\": \"$CURRENT_IOS_BUILD\"/\"buildNumber\": \"$NEW_IOS_BUILD\"/" app.json
# Handle versionCode - match with or without trailing comma/whitespace
$SED_CMD "s/\"versionCode\": *$CURRENT_ANDROID_VERSION\(,\|$\)/\"versionCode\": $NEW_ANDROID_VERSION,/" app.json

# ============================================================================
# 2. Update package.json
# ============================================================================
echo "📝 Updating package.json..."
CURRENT_PACKAGE_VERSION=$(grep '"version"' package.json | sed 's/.*"version": "\(.*\)".*/\1/')
$SED_CMD "s/\"version\": \"$CURRENT_PACKAGE_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json

# ============================================================================
# 3. Update iOS Info.plist (CFBundleShortVersionString and CFBundleVersion)
# ============================================================================
if [ -f "ios/DailyVibe/Info.plist" ]; then
    echo "📝 Updating iOS Info.plist..."
    # Update CFBundleShortVersionString (version)
    $SED_CMD "/<key>CFBundleShortVersionString<\/key>/,/<string>/s/<string>$CURRENT_VERSION<\/string>/<string>$NEW_VERSION<\/string>/" ios/DailyVibe/Info.plist
    # Update CFBundleVersion (build number)
    $SED_CMD "/<key>CFBundleVersion<\/key>/,/<string>/s/<string>$CURRENT_IOS_BUILD<\/string>/<string>$NEW_IOS_BUILD<\/string>/" ios/DailyVibe/Info.plist
fi

# ============================================================================
# 4. Update iOS Xcode project.pbxproj (CURRENT_PROJECT_VERSION and MARKETING_VERSION)
# ============================================================================
if [ -f "ios/DailyVibe.xcodeproj/project.pbxproj" ]; then
    echo "📝 Updating iOS Xcode project.pbxproj..."
    # Update CURRENT_PROJECT_VERSION (appears multiple times for Debug/Release)
    $SED_CMD "s/CURRENT_PROJECT_VERSION = $CURRENT_IOS_BUILD;/CURRENT_PROJECT_VERSION = $NEW_IOS_BUILD;/g" ios/DailyVibe.xcodeproj/project.pbxproj
    # Update MARKETING_VERSION (appears multiple times for Debug/Release)
    $SED_CMD "s/MARKETING_VERSION = $CURRENT_VERSION;/MARKETING_VERSION = $NEW_VERSION;/g" ios/DailyVibe.xcodeproj/project.pbxproj
fi

# ============================================================================
# 5. Update Android build.gradle (if it exists)
# ============================================================================
if [ -f "android/app/build.gradle" ]; then
    echo "📝 Updating Android build.gradle..."
    # Update versionCode
    $SED_CMD "s/versionCode $CURRENT_ANDROID_VERSION/versionCode $NEW_ANDROID_VERSION/" android/app/build.gradle
    # Update versionName
    $SED_CMD "s/versionName \"$CURRENT_VERSION\"/versionName \"$NEW_VERSION\"/" android/app/build.gradle
fi

echo ""
echo "✅ Version numbers updated successfully in ALL files!"
echo ""
echo "Updated files:"
echo "  ✅ app.json (version, ios.buildNumber, android.versionCode)"
echo "  ✅ package.json (version)"
if [ -f "ios/DailyVibe/Info.plist" ]; then
    echo "  ✅ ios/DailyVibe/Info.plist (CFBundleShortVersionString, CFBundleVersion)"
fi
if [ -f "ios/DailyVibe.xcodeproj/project.pbxproj" ]; then
    echo "  ✅ ios/DailyVibe.xcodeproj/project.pbxproj (CURRENT_PROJECT_VERSION, MARKETING_VERSION)"
fi
if [ -f "android/app/build.gradle" ]; then
    echo "  ✅ android/app/build.gradle (versionCode, versionName)"
fi
echo ""
