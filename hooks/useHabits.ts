import { useState, useEffect, useCallback, useRef } from 'react';
import { Habit } from '../types';
import { getTodayDateString, calculateStreak, getRandomColor } from '../lib/utils';
import { useAuth } from './useAuth';
import { 
  saveHabitToFirestore, 
  deleteHabitFromFirestore, 
  subscribeToHabits 
} from '../lib/firestore';
import { migrateLocalHabitsToFirestore } from '../lib/migrateToFirestore';

// Create placeholder habits for new users
async function createPlaceholderHabits(userId: string): Promise<void> {
  const placeholderHabits: Habit[] = [
    {
      id: 'placeholder-welcome',
      name: '🎉 Welcome! You\'re on your way to better habits',
      color: '#9CA3AF', // Gray color for placeholder
      createdAt: getTodayDateString(),
      completedDates: [],
      currentStreak: 0,
      longestStreak: 0,
    },
    {
      id: 'placeholder-swipe',
      name: '👋 Swipe me away when you\'re ready! (Swipe left ←)',
      color: '#9CA3AF', // Gray color for placeholder
      createdAt: getTodayDateString(),
      completedDates: [],
      currentStreak: 0,
      longestStreak: 0,
    },
    {
      id: 'placeholder-guide',
      name: '💡 Pro tip: Visit the Guide tab to learn more',
      color: '#9CA3AF', // Gray color for placeholder
      createdAt: getTodayDateString(),
      completedDates: [],
      currentStreak: 0,
      longestStreak: 0,
    },
  ];
  
  try {
    // Create all 3 placeholder habits
    for (const habit of placeholderHabits) {
      await saveHabitToFirestore(userId, habit);
    }
  } catch (error) {
    console.error('Error creating placeholder habits:', error);
  }
}

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const hasMigrated = useRef(false);

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    if (!user) {
      setHabits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Migrate local habits to Firestore on first login (one-time)
    if (!hasMigrated.current) {
      migrateLocalHabitsToFirestore(user.uid).then(() => {
        hasMigrated.current = true;
      });
    }
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToHabits(user.uid, async (firestoreHabits) => {
      // Recalculate streaks for all habits
      const habitsWithStreaks = firestoreHabits.map(habit => ({
        ...habit,
        currentStreak: calculateStreak(habit.completedDates),
      }));
      
      // Check if placeholders already exist
      const hasPlaceholders = habitsWithStreaks.some(h => 
        h.id === 'placeholder-welcome' || 
        h.id === 'placeholder-swipe' || 
        h.id === 'placeholder-guide'
      );
      
      // If user has no habits and migration is complete, add placeholder habits
      if (habitsWithStreaks.length === 0 && hasMigrated.current && !hasPlaceholders) {
        await createPlaceholderHabits(user.uid);
        // Don't set habits yet, let the subscription update with the new placeholders
        return;
      }
      
      setHabits(habitsWithStreaks);
      setLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // Save a single habit to Firestore
  const saveHabit = useCallback(async (habit: Habit) => {
    if (!user) throw new Error('User must be logged in');
    
    try {
      await saveHabitToFirestore(user.uid, habit);
      // State will update automatically via the subscription
    } catch (error) {
      console.error('Error saving habit:', error);
      throw error;
    }
  }, [user]);

  // Add a new habit
  const addHabit = useCallback(async (name: string, color?: string) => {
    if (!user) throw new Error('User must be logged in');
    
    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
      color: color || getRandomColor(),
      createdAt: getTodayDateString(),
      completedDates: [],
      currentStreak: 0,
      longestStreak: 0,
    };

    await saveHabit(newHabit);
    return newHabit;
  }, [user, saveHabit]);

  // Update a habit
  const updateHabit = useCallback(async (id: string, updates: Partial<Habit>) => {
    if (!user) throw new Error('User must be logged in');
    
    const habit = habits.find(h => h.id === id);
    if (!habit) throw new Error('Habit not found');

    const updatedHabit = { ...habit, ...updates };
    await saveHabit(updatedHabit);
  }, [user, habits, saveHabit]);

  // Delete a habit
  const deleteHabit = useCallback(async (id: string) => {
    if (!user) throw new Error('User must be logged in');
    
    await deleteHabitFromFirestore(user.uid, id);
    // State will update automatically via the subscription
  }, [user]);

  // Toggle habit completion for today
  const toggleHabitCompletion = useCallback(async (id: string) => {
    const today = getTodayDateString();
    const habit = habits.find(h => h.id === id);
    
    if (!habit) return;

    const isCompleted = habit.completedDates.includes(today);
    let updatedCompletedDates: string[];

    if (isCompleted) {
      // Remove today's completion
      updatedCompletedDates = habit.completedDates.filter(date => date !== today);
    } else {
      // Add today's completion
      updatedCompletedDates = [...habit.completedDates, today];
    }

    // Recalculate streaks
    const currentStreak = calculateStreak(updatedCompletedDates);
    const longestStreak = Math.max(habit.longestStreak, currentStreak);

    await updateHabit(id, {
      completedDates: updatedCompletedDates,
      currentStreak,
      longestStreak,
    });
  }, [habits, updateHabit]);

  // Refresh habits (reloads from Firestore)
  const refreshHabits = useCallback(async () => {
    // Real-time subscription handles updates automatically
    // This is kept for compatibility but doesn't need to do anything
  }, []);

  return {
    habits,
    loading,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    refreshHabits,
  };
}

