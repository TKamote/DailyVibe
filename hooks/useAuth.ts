import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  deleteUser,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
  User
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { deleteAllUserHabits } from '../lib/firestore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Check if email is verified - don't sign out, just return status
      if (userCredential.user && !userCredential.user.emailVerified) {
        return { 
          success: false, 
          error: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email address to use the app. Check your inbox for the verification email.'
        };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Automatically send verification email after sign up
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
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

  const sendVerificationEmail = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, error: 'No user signed in' };
      }
      await sendEmailVerification(currentUser);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const resendVerificationEmail = async () => {
    return sendVerificationEmail();
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
      return { success: true, verified: freshUser?.emailVerified || false };
    } catch (error: any) {
      return { success: false, verified: false, error: error.message };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
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
    sendVerificationEmail,
    resendVerificationEmail,
    checkEmailVerification,
    resetPassword,
    isAuthenticated: !!user,
    isEmailVerified: user?.emailVerified || false,
  };
}

