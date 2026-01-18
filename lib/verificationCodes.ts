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
