#!/bin/bash

# Script to take Android emulator screenshots for Google Play Store
# Usage: ./scripts/take-screenshot.sh [screenshot-name]

# Create screenshots directory if it doesn't exist
SCREENSHOT_DIR="$HOME/Desktop/DailyVibe-Screenshots"
mkdir -p "$SCREENSHOT_DIR"

# Generate filename with timestamp
if [ -z "$1" ]; then
    FILENAME="screenshot-$(date +%Y%m%d-%H%M%S).png"
else
    FILENAME="$1.png"
fi

FULL_PATH="$SCREENSHOT_DIR/$FILENAME"

# Check if adb is available
if ! command -v adb &> /dev/null; then
    echo "❌ Error: adb not found. Make sure Android Studio is installed and Android SDK platform-tools are in your PATH."
    echo ""
    echo "To fix this, add Android SDK platform-tools to your PATH:"
    echo "Add this to your ~/.zshrc file:"
    echo 'export PATH="$HOME/Library/Android/sdk/platform-tools:$PATH"'
    echo ""
    echo "Then run: source ~/.zshrc"
    exit 1
fi

# Check if device is connected
DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l | tr -d ' ')

if [ "$DEVICES" -eq 0 ]; then
    echo "❌ Error: No Android device/emulator found."
    echo ""
    echo "Please:"
    echo "1. Start your Android emulator from Android Studio"
    echo "2. Wait for it to fully boot"
    echo "3. Run this script again"
    exit 1
fi

echo "📸 Taking screenshot..."
adb exec-out screencap -p > "$FULL_PATH"

if [ $? -eq 0 ]; then
    echo "✅ Screenshot saved to: $FULL_PATH"
    echo ""
    echo "📁 Screenshot directory: $SCREENSHOT_DIR"
    
    # Try to open the screenshot (macOS)
    if command -v open &> /dev/null; then
        open "$SCREENSHOT_DIR"
    fi
else
    echo "❌ Failed to take screenshot"
    exit 1
fi


