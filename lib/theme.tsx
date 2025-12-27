import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'auto';

interface Theme {
  mode: ThemeMode;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    error: string;
  };
}

const lightTheme: Theme['colors'] = {
  background: '#FEFDFB', // Warm off-white instead of cold gray
  surface: '#FFFFFF',
  text: '#0F172A', // Deeper, richer dark blue-gray instead of dull gray
  textSecondary: '#475569', // Warmer slate blue instead of dull gray
  border: '#E2E8F0', // Softer, warmer border
  primary: '#2563EB', // Slightly deeper, more vibrant blue
  error: '#EF4444',
};

const darkTheme: Theme['colors'] = {
  background: '#111827',
  surface: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  border: '#374151',
  primary: '#3B82F6',
  error: '#EF4444',
};

interface ThemeContextType {
  theme: Theme;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@dailyvibe:theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark'); // Default to dark

  useEffect(() => {
    loadThemeMode();
  }, []);

  const loadThemeMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && (savedMode === 'light' || savedMode === 'dark' || savedMode === 'auto')) {
        setThemeModeState(savedMode as ThemeMode);
      }
      // If no saved mode, it will use the default 'dark' from useState
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const getEffectiveTheme = (): 'light' | 'dark' => {
    if (themeMode === 'auto') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  };

  const effectiveTheme = getEffectiveTheme();
  const colors = effectiveTheme === 'dark' ? darkTheme : lightTheme;

  const theme: Theme = {
    mode: themeMode,
    colors,
  };

  // Always render children, even while loading (use default theme)
  return (
    <ThemeContext.Provider value={{ theme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

