# DailyVibe - AI-Powered Habit Tracker

**Simple, Smart, Social**

A minimalist habit tracking app with AI personalization, built with Expo/React Native.

## 🎯 Vision

Create the simplest, most intelligent habit tracker that helps people build better habits through AI-powered insights and optional social accountability.

## 📋 Project Status

- [x] Planning & Strategy
- [x] Project Setup
- [x] MVP Development (Phase 1 Complete!)
- [ ] Reminders & Notifications
- [ ] AI Integration (Phase 2)
- [ ] Social Features (Phase 3)
- [x] iOS Build Complete
- [ ] App Store Submission

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
│   ├── HomeScreen.tsx
│   ├── AddHabitScreen.tsx
│   ├── EditHabitScreen.tsx
│   ├── StatsScreen.tsx
│   └── SettingsScreen.tsx
├── hooks/                  # Custom React hooks
│   └── useHabits.ts
├── lib/                    # Utilities & services
│   ├── storage.ts
│   ├── utils.ts
│   └── theme.tsx
├── types/                  # TypeScript types
└── scripts/                # Build scripts
    └── pre-build-check.sh
```

## 🛠️ Tech Stack

- **Frontend**: Expo/React Native (SDK 51)
- **Navigation**: React Navigation v6
- **Storage**: AsyncStorage (local-first)
- **Styling**: React Native StyleSheet
- **State Management**: React Hooks
- **Build**: EAS Build
- **Future**: Firebase, Google Gemini API, RevenueCat

## ✨ Features (MVP)

- ✅ Add, Edit, Delete habits
- ✅ Daily habit check-off
- ✅ Streak tracking (current & longest)
- ✅ Calendar view (30-day history)
- ✅ Statistics & analytics
- ✅ Dark/Light mode
- ✅ Swipe-to-delete gestures
- ✅ Local data persistence

## 📖 Documentation

- [HABIT_TRACKER_PLAN.md](./HABIT_TRACKER_PLAN.md) - Complete implementation plan
- [HABIT_TRACKER_RESEARCH.md](./HABIT_TRACKER_RESEARCH.md) - Feature research & AI opportunities

## 🏗️ Building

```bash
# Pre-build validation
npm run pre-build

# Build for iOS
npm run build:ios

# Build for Android
npm run build:android

# Build for both
npm run build:all
```

---

**Built with ❤️ for people who want to build better habits, simply.**

