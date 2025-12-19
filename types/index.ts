export interface Habit {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: string;
  completedDates: string[]; // Array of date strings in YYYY-MM-DD format
  currentStreak: number;
  longestStreak: number;
}

export interface HabitCompletion {
  habitId: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
}

export type Theme = 'light' | 'dark' | 'auto';

