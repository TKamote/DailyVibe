import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useHabits } from '../hooks/useHabits';
import { useTheme } from '../lib/theme';
import { getLastNDays } from '../lib/utils';

interface StatsScreenProps {
  navigation: any;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({ navigation }) => {
  const { habits } = useHabits();
  const { theme, setThemeMode } = useTheme();

  const handleThemeToggle = () => {
    // Toggle between light and dark only
    if (theme.mode === 'light') {
      setThemeMode('dark');
    } else {
      setThemeMode('light');
    }
  };

  const stats = useMemo(() => {
    const last30Days = getLastNDays(30);
    const totalHabits = habits.length;
    
    if (totalHabits === 0) {
      return {
        totalHabits: 0,
        totalCompletions: 0,
        completionRate: 0,
        averageStreak: 0,
        longestStreak: 0,
        bestHabit: null,
      };
    }

    let totalCompletions = 0;
    let totalStreaks = 0;
    let longestStreak = 0;
    let bestHabit = habits[0];

    habits.forEach((habit) => {
      // Count completions in last 30 days
      const recentCompletions = habit.completedDates.filter(date => 
        last30Days.includes(date)
      ).length;
      totalCompletions += recentCompletions;

      // Track streaks
      totalStreaks += habit.currentStreak;
      if (habit.currentStreak > longestStreak) {
        longestStreak = habit.currentStreak;
      }
      if (habit.longestStreak > longestStreak) {
        longestStreak = habit.longestStreak;
      }

      // Find best habit (highest current streak)
      if (habit.currentStreak > (bestHabit?.currentStreak || 0)) {
        bestHabit = habit;
      }
    });

    const possibleCompletions = totalHabits * 30;
    const completionRate = possibleCompletions > 0 
      ? Math.round((totalCompletions / possibleCompletions) * 100) 
      : 0;
    const averageStreak = totalHabits > 0 ? Math.round(totalStreaks / totalHabits) : 0;

    return {
      totalHabits,
      totalCompletions,
      completionRate,
      averageStreak,
      longestStreak,
      bestHabit,
    };
  }, [habits]);

  const StatCard: React.FC<{ title: string; value: string | number; subtitle?: string; color?: string }> = ({ 
    title, 
    value, 
    subtitle,
    color = theme.colors.primary 
  }) => (
    <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
      <Text style={[styles.statValue, { color: color }]}>{value}</Text>
      {subtitle && (
        <Text style={[styles.statSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
      )}
    </View>
  );

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

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={[styles.pageTitle, { color: theme.colors.text }]}>Statistics</Text>
          <Text style={[styles.introText, { color: theme.colors.textSecondary }]}>
            Your habit tracking insights
          </Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Habits"
            value={stats.totalHabits}
            subtitle="Active habits"
          />
          <StatCard
            title="Completion Rate"
            value={`${stats.completionRate}%`}
            subtitle="Last 30 days"
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title="Total Completions"
            value={stats.totalCompletions}
            subtitle="Last 30 days"
          />
          <StatCard
            title="Average Streak"
            value={`${stats.averageStreak} days`}
            subtitle="Across all habits"
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title="Longest Streak"
            value={`${stats.longestStreak} days`}
            subtitle="Your best streak"
            color="#10B981"
          />
        </View>

        {stats.bestHabit && (
          <View style={[styles.bestHabitCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.bestHabitTitle, { color: theme.colors.text }]}>🔥 Best Performing Habit</Text>
            <View style={styles.bestHabitContent}>
              <View style={[styles.bestHabitColor, { backgroundColor: stats.bestHabit.color }]} />
              <View style={styles.bestHabitInfo}>
                <Text style={[styles.bestHabitName, { color: theme.colors.text }]}>{stats.bestHabit.name}</Text>
                <Text style={[styles.bestHabitStreak, { color: theme.colors.textSecondary }]}>
                  {stats.bestHabit.currentStreak} day streak
                </Text>
              </View>
            </View>
          </View>
        )}

        {stats.totalHabits === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>No data yet</Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
              Start tracking habits to see your statistics
            </Text>
          </View>
        )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
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
  scrollView: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  content: {
    padding: 16,
  },
  introText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
  },
  bestHabitCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  bestHabitTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  bestHabitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bestHabitColor: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  bestHabitInfo: {
    flex: 1,
  },
  bestHabitName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  bestHabitStreak: {
    fontSize: 14,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
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
});

