import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useHabits } from '../hooks/useHabits';
import { useTheme } from '../lib/theme';
import { HabitCard } from '../components/HabitCard';
import { Habit } from '../types';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { habits, loading, toggleHabitCompletion, deleteHabit, refreshHabits, currentDate } = useHabits();
  const { theme, setThemeMode } = useTheme();
  
  // currentDate is used here to ensure component re-renders when date changes
  // This causes all HabitCards to recalculate "today" when a new day starts
  // The currentDate value itself isn't used, but accessing it ensures re-render on change

  // Reload habits when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshHabits();
    }, [refreshHabits])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const handleAddHabit = () => {
    navigation.navigate('AddHabit');
  };

  const handleThemeToggle = () => {
    // Toggle between light and dark only
    if (theme.mode === 'light') {
      setThemeMode('dark');
    } else {
      setThemeMode('light');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={styles.headerLogoWrapper}>
              <Image
                source={require('../assets/icon.png')}
                style={styles.headerLogo}
                resizeMode="cover"
              />
            </View>
            <Text style={[styles.title, { color: theme.colors.primary }]}>DailyVibe</Text>
          </View>
          <TouchableOpacity onPress={handleThemeToggle} activeOpacity={0.7}>
            <Text style={[styles.headerIcon, { color: theme.colors.text }]}>
              {theme.mode === 'light' ? '🌓' : '🌙'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentHeader}>
        <Text style={[styles.introText, { color: theme.colors.textSecondary }]}>
          Build better habits, one day at a time
        </Text>
      </View>

      {habits.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>No habits yet</Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>Tap the + button to add your first habit</Text>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HabitCard
              habit={item}
              onToggle={() => toggleHabitCompletion(item.id)}
              onPress={() => {
                navigation.navigate('EditHabit', { habit: item });
              }}
              onEdit={() => {
                navigation.navigate('EditHabit', { habit: item });
              }}
              onDelete={async () => {
                await deleteHabit(item.id);
              }}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddHabit}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerLogoWrapper: {
    width: 40,
    height: 40,
    marginRight: 12,
    borderRadius: 20, // 50% of width/height
    overflow: 'hidden',
  },
  headerLogo: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  headerIcon: {
    fontSize: 24,
    padding: 4,
  },
  contentHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  introText: {
    fontSize: 16,
    lineHeight: 22,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
    lineHeight: 32,
  },
});

