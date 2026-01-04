# Email Verification & Password Reset Implementation Plan

## Overview
This document outlines the implementation plan for adding email verification (activation) and password reset (forgot password) functionality to the DailyVibe app.

## Current State
- ✅ Basic email/password authentication (sign in/sign up)
- ✅ Firebase Auth integration
- ❌ No email verification for new users
- ❌ No password reset functionality
- ❌ No email verification status checking

---

## 1. Dependencies

### New Dependencies Required
**None** - All required functionality is available in Firebase Auth SDK (already installed: `firebase@^12.7.0`)

### Firebase Services to Configure
1. **Firebase Authentication Email Templates** (configured in Firebase Console)
   - Email verification template
   - Password reset template
   - Email action handler URL configuration

2. **Firebase Dynamic Links** (optional, for deep linking)
   - For better mobile experience when clicking email links
   - Alternative: Use Firebase Auth default email links

---

## 2. Features to Implement

### 2.1 Email Verification (Activation)

#### User Flow:
1. User signs up with email/password
2. Firebase creates account but user is **not automatically verified**
3. System sends verification email automatically
4. User receives email with verification link
5. User clicks link → email verified
6. User can now sign in (or auto-sign-in if link opened in app)

#### Implementation Components:
- **Backend (Firebase Auth):**
  - `sendEmailVerification()` - Send verification email
  - `reload()` - Refresh user data to check verification status
  - `emailVerified` property - Check if email is verified

- **Frontend Screens:**
  - Update `LoginScreen.tsx` - Add "Resend verification email" option
  - New `EmailVerificationScreen.tsx` - Show verification status/pending screen
  - Update `useAuth.ts` hook - Add verification methods

- **User Experience:**
  - After sign up, show "Check your email" message
  - Block access to main app until email verified (optional)
  - Allow resending verification email
  - Show verification status in UI

### 2.2 Password Reset (Forgot Password)

#### User Flow:
1. User clicks "Forgot Password?" link on login screen
2. User enters email address
3. System sends password reset email
4. User receives email with reset link
5. User clicks link → opens app/browser → enters new password
6. Password updated → user can sign in with new password

#### Implementation Components:
- **Backend (Firebase Auth):**
  - `sendPasswordResetEmail()` - Send reset email
  - `confirmPasswordReset()` - Verify reset code and set new password (if using code)
  - Email action handler URL configuration

- **Frontend Screens:**
  - Update `LoginScreen.tsx` - Add "Forgot Password?" link
  - New `ForgotPasswordScreen.tsx` - Enter email form
  - New `ResetPasswordScreen.tsx` - Enter new password form (if using code flow)
  - Update `useAuth.ts` hook - Add password reset methods

- **User Experience:**
  - "Forgot Password?" link below password field
  - Email input screen with "Send Reset Link" button
  - Success message: "Check your email for reset instructions"
  - Handle deep links when user clicks email link

---

## 3. Workflow Diagrams

### 3.1 Sign Up with Email Verification Flow

```
[User Signs Up]
    ↓
[Firebase Creates Account]
    ↓
[Send Verification Email Automatically]
    ↓
[Show "Check Your Email" Screen]
    ↓
[User Checks Email & Clicks Link]
    ↓
[Email Verified]
    ↓
[User Can Sign In]
```

### 3.2 Password Reset Flow

```
[User Clicks "Forgot Password?"]
    ↓
[Enter Email Address]
    ↓
[Send Password Reset Email]
    ↓
[Show "Check Your Email" Message]
    ↓
[User Clicks Reset Link in Email]
    ↓
[App Opens / Browser Opens]
    ↓
[User Enters New Password]
    ↓
[Password Updated]
    ↓
[User Can Sign In with New Password]
```

### 3.3 Sign In with Unverified Email Flow

```
[User Tries to Sign In]
    ↓
[Check if Email Verified]
    ↓
[If NOT Verified]
    ↓
[Show "Please Verify Email" Message]
    ↓
[Option: Resend Verification Email]
    ↓
[User Verifies Email]
    ↓
[Allow Sign In]
```

---

