# DailyVibe Setup Guide

Complete guide for setting up Firebase Authentication and Firestore for DailyVibe.

## Prerequisites

- Firebase account (free tier is sufficient)
- Expo development environment set up
- Node.js and npm installed

---

## Part 1: Firebase Authentication Setup

### Step 1: Install Dependencies

Dependencies should already be installed, but if needed:

```bash
npm install firebase @react-navigation/bottom-tabs --legacy-peer-deps
```

### Step 2: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name (e.g., "DailyVibe")
4. Follow the setup wizard
5. Complete the project creation

### Step 3: Get Firebase Config

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **"Your apps"** section
3. If you don't have a web app yet:
   - Click **"Add app"** → Select **Web icon** (</>)
   - Register app: Give it a nickname (e.g., "DailyVibe Web")
   - Click **"Register app"**
4. Copy the Firebase config values:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### Step 4: Update Firebase Config

Open `lib/firebase.ts` and replace the config values with your actual Firebase config.

### Step 5: Enable Email/Password Authentication

1. In Firebase Console → **Authentication**
2. Click **"Get started"** (if first time)
3. Click on **"Sign-in method"** tab
4. Click on **"Email/Password"**
5. Toggle **"Enable"** to ON
6. Click **"Save"**

### Step 6: Test Authentication

1. Run `npx expo start --dev-client`
2. App should show Login screen
3. Create an account with email/password
4. Should navigate to main app with bottom tabs

---

## Part 2: Firestore Database Setup (Multi-Device Sync)

### Step 1: Enable Firestore in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **"Firestore Database"** in the left menu
4. Click **"Create database"**
5. Choose **"Start in test mode"** (for development)
6. Select a location (choose closest to your users)
7. Click **"Enable"**

### Step 2: Set Up Security Rules (Important!)

After creating the database, go to **"Rules"** tab and update with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own habits
    match /users/{userId}/habits/{habitId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click **"Publish"** to save the rules.

### Step 3: Test Multi-Device Sync

1. **Rebuild the app** (Firestore is a native dependency):
   ```bash
   npx expo run:ios --device
   ```

2. **Login on multiple devices** with the same account

3. **Add a habit on one device** → It should appear on other devices automatically!

---

## How It Works

### Authentication
- Firebase Auth automatically persists login state
- Users stay logged in even after app restart
- Login screen shows first, then auto-navigates if already logged in

### Firestore Data Structure
```
users/
  └── {userId}/
      └── habits/
          ├── {habitId1}/
          │   ├── name: "Exercise"
          │   ├── color: "#3B82F6"
          │   ├── completedDates: ["2025-12-25", ...]
          │   ├── currentStreak: 5
          │   └── longestStreak: 10
          └── {habitId2}/
              └── ...
```

### Real-Time Sync Features
- ✅ Real-time sync across all devices
- ✅ Offline support (works without internet, syncs when back online)
- ✅ User-specific data (each user has their own habits)
- ✅ Automatic migration from local storage to Firestore

### Migration
If you had habits stored locally before:
- They will automatically migrate to Firestore on first login
- Local storage will be cleared after successful migration
- No data loss!

---

## Troubleshooting

### Authentication not working?
- Check that Email/Password is enabled in Firebase Console
- Verify your Firebase config values are correct in `lib/firebase.ts`
- Clear app cache and restart

### Firestore sync not working?
- Ensure Firestore is enabled in Firebase Console
- Check that security rules are published
- Verify you're logged in with the same account on all devices
- Rebuild the app after enabling Firestore

### Data not syncing?
- Check your internet connection
- Verify Firebase project is active
- Check Firebase Console for any errors

---

**That's it!** Once both Authentication and Firestore are set up, your app will have:
- ✅ User authentication
- ✅ Multi-device sync
- ✅ Offline support
- ✅ Secure, user-specific data storage

