import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  reload,
  sendPasswordResetEmail,
  User,
  deleteUser
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { storeVerificationCode, verifyCode, deleteVerificationCodesForUser } from '../lib/verificationCodes';
import { sendVerificationCodeEmail } from '../lib/emailService';
import { checkVerificationCodeRateLimit, recordVerificationCodeRequest, checkPasswordResetRateLimit, recordPasswordResetRequest } from '../lib/rateLimiting';
import { markEmailAsVerifiedInFirestore, isEmailVerifiedInFirestore, clearEmailVerificationInFirestore, deleteAllUserHabits } from '../lib/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isEmailVerified: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string; message?: string; userCreated?: boolean; userId?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  sendVerificationCode: (userId?: string, email?: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  resendVerificationCode: () => Promise<{ success: boolean; error?: string; message?: string }>;
  verifyEmailWithCode: (code: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  checkEmailVerification: () => Promise<{ success: boolean; verified: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
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
        // Check Firestore verification status when user changes
        const verified = await isEmailVerifiedInFirestore(user.uid);
        setFirestoreEmailVerified(verified);
      } else {
        setFirestoreEmailVerified(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Check if email is verified (Firebase Auth or Firestore)
      if (userCredential.user) {
        const firebaseVerified = userCredential.user.emailVerified;
        const firestoreVerified = await isEmailVerifiedInFirestore(userCredential.user.uid);
        
        // Update local state immediately
        setFirestoreEmailVerified(firestoreVerified);
        
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

  const signUp = async (email: string, password: string) => {
    try {
      console.log('[signUp] Creating user account for:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Automatically send verification code after sign up
      if (userCredential.user) {
        console.log('[signUp] User created successfully, sending verification code...');
        const codeResult = await sendVerificationCode(userCredential.user.uid, email);
        
        if (!codeResult.success) {
          console.error('[signUp] Failed to send verification code:', codeResult.error);
          return { 
            success: false, 
            error: 'VERIFICATION_CODE_SEND_FAILED',
            message: codeResult.message || codeResult.error || 'Failed to send verification code. Please try resending from the verification screen.',
            userCreated: true,
            userId: userCredential.user.uid
          };
        }
      }
      return { success: true };
    } catch (error: any) {
      console.error('[signUp] Error during signup:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteAccount = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, error: 'No user signed in' };
      }

      const userId = currentUser.uid;
      
      console.log('[deleteAccount] Deleting account for user:', userId);
      
      // Delete all user's habits from Firestore
      await deleteAllUserHabits(userId);
      
      // Clear email verification status
      await clearEmailVerificationInFirestore(userId);
      
      // Delete verification codes
      await deleteVerificationCodesForUser(userId);
      
      // Delete the user account from Firebase Auth
      await deleteUser(currentUser);
      
      return { success: true };
    } catch (error: any) {
      console.error('[deleteAccount] Error deleting account:', error);
      return { success: false, error: error.message };
    }
  };

  const sendVerificationCode = async (userId?: string, email?: string) => {
    try {
      const currentUser = auth.currentUser;
      // Allow sending code even if not fully logged in (during signup process)
      const targetUserId = userId || currentUser?.uid;
      const targetEmail = email || currentUser?.email;

      if (!targetUserId || !targetEmail) {
        return { success: false, error: 'User information missing' };
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

      // MAGIC DOMAIN LOGIC: Skip sending for test accounts
      if (targetEmail.endsWith('@test.dailyvibe.fun')) {
        console.log('[MagicDomain] Skipping email send for:', targetEmail);
        return { success: true };
      }

      // Generate and store code
      const { code } = await storeVerificationCode(targetUserId, targetEmail);

      // Send email with code
      const emailResult = await sendVerificationCodeEmail(targetEmail, code);
      if (!emailResult.success) {
        // Clean up code if email failed
        await deleteVerificationCodesForUser(targetUserId);
        return { 
          success: false, 
          error: emailResult.error || 'Failed to send verification code',
          message: emailResult.error || 'Failed to send verification code. Please check your email address and try again.'
        };
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

      // MAGIC DOMAIN LOGIC: Bypass check for test accounts with code 123456
      if (currentUser.email?.endsWith('@test.dailyvibe.fun') && code === '123456') {
        console.log('[MagicDomain] Bypassing verification check for:', currentUser.email);
      } else {
        // Verify the code normally
        const verificationResult = await verifyCode(currentUser.uid, code);
        if (!verificationResult.valid) {
          return { success: false, error: verificationResult.error || 'Invalid verification code' };
        }
      }

      // Code is valid - mark email as verified in Firestore
      await markEmailAsVerifiedInFirestore(currentUser.uid);
      
      // CRITICAL: Update local state immediately upon success
      // This triggers the re-render in RootNavigator to switch screens
      setFirestoreEmailVerified(true);

      // Reload user to get latest status from Firebase too
      await reload(currentUser);
      const freshUser = auth.currentUser;
      if (freshUser) {
        setUser(freshUser);
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

  const resetPassword = async (email: string) => {
    try {
      // Check rate limit before sending
      const rateLimitCheck = await checkPasswordResetRateLimit(email);
      if (!rateLimitCheck.canRequest) {
        return {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: rateLimitCheck.message || 'Too many password reset requests. Please wait before trying again.',
        };
      }

      // Send password reset email
      await sendPasswordResetEmail(auth, email);
      
      // Record the request for rate limiting
      await recordPasswordResetRequest(email);
      
      return { success: true };
    } catch (error: any) {
      if (error.code === 'auth/too-many-requests') {
        return {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many password reset requests. Please wait 1 hour before requesting another.',
        };
      }
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    isEmailVerified: (user?.emailVerified || false) || firestoreEmailVerified,
    signIn,
    signUp,
    logout,
    deleteAccount,
    sendVerificationCode,
    resendVerificationCode: () => sendVerificationCode(),
    verifyEmailWithCode,
    checkEmailVerification,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
