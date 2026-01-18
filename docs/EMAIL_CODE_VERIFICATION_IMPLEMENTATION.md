# Email Code Verification Implementation Guide

Complete guide for implementing 6-digit email code verification for user authentication.

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

---

## Overview

This implementation replaces traditional email verification links with 6-digit codes that users enter in the app. This approach:

- ✅ Works across all devices (user can check email on any device)
- ✅ More intuitive than clicking links
- ✅ Better UX for mobile apps
- ✅ No deep linking required

### Flow Diagram

```
User Signs Up
    ↓
Generate 6-digit code
    ↓
Store code in Firestore (10 min expiry)
    ↓
Send code via email (Resend API)
    ↓
User receives email with code
    ↓
User enters code in app
    ↓
Verify code matches
    ↓
Mark email as verified in Firestore
    ↓
User logged in → Access granted
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

4. **Authentication Hook** (`hooks/useAuth.ts`)
   - Manages sign up, sign in, verification
   - Tracks verification status

5. **UI Components** (`screens/EmailVerificationScreen.tsx`)
   - Code input interface
   - Verification flow

### Data Flow

```
Firebase Auth (User Account)
    ↓
Firestore (Verification Codes + Status)
    ↓
Resend API (Email Delivery)
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

hooks/
  └── useAuth.ts               # Authentication hook

screens/
  └── EmailVerificationScreen.tsx  # Verification UI
```

---

## Code Files

### 1. `lib/verificationCodes.ts`

```typescript
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

const VERIFICATION_CODES_COLLECTION = 'verificationCodes';
const CODE_EXPIRY_MINUTES = 10; // Code expires after 10 minutes

/**
 * Generate a random 6-digit verification code
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store a verification code in Firestore
 */
export async function storeVerificationCode(
  userId: string,
  email: string
): Promise<{ code: string; expiresAt: Date }> {
  try {
    // Delete any existing codes for this user
    await deleteVerificationCodesForUser(userId);

    // Generate new code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

    // Store in Firestore
    const codeRef = doc(db, VERIFICATION_CODES_COLLECTION, userId);
    await setDoc(codeRef, {
      userId,
      email,
      code,
      expiresAt: Timestamp.fromDate(expiresAt),
      createdAt: Timestamp.now(),
    });

    return { code, expiresAt };
  } catch (error) {
    console.error('Error storing verification code:', error);
    throw error;
  }
}

/**
 * Verify a code for a user
 */
export async function verifyCode(
  userId: string,
  code: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const codeRef = doc(db, VERIFICATION_CODES_COLLECTION, userId);
    const codeDoc = await getDoc(codeRef);

    if (!codeDoc.exists()) {
      return { valid: false, error: 'Verification code not found. Please request a new code.' };
    }

    const data = codeDoc.data();
    const expiresAt = data.expiresAt.toDate();
    const now = new Date();

    // Check if code is expired
    if (now > expiresAt) {
      await deleteDoc(codeRef);
      return { valid: false, error: 'Verification code has expired. Please request a new code.' };
    }

    // Check if code matches
    if (data.code !== code) {
      return { valid: false, error: 'Invalid verification code. Please try again.' };
    }

    // Code is valid - delete it (one-time use)
    await deleteDoc(codeRef);

    return { valid: true };
  } catch (error) {
    console.error('Error verifying code:', error);
    return { valid: false, error: 'Error verifying code. Please try again.' };
  }
}

/**
 * Delete all verification codes for a user
 */
export async function deleteVerificationCodesForUser(userId: string): Promise<void> {
  try {
    const codeRef = doc(db, VERIFICATION_CODES_COLLECTION, userId);
    await deleteDoc(codeRef);
  } catch (error) {
    // Ignore errors if document doesn't exist
    console.error('Error deleting verification codes:', error);
  }
}

/**
 * Clean up expired codes (can be called periodically)
 */