## 4. Implementation Steps

### Phase 1: Firebase Configuration
1. **Configure Email Templates in Firebase Console**
   - Go to Firebase Console → Authentication → Templates
   - Customize email verification template
   - Customize password reset template
   - Set action URL (for deep linking)

2. **Configure Authorized Domains**
   - Add app domain to authorized domains
   - Configure iOS bundle ID for deep links
   - Configure Android package name for deep links

3. **Set Up Deep Linking (Optional but Recommended)**
   - Configure Firebase Dynamic Links
   - Or use Firebase Auth default email action handler
   - Set up URL scheme in app.json

### Phase 2: Backend Functions (useAuth Hook)
1. **Add Email Verification Methods:**
   ```typescript
   - sendEmailVerification()
   - checkEmailVerification()
   - resendVerificationEmail()
   ```

2. **Add Password Reset Methods:**
   ```typescript
   - sendPasswordResetEmail(email: string)
   - confirmPasswordReset(code: string, newPassword: string) // if using code
   ```

3. **Update Sign Up Flow:**
   - After `createUserWithEmailAndPassword()`
   - Automatically call `sendEmailVerification()`
   - Return verification status

4. **Update Sign In Flow:**
   - Check `user.emailVerified` status
   - Show appropriate message if not verified
   - Optionally block access until verified

### Phase 3: UI Components

1. **Update LoginScreen.tsx:**
   - Add "Forgot Password?" link below password field
   - Add verification status check after sign in
   - Show "Resend verification email" option if not verified

2. **Create ForgotPasswordScreen.tsx:**
   - Email input field
   - "Send Reset Link" button
   - Success/error messages
   - Back to login link

3. **Create EmailVerificationScreen.tsx (Optional):**
   - Show verification pending status
   - "Resend Email" button
   - "Check Email" instructions
   - Auto-check verification status

4. **Create ResetPasswordScreen.tsx (If using code flow):**
   - Code input field
   - New password input
   - Confirm password input
   - Submit button

### Phase 4: Navigation Updates

1. **Add New Routes:**
   - `ForgotPassword` screen in AuthStack
   - `EmailVerification` screen (optional, can be modal)
   - `ResetPassword` screen (if using code flow)

2. **Update Navigation Flow:**
   - Login → Forgot Password
   - Sign Up → Email Verification (modal or screen)
   - Email Link → Reset Password or Verify Email

### Phase 5: Deep Linking Setup

1. **Configure URL Scheme in app.json:**
   ```json
   "scheme": "dailyvibe",
   "ios": {
     "bundleIdentifier": "com.davidonq.DailyVibe"
   }
   ```

2. **Handle Deep Links:**
   - Listen for email verification links
   - Listen for password reset links
   - Extract action code from URL
   - Process verification/reset

3. **Test Deep Links:**
   - Test on iOS simulator
   - Test on physical device
   - Test email link opening

### Phase 6: Error Handling & Edge Cases

1. **Error Scenarios:**
   - Invalid email format
   - Email not found (password reset)
   - Expired verification link
   - Expired reset link
   - Network errors
   - Too many requests (rate limiting)

2. **User Feedback:**
   - Clear error messages
   - Success confirmations
   - Loading states
   - Retry mechanisms

---

## 5. Firebase Console Configuration Details

### Email Templates to Configure:

1. **Email Address Verification:**
   - Subject: "Verify your DailyVibe email"
   - Body: Include verification link
   - Action URL: `dailyvibe://verify-email?oobCode={{code}}`

2. **Password Reset:**
   - Subject: "Reset your DailyVibe password"
   - Body: Include reset link
   - Action URL: `dailyvibe://reset-password?oobCode={{code}}&mode=resetPassword`

### Authorized Domains:
- `dailyvibe-4a9bf.firebaseapp.com`
- `dailyvibe-4a9bf.web.app`
- Your custom domain (if any)

---

## 6. Security Considerations

1. **Rate Limiting:**
   - Firebase automatically rate limits email sends
   - Show appropriate messages if rate limited
   - Implement client-side cooldown if needed

