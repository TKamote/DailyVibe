import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Habit } from '../types';

// Get user's habits collection path
const getHabitsCollectionPath = (userId: string) => `users/${userId}/habits`;

/**
 * Save a habit to Firestore
 */
export async function saveHabitToFirestore(userId: string, habit: Habit): Promise<void> {
  try {
    const habitRef = doc(db, getHabitsCollectionPath(userId), habit.id);
    
    // Prepare data, filtering out undefined values (Firestore doesn't allow undefined)
    const habitData: any = {
      id: habit.id,
      name: habit.name,
      color: habit.color,
      createdAt: habit.createdAt,
      completedDates: habit.completedDates,
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
    };
    
    // Only include icon if it's defined
    if (habit.icon !== undefined && habit.icon !== null) {
      habitData.icon = habit.icon;
    }
    
    await setDoc(habitRef, habitData);
  } catch (error) {
    console.error('Error saving habit to Firestore:', error);
    throw error;
  }
}

/**
 * Delete a habit from Firestore
 */
export async function deleteHabitFromFirestore(userId: string, habitId: string): Promise<void> {
  try {
    const habitRef = doc(db, getHabitsCollectionPath(userId), habitId);
    await deleteDoc(habitRef);
  } catch (error) {
    console.error('Error deleting habit from Firestore:', error);
    throw error;
  }
}

/**
 * Load all habits from Firestore
 */
export async function loadHabitsFromFirestore(userId: string): Promise<Habit[]> {
  try {
    const habitsRef = collection(db, getHabitsCollectionPath(userId));
    const snapshot = await getDocs(habitsRef);
    
    const habits: Habit[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      habits.push({
        id: doc.id,
        name: data.name,
        color: data.color,
        icon: data.icon || undefined, // Only include if it exists
        createdAt: data.createdAt,
        completedDates: data.completedDates || [],
        currentStreak: data.currentStreak || 0,
        longestStreak: data.longestStreak || 0,
      } as Habit);
    });
    
    return habits;
  } catch (error) {
    console.error('Error loading habits from Firestore:', error);
    return [];
  }
}

/**
 * Subscribe to real-time updates for user's habits
 * Returns an unsubscribe function
 */
export function subscribeToHabits(
  userId: string,
  callback: (habits: Habit[]) => void
): () => void {
  const habitsRef = collection(db, getHabitsCollectionPath(userId));
  
  return onSnapshot(habitsRef, (snapshot) => {
    const habits: Habit[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      habits.push({
        id: doc.id,
        name: data.name,
        color: data.color,
        icon: data.icon || undefined, // Only include if it exists
        createdAt: data.createdAt,
        completedDates: data.completedDates || [],
        currentStreak: data.currentStreak || 0,
        longestStreak: data.longestStreak || 0,
      } as Habit);
    });
    callback(habits);
  }, (error) => {
    console.error('Error in habits subscription:', error);
  });
}

/**
 * Delete all habits for a user (used for account deletion)
 */
export async function deleteAllUserHabits(userId: string): Promise<void> {
  try {
    const habitsRef = collection(db, getHabitsCollectionPath(userId));
    const snapshot = await getDocs(habitsRef);
    
    // Delete all habits
    const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting all user habits:', error);
    throw error;
  }
}

