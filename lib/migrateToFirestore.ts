import { storage } from './storage';
import { saveHabitToFirestore } from './firestore';
import { Habit } from '../types';

/**
 * Migrate habits from local AsyncStorage to Firestore
 * This should be called once when user first logs in
 */
export async function migrateLocalHabitsToFirestore(userId: string): Promise<void> {
  try {
    // Load habits from local storage
    const localHabits = await storage.loadHabits();
    
    if (localHabits.length === 0) {
      // No local habits to migrate
      return;
    }

    // Save each habit to Firestore
    for (const habit of localHabits) {
      await saveHabitToFirestore(userId, habit);
    }

    // Clear local storage after successful migration
    await storage.clearHabits();
  } catch (error) {
    console.error('Error migrating habits to Firestore:', error);
    // Don't throw - allow app to continue even if migration fails
  }
}

