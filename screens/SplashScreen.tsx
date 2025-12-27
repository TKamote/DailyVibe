import React from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useTheme } from '../lib/theme';

export const BrandedSplashScreen: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('../assets/icon.png')}
            style={styles.logo}
            resizeMode="cover"
          />
        </View>
        
        <Text style={[styles.title, { color: theme.colors.text }]}>DailyVibe</Text>
        
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          A habit tracker app
        </Text>
        
        <Text style={[styles.tagline, { color: theme.colors.textSecondary }]}>
          Build better habits, one day at a time
        </Text>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoWrapper: {
    width: 168, // 30% smaller (240 * 0.7)
    height: 168,
    borderRadius: 84, // 50% of width/height
    overflow: 'hidden',
    marginBottom: 24,
  },
  logo: {
    width: 168,
    height: 168,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 12,
    fontWeight: '500',
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  loadingContainer: {
    marginTop: 24,
  },
});