2. **Email Verification Enforcement:**
   - Decide: Block access until verified? (Recommended for production)
   - Or: Allow access but show reminder banner?

3. **Password Reset Security:**
   - Reset links expire after 1 hour (Firebase default)
   - One-time use links
   - Require re-authentication for sensitive operations

4. **Error Message Security:**
   - Don't reveal if email exists in system (for password reset)
   - Generic error: "If email exists, reset link sent"

---

## 7. Testing Checklist

### Email Verification:
- [ ] Sign up sends verification email
- [ ] Verification email received
- [ ] Clicking link verifies email
- [ ] Resend verification email works
- [ ] Unverified users see appropriate message
- [ ] Verified status persists after app restart

### Password Reset:
- [ ] "Forgot Password?" link visible
- [ ] Email input validation works
- [ ] Reset email sent successfully
- [ ] Reset email received
- [ ] Clicking link opens app/browser
- [ ] New password can be set
- [ ] Can sign in with new password
- [ ] Old password no longer works

### Edge Cases:
- [ ] Invalid email format handling
- [ ] Non-existent email handling (password reset)
- [ ] Expired link handling
- [ ] Network error handling
- [ ] Rate limiting handling
- [ ] Deep link handling on iOS
- [ ] Deep link handling on Android

---

## 8. Implementation Priority

### Must Have (MVP):
1. ✅ Password reset email sending
2. ✅ Email verification on sign up
3. ✅ Basic UI for forgot password
4. ✅ Verification status checking

### Should Have:
1. ✅ Resend verification email
2. ✅ Deep link handling
3. ✅ Better error messages
4. ✅ Verification reminder UI

### Nice to Have:
1. ⚠️ Custom email templates (beyond Firebase defaults)
2. ⚠️ Email verification status banner
3. ⚠️ Password strength indicator
4. ⚠️ Two-factor authentication (future)

---

## 9. Estimated Implementation Time

- **Phase 1 (Firebase Config):** 30 minutes
- **Phase 2 (Backend Functions):** 2-3 hours
- **Phase 3 (UI Components):** 3-4 hours
- **Phase 4 (Navigation):** 1 hour
- **Phase 5 (Deep Linking):** 2-3 hours
- **Phase 6 (Error Handling):** 2 hours
- **Testing & Polish:** 2-3 hours

**Total Estimated Time:** 12-16 hours

---

## 10. Files to Create/Modify

### New Files:
- `screens/ForgotPasswordScreen.tsx`
- `screens/EmailVerificationScreen.tsx` (optional)
- `screens/ResetPasswordScreen.tsx` (if using code flow)

### Files to Modify:
- `hooks/useAuth.ts` - Add verification & reset methods
- `screens/LoginScreen.tsx` - Add forgot password link & verification check
- `App.tsx` - Add new navigation routes
- `app.json` - Add URL scheme for deep linking
- `lib/firebase.ts` - No changes needed (already configured)

---

## 11. Summary

### Dependencies:
- ✅ **No new npm packages needed** - Firebase Auth SDK already installed
- ⚠️ **Firebase Console configuration required** - Email templates & authorized domains

### Key Workflows:

1. **Email Verification:**
   - Auto-send on sign up
   - User clicks email link
   - Email verified → can use app

2. **Password Reset:**
   - User clicks "Forgot Password?"
   - Enters email
   - Receives reset link
   - Clicks link → sets new password

### Next Steps:
1. Review and approve this plan
2. Configure Firebase email templates
3. Implement backend functions in `useAuth.ts`
4. Create UI screens
5. Set up navigation
6. Configure deep linking
7. Test thoroughly
8. Deploy

---

## Questions to Decide:

1. **Email Verification Enforcement:**
   - Should unverified users be blocked from using the app?
   - Or just show a reminder banner?

2. **Password Reset Flow:**
   - Use Firebase default email links (simpler)?
   - Or implement custom code-based flow (more control)?

3. **Deep Linking:**
   - Use Firebase Dynamic Links (better UX)?
   - Or Firebase Auth default links (simpler setup)?

---

*Document created: January 4, 2026*
*Last updated: January 4, 2026*

