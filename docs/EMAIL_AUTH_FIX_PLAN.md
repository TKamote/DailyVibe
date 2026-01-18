Email Authentication Fix Plan
Execution Plan for Critical Issues

Priority: HIGH - Sign Out Loop Fix
Priority: HIGH - Deep Linking Implementation
Priority: MEDIUM - Error Handling & Rate Limiting
Priority: LOW - Performance Optimization

================================================================================
ISSUE 1: SIGN-OUT LOOP (CRITICAL - MUST FIX FIRST)
================================================================================

Problem:
- User signs up → EmailVerification screen shows
- If user signs out (or user state becomes null), AuthNavigator's initialRouteName 
  was already set to 'EmailVerification' and doesn't update
- EmailVerificationScreen requires user to function, but user is null
- User gets stuck on broken EmailVerification screen

Root Cause:
1. AuthNavigator calculates initialRouteName once on mount (line 160 in App.tsx)
2. initialRouteName doesn't react to user state changes
3. EmailVerificationScreen doesn't check if user is null and redirect

Solution Steps:

STEP 1.1: Fix AuthNavigator to be reactive
File: App.tsx
Location: AuthNavigator function (lines 155-175)

Change:
- Remove static initialRouteName calculation
- Use navigation.reset() or navigation.replace() based on current user state
- Add useEffect to watch user state and navigate accordingly

Implementation:
- Add useEffect in AuthNavigator that watches user and isEmailVerified
- If user is null → navigate to 'Login'
- If user exists but not verified → navigate to 'EmailVerification'
- If user exists and verified → should not reach AuthNavigator (handled by RootNavigator)

STEP 1.2: Add null user protection in EmailVerificationScreen
File: screens/EmailVerificationScreen.tsx

Change:
- Add useEffect that checks if user becomes null
- If user is null, redirect to Login screen
- Show loading state while checking user

Implementation:
- Add useEffect hook that watches user
- If user is null, call navigation.replace('Login')
- Add early return with loading indicator if user is null

STEP 1.3: Add sign-out option on EmailVerificationScreen
File: screens/EmailVerificationScreen.tsx

Change:
- Add "Sign Out" button/link
- Allow users to sign out and return to Login screen
- Prevents users from being trapped

Implementation:
- Import logout from useAuth
- Add TouchableOpacity button "Sign Out" or "Use Different Account"
- On press, call logout() then navigate to Login

================================================================================
ISSUE 2: DEEP LINKING (HIGH PRIORITY - USER EXPERIENCE)
================================================================================

Problem:
- Email verification links open in browser, not app
- User must manually return to app and click "I've Verified My Email"
- Password reset links have same issue
- Poor user experience

Current State:
- URL scheme already configured: "dailyvibe" in app.json (line 8)
- But no deep link handling code exists

Solution Steps:

STEP 2.1: Install deep linking dependencies
Command:
npm install expo-linking

STEP 2.2: Create deep link handler utility
File: lib/deepLinking.ts (NEW FILE)

Purpose:
- Handle incoming deep links
- Parse verification and password reset links
- Extract action codes from Firebase email links

Implementation:
- Use expo-linking to listen for deep links
- Parse URL to extract mode (verifyEmail, resetPassword) and oobCode
- Return parsed data for use in app

STEP 2.3: Handle email verification deep links
File: App.tsx or create EmailVerificationHandler component

Purpose:
- Listen for deep links when app is open
- Automatically verify email when link is clicked
- Show success message and navigate to main app

Implementation:
- Add useEffect in RootNavigator or App component
- Listen for deep links using expo-linking
- If link is email verification, extract oobCode
- Call Firebase's applyActionCode() to verify email
- Update user state and navigate to main app

STEP 2.4: Handle password reset deep links
File: screens/ForgotPasswordScreen.tsx or create ResetPasswordScreen.tsx

Purpose:
- Handle password reset links
- Allow user to set new password
- Complete password reset flow

Implementation:
- Create ResetPasswordScreen component
- Listen for deep links with mode=resetPassword
- Extract oobCode from URL
- Show password input form
- Use Firebase's confirmPasswordReset() to complete reset

STEP 2.5: Configure Firebase email templates
Firebase Console Configuration:

1. Go to Firebase Console → Authentication → Templates
2. Email Address Verification template:
   - Action URL: dailyvibe://verify-email?mode=verifyEmail&oobCode={{oobCode}}
   - Customize subject and body

3. Password Reset template:
   - Action URL: dailyvibe://reset-password?mode=resetPassword&oobCode={{oobCode}}
   - Customize subject and body

STEP 2.6: Test deep linking
- Test on iOS simulator
- Test on physical device
- Test with email links
- Verify links open app and complete action

