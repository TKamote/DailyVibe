import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  reload,
  updateEmail,
  User
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { deleteAllUserHabits, markEmailAsVerifiedInFirestore, isEmailVerifiedInFirestore } from '../lib/firestore';
import { checkPasswordResetRateLimit, recordPasswordResetRequest } from '../lib/rateLimiting';
import { storeVerificationCode, verifyCode, deleteVerificationCodesForUser } from '../lib/verificationCodes';
import { sendVerificationCodeEmail } from '../lib/emailService';
import { checkVerificationCodeRateLimit, recordVerificationCodeRequest } from '../lib/rateLimiting';

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

  const signUp = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Automatically send verification code after sign up
      if (userCredential.user) {
        const codeResult = await sendVerificationCode(userCredential.user.uid, email);
        if (!codeResult.success) {
          console.error('Failed to send verification code:', codeResult.error);
          // Still return success for sign up, but log the error
          // User can resend code from verification screen
        }
      }
      return { success: true };
    } catch (error: any) {
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
      
      // Delete all user's habits from Firestore
      await deleteAllUserHabits(userId);
      
      // Delete the user account from Firebase Auth
      await deleteUser(currentUser);
      
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

  const resendVerificationCode = async () => {
    return sendVerificationCode();
  };

  const checkEmailVerification = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, verified: false, error: 'No user signed in' };
      }
      // Reload user to get latest verification status
      await reload(currentUser);
      // Force auth state to update by getting fresh user
      const freshUser = auth.currentUser;
      // Update state manually to ensure UI reflects verification status
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
      // Handle Firebase rate limiting errors
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
      // Note: Firebase Auth's emailVerified flag requires Admin SDK to set from server-side
      // For now, we track verification in Firestore and check both sources
      await markEmailAsVerifiedInFirestore(currentUser.uid);
      
      // Update Firestore verification state immediately
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

  return {
    user,
    loading,
    signIn,
    signUp,
    logout,
    deleteAccount,
    sendVerificationCode,
    resendVerificationCode,
    checkEmailVerification,
    resetPassword,
    verifyEmailWithCode,
    isAuthenticated: !!user,
    // Check both Firebase Auth and Firestore verification status
    isEmailVerified: (user?.emailVerified || false) || firestoreEmailVerified,
  };
}

