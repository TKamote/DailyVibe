import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../lib/theme';
import { Habit } from '../types';
import { getLastNDays, formatDateString, parseDateString } from '../lib/utils';

interface CalendarViewProps {
  habit: Habit;
  days?: number; // Number of days to show (default 30)
}

export const CalendarView: React.FC<CalendarViewProps> = ({ habit, days = 30 }) => {
  const { theme } = useTheme();
  const dateRange = getLastNDays(days);
  const completedDatesSet = new Set(habit.completedDates);

  // Group dates by week
  const weeks: string[][] = [];
  let currentWeek: string[] = [];

  dateRange.forEach((date, index) => {
    const dateObj = parseDateString(date);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday

    // Start a new week on Sunday or at the beginning
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    currentWeek.push(date);

    // Push the last week if we're at the end
    if (index === dateRange.length - 1) {
      weeks.push(currentWeek);
    }
  });

  const getDayLabel = (date: string): string => {
    const dateObj = parseDateString(date);
    return dateObj.getDate().toString();
  };

  const isCompleted = (date: string): boolean => {
    return completedDatesSet.has(date);
  };

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Last {days} Days</Text>
      </View>

      <View style={styles.dayNamesRow}>
        {dayNames.map((day, index) => (
          <View key={index} style={styles.dayNameCell}>
            <Text style={[styles.dayName, { color: theme.colors.textSecondary }]}>{day}</Text>
          </View>
        ))}
      </View>

      <View style={styles.calendar}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map((date, dayIndex) => {
              const completed = isCompleted(date);
              const dayLabel = getDayLabel(date);
              
              return (
                <View
                  key={date}
                  style={[
                    styles.dayCell,
                    completed && [styles.dayCellCompleted, { backgroundColor: habit.color }],
                  ]}
                >
                  <Text
                    style={[
                      styles.dayLabel,
                      { color: completed ? '#fff' : theme.colors.textSecondary },
                    ]}
                  >
                    {dayLabel}
                  </Text>
                </View>
              );
            })}
            {/* Fill empty cells for incomplete weeks */}
            {Array.from({ length: 7 - week.length }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}
          </View>
        ))}
      </View>

      <View style={[styles.legend, { borderTopColor: theme.colors.border }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: habit.color }]} />
          <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotEmpty, { borderColor: theme.colors.border }]} />
          <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Not completed</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendar: {
    marginBottom: 16,
  },
  week: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    margin: 2,
  },
  dayCellCompleted: {
    borderRadius: 4,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendDotEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  legendText: {
    fontSize: 12,
  },
});