================================================================================
ISSUE 3: ERROR HANDLING & RATE LIMITING (MEDIUM PRIORITY)
================================================================================

Problem:
- No handling for expired verification links
- No rate limiting on resend verification email
- Poor error messages for edge cases

Solution Steps:

STEP 3.1: Add rate limiting to resend verification
File: hooks/useAuth.ts

Implementation:
- Track last email send time
- Prevent sending if less than 60 seconds since last send
- Return clear error message: "Please wait 60 seconds before requesting another email"

STEP 3.2: Handle expired verification links
File: lib/deepLinking.ts or EmailVerificationHandler

Implementation:
- Catch Firebase errors for expired/invalid codes
- Show user-friendly message: "This verification link has expired. Please request a new one."
- Provide button to resend verification email

STEP 3.3: Improve error messages
File: screens/EmailVerificationScreen.tsx

Implementation:
- Map Firebase error codes to user-friendly messages
- Show specific errors for:
  - Expired links
  - Invalid links
  - Network errors
  - Rate limiting
  - Email already verified

STEP 3.4: Add retry logic with delays
File: screens/EmailVerificationScreen.tsx

Implementation:
- Add exponential backoff for retry attempts
- Show countdown timer for rate-limited resend button
- Disable button during cooldown period

================================================================================
ISSUE 4: POLLING OPTIMIZATION (LOW PRIORITY)
================================================================================

Problem:
- Polling every 3 seconds for 15 minutes is inefficient
- Could drain battery on mobile devices

Solution Steps:

STEP 4.1: Implement exponential backoff for polling
File: screens/EmailVerificationScreen.tsx

Current: Polls every 3 seconds
New: 
- First 2 minutes: every 3 seconds
- Next 3 minutes: every 5 seconds
- Next 5 minutes: every 10 seconds
- Remaining time: every 30 seconds

Implementation:
- Track polling start time
- Calculate current interval based on elapsed time
- Update setInterval with new interval value

STEP 4.2: Reduce polling when app is in background
File: screens/EmailVerificationScreen.tsx

Implementation:
- Already implemented (stops polling in background)
- Keep this behavior

================================================================================
EXECUTION ORDER (RECOMMENDED)
================================================================================

Phase 1: Critical Fixes (Do First)
1. Fix sign-out loop (Steps 1.1, 1.2, 1.3)
2. Test sign-out flow thoroughly
3. Test edge cases (sign out while unverified, app restart, etc.)

Phase 2: Deep Linking (High Priority)
4. Install expo-linking
5. Create deep link handler utility
6. Implement email verification deep linking
7. Configure Firebase email templates
8. Test email verification deep links
9. Implement password reset deep linking
10. Test password reset deep links

Phase 3: Error Handling (Medium Priority)
11. Add rate limiting to resend verification
12. Handle expired verification links
13. Improve error messages
14. Add retry logic with delays

Phase 4: Optimization (Low Priority)
15. Implement exponential backoff for polling
16. Test polling efficiency

================================================================================
TESTING CHECKLIST
================================================================================

Sign-Out Loop Fix:
□ Sign up new account
□ Verify EmailVerification screen shows
□ Sign out from EmailVerification screen
□ Verify redirects to Login screen
□ Sign in with unverified account
□ Verify EmailVerification screen shows
□ Sign out again
□ Verify no loop occurs
□ Close app while on EmailVerification screen
□ Reopen app
□ Verify proper screen shows

Deep Linking:
□ Click email verification link
□ Verify app opens automatically
□ Verify email is verified automatically
□ Verify redirects to main app
□ Click password reset link
□ Verify app opens automatically
□ Verify password reset screen shows
□ Complete password reset
□ Verify can sign in with new password

Error Handling:
□ Try to resend verification email multiple times quickly
□ Verify rate limiting works (60 second cooldown)
□ Use expired verification link
□ Verify clear error message shows
□ Test with no internet connection
□ Verify network error message shows

Polling:
□ Verify polling starts when screen loads
□ Verify polling stops when app goes to background
□ Verify polling resumes when app comes to foreground
□ Verify polling stops after 15 minutes
□ Verify exponential backoff works (if implemented)

================================================================================
ESTIMATED TIME
================================================================================

Phase 1 (Critical Fixes): 2-3 hours
Phase 2 (Deep Linking): 4-6 hours
Phase 3 (Error Handling): 2-3 hours
Phase 4 (Optimization): 1-2 hours

Total: 9-14 hours

================================================================================
NOTES
================================================================================

- Start with Phase 1 (sign-out loop fix) - this is blocking users
- Deep linking significantly improves UX but isn't blocking
- Error handling prevents user frustration
- Polling optimization is nice-to-have

- Test on both iOS and Android if possible
- Test on physical devices for deep linking
- Consider adding analytics to track verification completion rates

