import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit } from '../types';

const HABITS_STORAGE_KEY = '@dailyvibe:habits';

export const storage = {
  // Save all habits
  async saveHabits(habits: Habit[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(habits);
      await AsyncStorage.setItem(HABITS_STORAGE_KEY, jsonValue);
    } catch (error) {
      console.error('Error saving habits:', error);
      throw error;
    }
  },

  // Load all habits
  async loadHabits(): Promise<Habit[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error loading habits:', error);
      return [];
    }
  },

  // Clear all habits (for testing/reset)
  async clearHabits(): Promise<void> {
    try {
      await AsyncStorage.removeItem(HABITS_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing habits:', error);
      throw error;
    }
  },
};

