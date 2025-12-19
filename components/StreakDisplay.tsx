import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StreakDisplayProps {
  streak: number;
  size?: 'small' | 'medium';
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({ streak, size = 'medium' }) => {
  if (streak === 0) return null;

  const isSmall = size === 'small';
  const fireEmoji = '🔥';

  return (
    <View style={[styles.container, isSmall && styles.containerSmall]}>
      <Text style={[styles.emoji, isSmall && styles.emojiSmall]}>{fireEmoji}</Text>
      <Text style={[styles.streakText, isSmall && styles.streakTextSmall]}>
        {streak} {streak === 1 ? 'day' : 'days'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  containerSmall: {
    marginTop: 2,
  },
  emoji: {
    fontSize: 16,
    marginRight: 4,
  },
  emojiSmall: {
    fontSize: 12,
    marginRight: 2,
  },
  streakText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  streakTextSmall: {
    fontSize: 12,
  },
});

