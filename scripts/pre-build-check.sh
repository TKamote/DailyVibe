#!/bin/bash

# Pre-build validation script
# Run this before building with EAS to catch issues early

echo "🔍 Pre-build validation starting..."
echo ""

ERRORS=0
WARNINGS=0

# Check if app.json exists
if [ ! -f "app.json" ]; then
    echo "❌ ERROR: app.json not found"
    ERRORS=$((ERRORS + 1))
    exit 1
fi

# Check bundle identifier format (iOS)
IOS_BUNDLE_ID=$(grep -A 3 '"ios"' app.json | grep 'bundleIdentifier' | sed 's/.*"bundleIdentifier": "\(.*\)".*/\1/')
if [ -z "$IOS_BUNDLE_ID" ]; then
    echo "❌ ERROR: iOS bundleIdentifier not found in app.json"
    ERRORS=$((ERRORS + 1))
else
    # Check if bundle ID follows reverse domain notation
    if [[ ! $IOS_BUNDLE_ID =~ ^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$ ]]; then
        echo "⚠️  WARNING: iOS bundleIdentifier format may be invalid: $IOS_BUNDLE_ID"
        echo "   Should follow reverse domain notation (e.g., com.yourname.appname)"
        WARNINGS=$((WARNINGS + 1))
    else
        echo "✅ iOS bundleIdentifier: $IOS_BUNDLE_ID"
    fi
fi

# Check Android package name
ANDROID_PACKAGE=$(grep -A 3 '"android"' app.json | grep 'package' | sed 's/.*"package": "\(.*\)".*/\1/')
if [ -z "$ANDROID_PACKAGE" ]; then
    echo "❌ ERROR: Android package not found in app.json"
    ERRORS=$((ERRORS + 1))
else
    if [[ ! $ANDROID_PACKAGE =~ ^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$ ]]; then
        echo "⚠️  WARNING: Android package format may be invalid: $ANDROID_PACKAGE"
        WARNINGS=$((WARNINGS + 1))
    else
        echo "✅ Android package: $ANDROID_PACKAGE"
    fi
fi

# Check if bundle IDs match
if [ "$IOS_BUNDLE_ID" != "$ANDROID_PACKAGE" ]; then
    echo "⚠️  WARNING: iOS and Android identifiers don't match"
    echo "   iOS: $IOS_BUNDLE_ID"
    echo "   Android: $ANDROID_PACKAGE"
    WARNINGS=$((WARNINGS + 1))
fi

# Check version
VERSION=$(grep '"version"' app.json | sed 's/.*"version": "\(.*\)".*/\1/')
if [ -z "$VERSION" ]; then
    echo "❌ ERROR: Version not found in app.json"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Version: $VERSION"
fi

# Check if eas.json exists
if [ ! -f "eas.json" ]; then
    echo "⚠️  WARNING: eas.json not found. Run 'npx eas build:configure' first"
    WARNINGS=$((WARNINGS + 1))
else
    echo "✅ eas.json found"
fi

# Check if EAS is logged in
if ! npx eas whoami &> /dev/null; then
    echo "❌ ERROR: Not logged into EAS. Run 'npx eas login' first"
    ERRORS=$((ERRORS + 1))
else
    EAS_USER=$(npx eas whoami)
    echo "✅ EAS logged in as: $EAS_USER"
fi

# Check if project is initialized
PROJECT_ID=$(grep -A 2 '"eas"' app.json | grep 'projectId' | sed 's/.*"projectId": "\(.*\)".*/\1/')
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" == "" ]; then
    echo "⚠️  WARNING: EAS project not initialized. Run 'npx eas init' first"
    WARNINGS=$((WARNINGS + 1))
else
    echo "✅ EAS project ID: $PROJECT_ID"
fi

# Check for common issues
echo ""
echo "📋 Additional checks:"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "⚠️  WARNING: node_modules not found. Run 'npm install' first"
    WARNINGS=$((WARNINGS + 1))
fi

# Check package.json
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json not found"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -gt 0 ]; then
    echo "❌ Validation failed with $ERRORS error(s) and $WARNINGS warning(s)"
    echo "   Please fix the errors before building"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo "⚠️  Validation passed with $WARNINGS warning(s)"
    echo "   You can proceed, but consider fixing warnings"
    exit 0
else
    echo "✅ All checks passed! Ready to build."
    exit 0
fi

