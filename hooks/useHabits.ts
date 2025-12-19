import { useState, useEffect, useCallback } from 'react';
import { Habit } from '../types';
import { storage } from '../lib/storage';
import { getTodayDateString, calculateStreak, getRandomColor } from '../lib/utils';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  // Load habits from storage on mount
  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = useCallback(async () => {
    try {
      setLoading(true);
      const loadedHabits = await storage.loadHabits();
      // Recalculate streaks for all habits
      const habitsWithStreaks = loadedHabits.map(habit => ({
        ...habit,
        currentStreak: calculateStreak(habit.completedDates),
      }));
      setHabits(habitsWithStreaks);
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save habits to storage
  const saveHabits = async (updatedHabits: Habit[]) => {
    try {
      await storage.saveHabits(updatedHabits);
      setHabits(updatedHabits);
    } catch (error) {
      console.error('Error saving habits:', error);
      throw error;
    }
  };

  // Add a new habit
  const addHabit = useCallback(async (name: string, color?: string) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
      color: color || getRandomColor(),
      createdAt: getTodayDateString(),
      completedDates: [],
      currentStreak: 0,
      longestStreak: 0,
    };

    const updatedHabits = [...habits, newHabit];
    await saveHabits(updatedHabits);
    return newHabit;
  }, [habits]);

  // Update a habit
  const updateHabit = useCallback(async (id: string, updates: Partial<Habit>) => {
    const updatedHabits = habits.map(habit =>
      habit.id === id ? { ...habit, ...updates } : habit
    );
    await saveHabits(updatedHabits);
  }, [habits]);

  // Delete a habit
  const deleteHabit = useCallback(async (id: string) => {
    const updatedHabits = habits.filter(habit => habit.id !== id);
    await saveHabits(updatedHabits);
  }, [habits]);

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

  return {
    habits,
    loading,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    refreshHabits: loadHabits,
  };
}

