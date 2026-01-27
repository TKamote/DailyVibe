# Email Code Verification Implementation Guide (Context API Pattern)

Complete guide for implementing 6-digit email code verification for user authentication using React Context for state management.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Setup](#setup)
5. [Implementation](#implementation)
6. [Code Files](#code-files)
7. [Configuration](#configuration)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)
10. [Security Roadmap (Multi-App Strategy)](#security-roadmap-multi-app-strategy)

---

## Overview

This implementation replaces traditional email verification links with 6-digit codes that users enter in the app. It uses the **Context API** pattern to ensure authentication state is synchronized instantly across the entire app, preventing "split brain" issues where different screens have different ideas of the user's status.

### Why Context API?

- **Single Source of Truth:** All screens (`Login`, `Verification`, `Home`) read from the exact same state object.
- **Instant Updates:** When a user verifies their email, the root navigator knows immediately (0ms delay) and redirects them.
- **No Polling Required:** Eliminates the need for complex `setInterval` polling to check verification status.
- **Stable Navigation:** Prevents navigation stack resets that cause users to get stuck or lost during the signup flow.

### Flow Diagram

```
User Signs Up
    ↓
Generate 6-digit code & Store in Firestore
    ↓
Send code via email (Resend API)
    ↓
User enters code in app
    ↓
Verify code matches
    ↓
Mark email as verified in Firestore
    ↓
AuthContext updates global state to { isEmailVerified: true }
    ↓
RootNavigator automatically re-renders -> Access granted
```

---

## Architecture

### Components

1. **Verification Code System** (`lib/verificationCodes.ts`)
   - Generates 6-digit codes
   - Stores codes in Firestore with expiration
   - Verifies codes

2. **Email Service** (`lib/emailService.ts`)
   - Sends emails via Resend API
   - HTML email templates

3. **Rate Limiting** (`lib/rateLimiting.ts`)
   - Limits verification code requests (5 per 24 hours)

4. **Authentication Context** (`context/AuthContext.tsx`)
   - **The Brain:** Manages global auth state
   - Provides `signIn`, `signUp`, `verifyEmailWithCode` methods
   - Exposes `user`, `loading`, `isEmailVerified` values

5. **UI Components** (`screens/EmailVerificationScreen.tsx`)
   - Code input interface
   - Consumes `AuthContext`

### Data Flow

```
Firebase Auth + Firestore
    ↓
AuthContext (Global State)
    ↓
All Screens & Navigators
```

---

## Prerequisites

### Services Required

1. **Firebase**
   - Authentication enabled (Email/Password)
   - Firestore Database enabled
   - Security rules configured

2. **Resend**
   - Account at https://resend.com
   - API key
   - Domain verified (for production)

### Dependencies

```json
{
  "firebase": "^12.7.0",
  "@react-native-async-storage/async-storage": "^2.1.2"
}
```

---

## Setup

### Step 1: Firebase Setup

1. Enable Authentication (Email/Password)
2. Enable Firestore Database
3. Configure Security Rules (see below)

### Step 2: Resend Setup

1. Sign up at https://resend.com
2. Get API key from dashboard
3. (Optional) Verify domain for production

### Step 3: Firestore Security Rules

Add to Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own habits
    match /users/{userId}/habits/{habitId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can create/read/delete their own verification codes
    match /verificationCodes/{userId} {
      allow read, write, delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Implementation

### File Structure

```
lib/
  ├── verificationCodes.ts    # Code generation & verification
  ├── emailService.ts          # Email sending via Resend
  ├── rateLimiting.ts          # Rate limiting logic
  └── firestore.ts             # Firestore utilities

context/
  └── AuthContext.tsx          # Context Provider (The Brain)

hooks/
  └── useAuth.ts               # Helper to consume context

screens/
  └── EmailVerificationScreen.tsx  # Verification UI
```

---

## Code Files

### 1. `context/AuthContext.tsx` (The Core)

```typescript
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  reload,
  User
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { storeVerificationCode, verifyCode, deleteVerificationCodesForUser } from '../lib/verificationCodes';
import { sendVerificationCodeEmail } from '../lib/emailService';
import { checkVerificationCodeRateLimit, recordVerificationCodeRequest } from '../lib/rateLimiting';
import { markEmailAsVerifiedInFirestore, isEmailVerifiedInFirestore } from '../lib/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isEmailVerified: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string; message?: string; userCreated?: boolean }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  sendVerificationCode: (userId?: string, email?: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  verifyEmailWithCode: (code: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  checkEmailVerification: () => Promise<{ success: boolean; verified: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firestoreEmailVerified, setFirestoreEmailVerified] = useState<boolean>(false);

  // Initialize auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const verified = await isEmailVerifiedInFirestore(user.uid);
        setFirestoreEmailVerified(verified);
      } else {
        setFirestoreEmailVerified(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ... Implement signIn, signUp, etc. (same logic as previous hook, but updates Context state)

  const verifyEmailWithCode = async (code: string) => {
    // ... verification logic ...
    
    // CRITICAL: Update local state immediately upon success
    setFirestoreEmailVerified(true); 
    
    // ...
  };

  const value = {
    user,
    loading,
    isEmailVerified: (user?.emailVerified || false) || firestoreEmailVerified,
    signIn,
    signUp,
    logout,
    sendVerificationCode,
    verifyEmailWithCode,
    checkEmailVerification
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 2. `App.tsx` (Wrapping the App)

```typescript
import { AuthProvider } from './context/AuthContext';

// ... Navigators ...

function RootNavigator() {
  const { user, loading, isEmailVerified } = useAuth(); // Consumes Context

  if (loading) return <SplashScreen />;

  // Simple, stable logic
  const canAccessApp = user && isEmailVerified;

  return (
    <NavigationContainer>
       {canAccessApp ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider> {/* Wrap everything in Provider */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}
```

### 3. `lib/verificationCodes.ts`

```typescript
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

const VERIFICATION_CODES_COLLECTION = 'verificationCodes';
const CODE_EXPIRY_MINUTES = 10; 

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function storeVerificationCode(userId: string, email: string) {
  // ... (same as previous implementation)
}

export async function verifyCode(userId: string, code: string) {
  // ... (same as previous implementation)
}
```

### 4. `lib/emailService.ts`

```typescript
// Resend API key
// PRO TIP: For Android builds, hardcoding the key is often safer than .env to prevent "missing key" errors in production.
// WARNING: This key is visible in the compiled app. See "Security Roadmap" below.
const RESEND_API_KEY = 're_your_actual_api_key_here';
const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_EMAIL = 'YourApp <noreply@yourdomain.com>';

export async function sendVerificationCodeEmail(email: string, code: string) {
  // ... (sends HTML email via Resend)
}
```

---

## Configuration

### Step 1: Update Resend API Key

In `lib/emailService.ts`:
```typescript
const RESEND_API_KEY = 're_your_actual_api_key_here';
```

### Step 2: Update From Email

For production (verified domain):
```typescript
const FROM_EMAIL = 'YourApp <noreply@yourdomain.com>';
```

---

## Testing

### Test Flow

1. **Sign Up**
   - Create account with email
   - Should receive verification code email
   - Should navigate to verification screen

2. **Code Verification**
   - Enter 6-digit code from email
   - Should verify successfully
   - **Should IMMEDIATELY navigate to main app (no delay)**

3. **Resend Code**
   - Click "Resend Code"
   - Should receive new code

4. **Rate Limiting**
   - Request 5+ codes in 24 hours
   - Should show rate limit message

---

## Troubleshooting

### Email Not Sending (Silent Failure)
- **Check Permissions:** Ensure Android `app.json` has `["INTERNET"]` permission.
- **Check API Key:** Ensure the key is actually present in the built app (hardcode to verify).
- **Check Resend Logs:** If the app says success but email doesn't arrive, check the Resend Dashboard logs.

### Email Bouncing
- **New Domain Issue:** Brand new domains (`.fun`, etc.) have zero reputation. Corporate filters may block them initially.
- **Self-Sending:** Sending *from* `yourdomain.com` *to* `yourdomain.com` often bounces unless SPF is perfect.
- **DNS Propagation:** "Domain not found" errors mean you need to wait 24-48 hours for DNS to propagate.
- **Fix:** Test with a generic Gmail/Yahoo address first.

### Navigation Not Working
- **With Context API, this is rare.**
- Ensure `App.tsx` is wrapped in `<AuthProvider>`.
- Ensure `RootNavigator` uses `useAuth()` to check `isEmailVerified`.
- Verify that `verifyEmailWithCode` in `AuthContext` correctly calls `setFirestoreEmailVerified(true)`.

### "Stuck" on Verification Screen
- This usually means the global state didn't update.
- Check if `AuthContext` is correctly triggering a re-render.
- Verify that `markEmailAsVerifiedInFirestore` succeeded.

---

## Security Roadmap (Multi-App Strategy)

**Phase 1: Client-Side Implementation (App 1 & 2)**
For your first two apps, stick to the **Client-Side** implementation described in this guide (Resend API called directly from the app).
*   **Why:** Faster to build, simpler to debug, guaranteed to work with EAS builds.
*   **Approval:** Safe for Apple App Store and Google Play Console review.
*   **Risk:** Low (only spam risk, no data breach risk).

**Phase 2: Server-Side Upgrade (App 3+)**
Once you have successfully launched App 1 & 2 and are ready for App 3, upgrade to **Server-Side** implementation for maximum security.

1.  **Architecture Change:**
    *   **Old:** App -> Resend API
    *   **New:** App -> Firebase Cloud Function -> Resend API
2.  **Implementation:**
    *   Create a Firebase Cloud Function: `sendVerificationEmail(email, code)`.
    *   Move `RESEND_API_KEY` to Firebase Environment Variables (hidden from everyone).
    *   Update `emailService.ts` to call your function instead of `api.resend.com`.

This phased approach ensures you ship your current apps fast while planning for enterprise-grade security in the future.

---

## License

This implementation guide is provided as-is. Adapt as needed for your project.
