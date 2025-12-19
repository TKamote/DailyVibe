import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useHabits } from '../hooks/useHabits';
import { useTheme } from '../lib/theme';
import { HabitCard } from '../components/HabitCard';
import { Habit } from '../types';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { habits, loading, toggleHabitCompletion, deleteHabit, refreshHabits } = useHabits();
  const { theme } = useTheme();

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

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleStats = () => {
    navigation.navigate('Stats');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: theme.colors.text }]}>DailyVibe</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Build better habits, one day at a time</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleStats} activeOpacity={0.7}>
              <Text style={[styles.headerIcon, { color: theme.colors.text }]}>📊</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSettings} activeOpacity={0.7}>
              <Text style={[styles.headerIcon, { color: theme.colors.text }]}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>
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
        style={styles.fab}
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
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerIcon: {
    fontSize: 24,
    padding: 4,
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
    backgroundColor: '#3B82F6',
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

