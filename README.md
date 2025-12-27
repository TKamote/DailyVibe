# DailyVibe - AI-Powered Habit Tracker

**Simple, Smart, Social**

A minimalist habit tracking app with AI personalization, built with Expo/React Native.

## 🎯 Vision

Create the simplest, most intelligent habit tracker that helps people build better habits through AI-powered insights and optional social accountability.

## 📋 Project Status

- [x] Planning & Strategy
- [x] Project Setup
- [x] MVP Development (Phase 1 Complete!)
- [x] Firebase Authentication
- [x] Firestore Multi-Device Sync
- [x] iOS & Android Builds
- [ ] Reminders & Notifications
- [ ] AI Integration (Phase 2)
- [ ] Social Features (Phase 3)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## 📁 Project Structure

```
DailyVibe/
├── App.tsx                 # Main app component
├── components/             # Reusable UI components
│   ├── HabitCard.tsx
│   ├── StreakDisplay.tsx
│   └── CalendarView.tsx
├── screens/                # App screens
│   ├── LoginScreen.tsx
│   ├── HomeScreen.tsx
│   ├── AddHabitScreen.tsx
│   ├── EditHabitScreen.tsx
│   ├── StatsScreen.tsx
│   ├── GuideScreen.tsx
│   ├── SettingsScreen.tsx
│   ├── PrivacyPolicyScreen.tsx
│   └── SplashScreen.tsx
├── hooks/                  # Custom React hooks
│   ├── useHabits.ts
│   └── useAuth.ts
├── lib/                    # Utilities & services
│   ├── firebase.ts         # Firebase configuration
│   ├── firestore.ts        # Firestore operations
│   ├── storage.ts          # Local storage (migration)
│   ├── utils.ts
│   ├── theme.tsx
│   └── privacyPolicy.ts
├── types/                  # TypeScript types
└── docs/                   # Documentation
    ├── SETUP.md
    ├── PRIVACY_POLICY.md
    └── RESEARCH.md
```

## 🛠️ Tech Stack

- **Frontend**: Expo/React Native (SDK 53)
- **Navigation**: React Navigation v6
- **Backend**: Firebase (Auth, Firestore)
- **Storage**: Firestore (cloud sync) + AsyncStorage (local cache)
- **Styling**: React Native StyleSheet
- **State Management**: React Hooks
- **Build**: EAS Build
- **Future**: Google Gemini API, RevenueCat

## ✨ Features (Current)

- ✅ User Authentication (Email/Password)
- ✅ Add, Edit, Delete habits
- ✅ Daily habit check-off
- ✅ Streak tracking (current & longest)
- ✅ Calendar view (30-day history)
- ✅ Statistics & analytics
- ✅ Dark/Light mode (default: dark)
- ✅ Swipe-to-delete gestures
- ✅ Multi-device sync (Firestore)
- ✅ Offline support
- ✅ Placeholder habit for new users
- ✅ User guide & privacy policy

## 📖 Documentation

- [Setup Guide](./docs/SETUP.md) - Firebase Authentication & Firestore setup
- [Privacy Policy](./docs/PRIVACY_POLICY.md) - Privacy policy and data handling
- [Feature Research](./docs/RESEARCH.md) - Feature research & AI opportunities

## 🏗️ Building

```bash
# Start development server
npx expo start --dev-client

# Build for iOS (production)
npx eas build --profile production --platform ios

# Build for Android (production)
npx eas build --profile production --platform android
```

---

**Built with ❤️ for people who want to build better habits, simply.**

