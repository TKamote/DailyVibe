# Password Reset Implementation Summary

## What Was Changed

### 1. **Switched to Firebase Default Web Handler**
- Password reset now uses Firebase's default web handler URL (works on all devices)
- Users can open the reset link on ANY device (desktop, mobile, tablet)
- Password reset happens on a web page, then users sign in to the app with new password

### 2. **Implemented Rate Limiting**
- Client-side rate limiting: **3 password reset requests per 24 hours** per email address
- Prevents abuse and reduces unnecessary email sends
- Shows clear error messages when limit is reached
- Also handles Firebase's server-side rate limiting errors

### 3. **Updated User Messages**
- Success message now mentions: "You can open this link on any device"
- Better error messages for rate limiting
- Clear instructions for users

### 4. **Updated Documentation**
- Firebase email template configuration guide updated
- Instructions for using default web handler
- Troubleshooting section updated

## What You Need to Do in Firebase Console

### **CRITICAL: Update Password Reset Email Template**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **dailyvibe-4a9bf**
3. Navigate to: **Authentication → Templates**
4. Click on **"Password reset"** template
5. Click **"Edit"** or **"Customize template"**
6. **IMPORTANT: Clear the Action URL field** (leave it empty or use Firebase's default)
   - This allows the reset link to work on ANY device
   - The link will be: `https://dailyvibe-4a9bf.firebaseapp.com/__/auth/action?...`
7. (Optional) Update email body to mention it works on any device:
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
8. Click **"Save"**

### **Email Verification Template (No Changes Needed)**
- Email verification still uses deep links (`dailyvibe://verify-email`)
- This works fine for mobile devices with the app installed
- No changes needed to email verification template

## How It Works Now

### Password Reset Flow:
1. User requests reset in app (mobile)
2. Firebase sends email with web link (https://)
3. User opens email on **ANY device** (desktop, mobile, tablet)
4. User clicks link → Opens Firebase web page in browser
5. User enters new password on web page
6. Password reset complete
7. User signs in to app with new password

### Rate Limiting:
- Maximum 3 password reset requests per 24 hours per email address
- Error message shows how many hours to wait
- Firebase also has its own rate limiting (3-5 per hour) as a security layer

## Testing

### Test Password Reset:
1. Request password reset in app
2. Check email (should receive within seconds)
3. Open email on desktop computer
4. Click link → Should open web page in browser
5. Enter new password on web page
6. Sign in to app with new password

### Test Rate Limiting:
1. Request password reset 3 times in quick succession
2. 4th request should show error: "You've reached the limit of 3 password reset requests per 24 hours"
3. Wait 24 hours or test with different email address

## Files Changed

- `lib/rateLimiting.ts` - New file for rate limiting logic
- `hooks/useAuth.ts` - Added rate limiting checks to `resetPassword()`
- `screens/ForgotPasswordScreen.tsx` - Updated messages and error handling
- `docs/FIREBASE_EMAIL_TEMPLATE_CONFIG.md` - Updated documentation
- `App.tsx` - Added comment about password reset using web handler

## Benefits

✅ **Works on all devices** - Desktop, mobile, tablet
✅ **Better user experience** - No confusion about which device to use
✅ **Rate limiting** - Prevents abuse and reduces email spam
✅ **Clear error messages** - Users know what to do
✅ **Simpler implementation** - Uses Firebase's built-in web handler

## Important Notes

- **Email verification still uses deep links** - This is fine, works on mobile
- **Password reset uses web handler** - Works everywhere
- **Rate limiting is client-side** - Can be bypassed by clearing app data, but Firebase's server-side limit still applies
- **Links expire after 1 hour** - Firebase default, cannot be changed