export async function cleanupExpiredCodes(): Promise<void> {
  try {
    const codesRef = collection(db, VERIFICATION_CODES_COLLECTION);
    const snapshot = await getDocs(codesRef);
    const now = Timestamp.now();

    const deletePromises = snapshot.docs
      .filter((doc) => {
        const data = doc.data();
        return data.expiresAt < now;
      })
      .map((doc) => deleteDoc(doc.ref));

    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error cleaning up expired codes:', error);
  }
}
```

### 2. `lib/emailService.ts`

```typescript
/**
 * Email service for sending verification codes
 * Uses Resend API (https://resend.com)
 * 
 * Setup:
 * 1. Sign up at https://resend.com (free tier: 3,000 emails/month)
 * 2. Get your API key from dashboard
 * 3. Update RESEND_API_KEY and FROM_EMAIL below
 * 
 * Note: For production, consider using Firebase Cloud Functions to keep API key secure
 */

// Resend API key
const RESEND_API_KEY = 'YOUR_RESEND_API_KEY_HERE';
const RESEND_API_URL = 'https://api.resend.com/emails';
// Use Resend's default domain for testing, or replace with your verified domain
const FROM_EMAIL = 'YourApp <onboarding@resend.dev>';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email using Resend API
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    if (!RESEND_API_KEY || RESEND_API_KEY.trim() === '') {
      console.warn('Resend API key not configured. Email sending disabled.');
      return { success: false, error: 'Email service not configured' };
    }

    console.log('Sending email via Resend API to:', options.to);
    console.log('From email:', FROM_EMAIL);

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    const responseData = await response.json().catch(() => ({}));
    console.log('Resend API response status:', response.status);
    console.log('Resend API response data:', responseData);

    if (!response.ok) {
      console.error('Resend API error:', responseData);
      return { success: false, error: responseData.message || 'Failed to send email' };
    }

    console.log('Email sent successfully!');
    return { success: true };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

/**
 * Send verification code email
 */
export async function sendVerificationCodeEmail(
  email: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const subject = 'Verify your account';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #6366f1; margin: 0;">YourApp</h1>
      </div>
      
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
        <h2 style="color: #111827; margin-top: 0;">Verify your email address</h2>
        <p style="color: #6b7280; margin-bottom: 20px;">
          Please enter the following verification code in the app to verify your email address:
        </p>
        
        <div style="background-color: #ffffff; border: 2px solid #6366f1; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6366f1; font-family: 'Courier New', monospace;">
            ${code}
          </div>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px; margin-bottom: 0;">
          This code will expire in 10 minutes.
        </p>
      </div>
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
        If you didn't create an account, you can safely ignore this email.
      </p>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}
```

### 3. `lib/rateLimiting.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const VERIFICATION_CODE_STORAGE_KEY = '@yourapp:verification_code_requests';
const MAX_VERIFICATION_CODES_PER_24_HOURS = 5;
const HOURS_24_IN_MS = 24 * 60 * 60 * 1000;

interface Request {
  timestamp: number;
  email: string;
}

/**
 * Check if user can request verification code (rate limiting: 5 per 24 hours)
 */
export async function checkVerificationCodeRateLimit(
  email: string
): Promise<{ canRequest: boolean; timeUntilNextReset: number | null; message: string | null }> {
  try {
    const stored = await AsyncStorage.getItem(VERIFICATION_CODE_STORAGE_KEY);
    const requests: Request[] = stored ? JSON.parse(stored) : [];

    // Filter requests for this email in the last 24 hours
    const now = Date.now();
    const recentRequests = requests.filter(
      (req) => req.email.toLowerCase() === email.toLowerCase() && now - req.timestamp < HOURS_24_IN_MS
    );

    // Check if limit reached
    if (recentRequests.length >= MAX_VERIFICATION_CODES_PER_24_HOURS) {
      // Find the oldest request in the 24-hour window
      const oldestRequest = recentRequests.reduce((oldest, req) =>
        req.timestamp < oldest.timestamp ? req : oldest
      );
      const timeUntilNextReset = HOURS_24_IN_MS - (now - oldestRequest.timestamp);
      const hoursUntilReset = Math.ceil(timeUntilNextReset / (60 * 60 * 1000));

      return {
        canRequest: false,
        timeUntilNextReset,
        message: `You've reached the limit of ${MAX_VERIFICATION_CODES_PER_24_HOURS} verification code requests per 24 hours. Please wait ${hoursUntilReset} hour${hoursUntilReset > 1 ? 's' : ''} before requesting another.`,
      };
    }

    return {
      canRequest: true,
      timeUntilNextReset: null,
      message: null,
    };
  } catch (error) {
    console.error('Error checking verification code rate limit:', error);
    // On error, allow the request (fail open)
    return {
      canRequest: true,
      timeUntilNextReset: null,
      message: null,
    };
  }
}

