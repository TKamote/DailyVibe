import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Habit } from '../types';
import { getTodayDateString, calculateStreak, getRandomColor } from '../lib/utils';
import { useAuth } from './useAuth';
import { 
  saveHabitToFirestore, 
  deleteHabitFromFirestore, 
  subscribeToHabits 
} from '../lib/firestore';
import { migrateLocalHabitsToFirestore } from '../lib/migrateToFirestore';

// Create placeholder habit for new users
async function createPlaceholderHabit(userId: string): Promise<void> {
  const placeholderHabit: Habit = {
    id: 'placeholder-welcome',
    name: '🎉 Welcome to DailyVibe!\n• Swipe left ← to remove this placeholder\n• Check the Guide tab for tips\n• Press the + button to start building your habits today',
    color: '#9CA3AF', // Gray color for placeholder
    createdAt: getTodayDateString(),
    completedDates: [],
    currentStreak: 0,
    longestStreak: 0,
  };
  
  try {
    await saveHabitToFirestore(userId, placeholderHabit);
  } catch (error) {
    console.error('Error creating placeholder habit:', error);
  }
}

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const hasMigrated = useRef(false);
  const lastKnownDate = useRef<string>(getTodayDateString());
  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString());

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    if (!user) {
      setHabits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Migrate local habits to Firestore on first login (one-time)
    let migrationPromise: Promise<void> | null = null;
    if (!hasMigrated.current) {
      migrationPromise = migrateLocalHabitsToFirestore(user.uid).then(() => {
        hasMigrated.current = true;
      });
    }
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToHabits(user.uid, async (firestoreHabits) => {
      // Wait for migration to complete before checking for placeholders
      if (migrationPromise) {
        await migrationPromise;
      }
      
      // Recalculate streaks for all habits
      const habitsWithStreaks = firestoreHabits.map(habit => ({
        ...habit,
        currentStreak: calculateStreak(habit.completedDates),
      }));
      
      // Check if placeholder already exists
      const hasPlaceholder = habitsWithStreaks.some(h => h.id === 'placeholder-welcome');
      
      // If user has no habits and migration is complete, add placeholder habit
      if (habitsWithStreaks.length === 0 && hasMigrated.current && !hasPlaceholder) {
        await createPlaceholderHabit(user.uid);
        // Don't set habits yet, let the subscription update with the new placeholder
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

  // Check if date has changed and force refresh if needed
  const checkDateChange = useCallback(() => {
    const today = getTodayDateString();
    if (today !== lastKnownDate.current) {
      lastKnownDate.current = today;
      // Update currentDate state to force all components to re-render
      setCurrentDate(today);
    }
  }, []);

  // Listen for app state changes to detect when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground, check if date changed
        checkDateChange();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Also check immediately when hook mounts
    checkDateChange();

    return () => {
      subscription.remove();
    };
  }, [checkDateChange]);

  // Periodic check while app is open (to catch midnight transitions)
  useEffect(() => {
    // Check every 60 seconds if date has changed
    const interval = setInterval(() => {
      checkDateChange();
    }, 60000); // Check every minute

    return () => {
      clearInterval(interval);
    };
  }, [checkDateChange]);

  // Refresh habits (reloads from Firestore)
  const refreshHabits = useCallback(async () => {
    // Check for date change when manually refreshing
    checkDateChange();
    // Real-time subscription handles updates automatically
    // This is kept for compatibility but doesn't need to do anything
  }, [checkDateChange]);

  // Expose currentDate so components re-render when date changes
  // When currentDate changes, components will re-render and recalculate "today"
  return {
    habits,
    loading,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    refreshHabits,
    currentDate, // This will change when a new day starts, forcing re-renders
  };
}

