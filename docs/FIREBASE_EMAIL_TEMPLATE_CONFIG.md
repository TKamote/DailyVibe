Firebase Email Template Configuration Guide

This guide explains how to configure Firebase email templates to use deep linking for email verification and password reset.

================================================================================
STEP 1: Access Firebase Console
================================================================================

1. Go to https://console.firebase.google.com/
2. Select your project: dailyvibe-4a9bf
3. Navigate to: Authentication → Templates

================================================================================
STEP 2: Configure Email Address Verification Template
================================================================================

1. Click on "Email address verification" template
2. Click "Edit" or "Customize template"

3. Update the Action URL field:
   Replace the default URL with:
   dailyvibe://verify-email?mode=verifyEmail&oobCode={{oobCode}}

4. Customize the email subject (optional):
   Example: "Verify your DailyVibe email"

5. Customize the email body (optional):
   You can use these variables:
   - {{displayName}} - User's display name
   - {{email}} - User's email address
   - {{oobCode}} - Verification code (used in URL)
   - {{oobLink}} - Full verification link (will use our custom URL)

   Example body:
   "Hi {{displayName}},
   
   Please verify your email address by clicking the link below:
   
   {{oobLink}}
   
   If you didn't create a DailyVibe account, you can ignore this email.
   
   Thanks,
   The DailyVibe Team"

6. Click "Save"

================================================================================
STEP 3: Configure Password Reset Template
================================================================================

1. Click on "Password reset" template
2. Click "Edit" or "Customize template"

3. **IMPORTANT: Use Firebase's Default Web Handler URL**
   - **Leave the Action URL field EMPTY** (or use Firebase's default)
   - This allows the reset link to work on ANY device (desktop, mobile, tablet)
   - The link will open a web page where users can reset their password
   - After reset, users can sign in to the app with their new password

   **DO NOT use:** dailyvibe://reset-password (this only works on devices with the app installed)

4. Customize the email subject (optional):
   Example: "Reset your DailyVibe password"

5. Customize the email body (optional):
   You can use these variables:
   - {{displayName}} - User's display name
   - {{email}} - User's email address
   - {{oobCode}} - Reset code (used in URL)
   - {{oobLink}} - Full reset link (will use Firebase's default web URL)

   **Recommended email body (with HTML formatting for clickable link):**
   ```
   <p>Hi {{displayName}},</p>
   
   <p>You requested to reset your password. Click the link below to set a new password:</p>
   
   <p><a href="{{oobLink}}" style="color: #007AFF; text-decoration: underline;">Reset Password</a></p>
   
   <p>You can open this link on any device - your phone, computer, or tablet.</p>
   
   <p>This link will expire in 1 hour.</p>
   
   <p>If you didn't request a password reset, you can ignore this email.</p>
   
   <p>Thanks,<br>The DailyVibe Team</p>
   ```

   **Or plain text version:**
   ```
   Hi {{displayName}},
   
   You requested to reset your password. Click the link below to set a new password:
   
   {{oobLink}}
   
   You can open this link on any device - your phone, computer, or tablet.
   
   This link will expire in 1 hour.
   
   If you didn't request a password reset, you can ignore this email.
   
   Thanks,
   The DailyVibe Team
   ```

6. Click "Save"

================================================================================
STEP 4: Verify Authorized Domains (Important!)
================================================================================

1. In Firebase Console, go to: Authentication → Settings → Authorized domains
2. Make sure these domains are listed:
   - dailyvibe-4a9bf.firebaseapp.com (should be there by default)
   - Your custom domain (if you have one)
   - localhost (for development)

3. For iOS deep linking, also check:
   - Authentication → Settings → Users
   - Make sure "Email/Password" provider is enabled

================================================================================
STEP 5: Test Deep Links
================================================================================

After configuring the templates:

1. Build a development or production build (deep links don't work in Expo Go)
2. Sign up a new account
3. Check your email for verification link
4. Click the link - it should open the app automatically
5. Email should be verified automatically

For password reset:
1. Click "Forgot Password" on login screen
2. Enter your email
3. Check your email for reset link
4. Click the link - it will open a web page in your browser (works on any device)
5. Enter your new password on the web page
6. After reset, sign in to the app with your new password

================================================================================
TROUBLESHOOTING
================================================================================

Issue: Email verification links open in browser instead of app
Solution:
- Make sure you're testing on a production/development build (not Expo Go)
- Verify the URL scheme in app.json: "scheme": "dailyvibe"
- Check that Action URL in Firebase email verification template uses "dailyvibe://" not "https://"

Issue: Password reset link doesn't work on desktop
Solution:
- Make sure the Action URL field in Firebase password reset template is EMPTY (uses default)
- The default web handler works on all devices (desktop, mobile, tablet)
- Users complete the reset on the web page, then sign in to the app

Issue: "Invalid reset link" error
Solution:
- Reset links expire after 1 hour
- Make sure you're using a fresh link
- Check that the oobCode parameter is in the URL

Issue: Too many password reset requests
Solution:
- The app limits password reset requests to 3 per 24 hours per email address
- If you see this error, wait before requesting another reset
- Firebase also has its own rate limiting (typically 3-5 per hour)

================================================================================
NOTES
================================================================================

- Deep links only work in production/development builds, not Expo Go
- Test on physical devices for best results
- iOS Simulator may have limitations with deep linking
- Links expire after 1 hour (Firebase default)
- You can customize email templates further if needed

================================================================================
URL FORMATS
================================================================================

Email Verification (Deep Link - opens app):
dailyvibe://verify-email?mode=verifyEmail&oobCode=ABC123XYZ
- Works on mobile devices with the app installed
- Opens the app directly to verification screen

Password Reset (Web Handler - works everywhere):
https://dailyvibe-4a9bf.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=ABC123XYZ
- Works on ANY device (desktop, mobile, tablet)
- Opens a web page where user can reset password
- After reset, user signs in to app with new password

The app handles email verification deep links automatically.
Password reset uses Firebase's default web handler for maximum compatibility.