/**
 * Record a verification code request
 */
export async function recordVerificationCodeRequest(email: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(VERIFICATION_CODE_STORAGE_KEY);
    const requests: Request[] = stored ? JSON.parse(stored) : [];

    // Add new request
    requests.push({
      timestamp: Date.now(),
      email: email.toLowerCase(),
    });

    // Clean up old requests (older than 24 hours)
    const now = Date.now();
    const recentRequests = requests.filter((req) => now - req.timestamp < HOURS_24_IN_MS);

    // Save updated requests
    await AsyncStorage.setItem(VERIFICATION_CODE_STORAGE_KEY, JSON.stringify(recentRequests));
  } catch (error) {
    console.error('Error recording verification code request:', error);
    // Fail silently - rate limiting is not critical
  }
}
```

### 4. `lib/firestore.ts` (Add these functions)

```typescript
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Mark user's email as verified in Firestore (used for code-based verification)
 */
export async function markEmailAsVerifiedInFirestore(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      emailVerified: true,
      emailVerifiedAt: Timestamp.now(),
    }, { merge: true });
  } catch (error) {
    console.error('Error marking email as verified in Firestore:', error);
    throw error;
  }
}

/**
 * Check if user's email is verified in Firestore
 */
export async function isEmailVerifiedInFirestore(userId: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return false;
    }
    const data = userDoc.data();
    return data.emailVerified === true;
  } catch (error) {
    console.error('Error checking email verification in Firestore:', error);
    return false;
  }
}
```

### 5. `hooks/useAuth.ts` (Key functions)

```typescript
import { useState, useEffect } from 'react';
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

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firestoreEmailVerified, setFirestoreEmailVerified] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      // Check Firestore verification status when user changes
      if (user) {
        const verified = await isEmailVerifiedInFirestore(user.uid);
        setFirestoreEmailVerified(verified);
      } else {
        setFirestoreEmailVerified(false);
      }
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Automatically send verification code after sign up
      if (userCredential.user) {
        const codeResult = await sendVerificationCode(userCredential.user.uid, email);
        if (!codeResult.success) {
          console.error('Failed to send verification code:', codeResult.error);
        }
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Check if email is verified (Firebase Auth or Firestore)
      if (userCredential.user) {
        const firebaseVerified = userCredential.user.emailVerified;
        const firestoreVerified = await isEmailVerifiedInFirestore(userCredential.user.uid);
        
        if (!firebaseVerified && !firestoreVerified) {
          return { 
            success: false, 
            error: 'EMAIL_NOT_VERIFIED',
            message: 'Please verify your email address to use the app. Check your inbox for the verification code.'
          };
        }
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const sendVerificationCode = async (userId?: string, email?: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, error: 'No user signed in' };
      }

      const targetUserId = userId || currentUser.uid;
      const targetEmail = email || currentUser.email;

      if (!targetEmail) {
        return { success: false, error: 'No email address found' };
      }

      // Check rate limit
      const rateLimitCheck = await checkVerificationCodeRateLimit(targetEmail);
      if (!rateLimitCheck.canRequest) {
        return {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: rateLimitCheck.message || 'Too many verification code requests. Please wait before trying again.',
        };
      }

      // Generate and store code
      const { code } = await storeVerificationCode(targetUserId, targetEmail);

      // Send email with code
      const emailResult = await sendVerificationCodeEmail(targetEmail, code);
      if (!emailResult.success) {
        // Clean up code if email failed
        await deleteVerificationCodesForUser(targetUserId);
        return { success: false, error: emailResult.error || 'Failed to send verification code' };
      }

      // Record the request for rate limiting
      await recordVerificationCodeRequest(targetEmail);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const verifyEmailWithCode = async (code: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, error: 'No user signed in' };
      }

      // Verify the code
      const verificationResult = await verifyCode(currentUser.uid, code);
      if (!verificationResult.valid) {
        return { success: false, error: verificationResult.error || 'Invalid verification code' };
      }

      // Code is valid - mark email as verified in Firestore
      await markEmailAsVerifiedInFirestore(currentUser.uid);
      
      // Update Firestore verification state
      setFirestoreEmailVerified(true);

      // Reload user to get latest status
      await reload(currentUser);
      const freshUser = auth.currentUser;
      if (freshUser) {
        setUser(freshUser);
        // Double-check Firestore status to ensure state is in sync
        const verified = await isEmailVerifiedInFirestore(freshUser.uid);
        setFirestoreEmailVerified(verified);
      }

      return { success: true, message: 'Email verified successfully!' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const checkEmailVerification = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, verified: false, error: 'No user signed in' };
      }
      // Reload user to get latest verification status
      await reload(currentUser);
      const freshUser = auth.currentUser;
      if (freshUser) {
        setUser(freshUser);
      }
      
      // Check both Firebase Auth and Firestore verification status
      const firebaseVerified = freshUser?.emailVerified || false;
      const firestoreVerified = await isEmailVerifiedInFirestore(currentUser.uid);
      const isVerified = firebaseVerified || firestoreVerified;
      
      // Update state
      setFirestoreEmailVerified(firestoreVerified);
      
      return { success: true, verified: isVerified };
    } catch (error: any) {
      return { success: false, verified: false, error: error.message };
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    logout: async () => {
      try {
        await signOut(auth);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    },
    sendVerificationCode,
    resendVerificationCode: () => sendVerificationCode(),
    checkEmailVerification,
    verifyEmailWithCode,
    isAuthenticated: !!user,
    // Check both Firebase Auth and Firestore verification status
    isEmailVerified: (user?.emailVerified || false) || firestoreEmailVerified,
  };
}
```

### 6. `screens/EmailVerificationScreen.tsx` (Key parts)

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../lib/theme';

export const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({ 
  navigation,
  email 
}) => {
  const { theme } = useTheme();
  const { sendVerificationCode, verifyEmailWithCode, checkEmailVerification, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [code, setCode] = useState('');

  const handleResendCode = async () => {
    if (!user) {
      navigation.replace('Login');
      return;
    }

    setLoading(true);
    const result = await sendVerificationCode();
    setLoading(false);

    if (result.success) {
      setEmailSent(true);
      setCode('');
      Alert.alert('Success', 'Verification code sent! Please check your email.');
    } else {
      if (result.error === 'RATE_LIMIT_EXCEEDED') {
        Alert.alert('Rate Limit', result.message || 'Too many requests. Please wait before trying again.');
      } else {
        Alert.alert('Error', result.error || 'Failed to send verification code. Please try again.');
      }
    }
  };

  const handleVerifyCode = async () => {
    if (!user) {
      navigation.replace('Login');
      return;
    }

    // Validate code format (6 digits)
    const codeDigits = code.replace(/\D/g, '');
    if (codeDigits.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit verification code.');
      return;
    }

    setVerifying(true);
    const result = await verifyEmailWithCode(codeDigits);
    setVerifying(false);

    if (result.success) {
      // Check verification status immediately
      await checkEmailVerification();
      
      Alert.alert('Success', 'Your email has been verified! Redirecting to the app...', [
        {
          text: 'OK',
          onPress: () => {
            // Navigation will happen automatically via RootNavigator
          },
        },
      ]);
    } else {
      Alert.alert('Verification Failed', result.error || 'Invalid verification code. Please try again.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Verify Your Email
        </Text>
        
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          We've sent a 6-digit verification code to your email. Please enter it below.
        </Text>

        <View style={styles.codeInputContainer}>
          <TextInput
            style={[
              styles.codeInput,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            value={code}
            onChangeText={(text) => {
              const digits = text.replace(/\D/g, '').slice(0, 6);
              setCode(digits);
            }}
            placeholder="000000"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus={true}
            textAlign="center"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: theme.colors.primary,
              opacity: code.length === 6 ? 1 : 0.5,
            },
          ]}
          onPress={handleVerifyCode}
          disabled={verifying || code.length !== 6}
        >
          {verifying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify Code</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
          onPress={handleResendCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
              Resend Code
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  codeInputContainer: {
    marginBottom: 24,
  },
  codeInput: {
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 8,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### 7. `App.tsx` (Navigation logic)

```typescript
// Root Navigator (decides between Auth and Main)
function RootNavigator() {
  const { user, loading, isEmailVerified, checkEmailVerification } = useAuth();
  const { theme } = useTheme();
  const [showSplash, setShowSplash] = React.useState(true);
  
  // Re-check verification status periodically when user is logged in but not verified
  React.useEffect(() => {
    if (!user || isEmailVerified || loading) return;
    
    // Check verification status every 2 seconds if user is not verified
    const interval = setInterval(async () => {
      const result = await checkEmailVerification();
      if (result.success && result.verified) {
        clearInterval(interval);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [user, isEmailVerified, loading, checkEmailVerification]);

  if (loading || showSplash) {
    return <SplashScreen />;
  }

  // Block unverified users from accessing the app
  const canAccessApp = user && isEmailVerified;

  return (
    <NavigationContainer>
      {canAccessApp ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
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

For testing (Resend default domain):
```typescript
const FROM_EMAIL = 'YourApp <onboarding@resend.dev>';
```

For production (verified domain):
```typescript
const FROM_EMAIL = 'YourApp <noreply@yourdomain.com>';
```

### Step 3: Update Email Template

Customize the email HTML in `sendVerificationCodeEmail()` function:
- Change "YourApp" to your app name
- Adjust colors to match your brand
- Modify the message text

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
   - Should navigate to main app

3. **Resend Code**
   - Click "Resend Code"
   - Should receive new code
   - Old code should be invalid

4. **Rate Limiting**
   - Request 5+ codes in 24 hours
   - Should show rate limit message

5. **Expired Code**
   - Wait 10+ minutes
   - Try to verify old code
   - Should show expired error

### Testing with Resend Free Tier

- Free tier only allows sending to your own email
- Use your Resend account email for testing
- Verify domain to send to any email

---

## Troubleshooting

### Email Not Sending

**Issue:** No email received
- Check Resend API key is correct
- Check FROM_EMAIL is valid
- Check Resend dashboard for errors
- Verify domain if using custom domain

**Solution:**
```typescript
// Check logs in emailService.ts
console.log('Resend API response:', responseData);
```

### Code Verification Fails

**Issue:** Code always invalid
- Check Firestore security rules
- Check code hasn't expired (10 minutes)
- Check code was deleted after use

**Solution:**
```typescript
// Check Firestore document
const codeRef = doc(db, 'verificationCodes', userId);
const codeDoc = await getDoc(codeRef);
console.log('Code data:', codeDoc.data());
```

### Navigation Not Working

**Issue:** User verified but stuck on verification screen
- Check `isEmailVerified` state updates
- Check RootNavigator polling logic
- Check Firestore verification status

**Solution:**
```typescript
// Force re-check
await checkEmailVerification();
// Check state
console.log('isEmailVerified:', isEmailVerified);
```

### Rate Limiting Issues

**Issue:** Can't request codes after limit
- Check AsyncStorage is working
- Check rate limit logic
- Clear AsyncStorage to reset: `AsyncStorage.removeItem('@yourapp:verification_code_requests')`

---

## Security Considerations

### Production Recommendations

1. **Move API Key to Server**
   - Use Firebase Cloud Functions
   - Keep API key server-side
   - Call function from app

2. **Add Server-Side Validation**
   - Verify codes server-side
   - Add additional security checks
   - Log suspicious activity

3. **Implement CAPTCHA**
   - Prevent bot sign-ups
   - Add to sign-up form
   - Use reCAPTCHA or similar

4. **Monitor Usage**
   - Track verification attempts
   - Alert on suspicious patterns
   - Set up rate limiting alerts

---

## Cost Estimates

### Resend
- Free tier: 3,000 emails/month
- Paid: $20/month for 50,000 emails

### Firebase
- Free tier: Generous limits
- Firestore: Free for small apps
- Auth: Free tier sufficient

---

## Additional Features

### Optional Enhancements

1. **Code Expiry Warning**
   - Show countdown timer
   - Warn user when code expires soon

2. **Auto-fill from SMS**
   - Use SMS code as backup
   - Auto-detect SMS codes

3. **Biometric Verification**
   - Skip code for trusted devices
   - Use Face ID / Touch ID

4. **Email Template Customization**
   - Multiple templates
   - Brand customization
   - Localization support

---

## Conclusion

This implementation provides a complete email code verification system that:

- ✅ Works across all devices
- ✅ Better UX than email links
- ✅ Secure and rate-limited
- ✅ Easy to implement
- ✅ Production-ready

For questions or issues, refer to the troubleshooting section or check the code comments.

---

## License

This implementation guide is provided as-is. Adapt as needed for your project.
