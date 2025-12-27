import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../lib/theme';

interface GuideScreenProps {
  navigation: any;
}

export const GuideScreen: React.FC<GuideScreenProps> = ({ navigation }) => {
  const { theme, setThemeMode } = useTheme();

  const handleThemeToggle = () => {
    // Toggle between light and dark only
    if (theme.mode === 'light') {
      setThemeMode('dark');
    } else {
      setThemeMode('light');
    }
  };

  const sections = [
    {
      title: 'Getting Started',
      content: [
        'Create an account or sign in to sync your habits across devices',
        'Tap the + button in the bottom right to add your first habit',
        'Choose a name and color for your habit',
        'Tap the checkbox on a habit card to mark it complete each day',
        'Watch your streak grow as you build consistency!',
      ],
    },
    {
      title: 'Navigation',
      content: [
        '🏠 Home: View and manage all your habits',
        '📖 Guide: Access this guide and privacy policy',
        '📊 Stats: See your overall progress and insights',
        '🚪 Sign Out: Tap to sign out (with confirmation)',
        '🌓/🌙 Theme: Tap the icon in the header to toggle light/dark mode',
      ],
    },
    {
      title: 'Building Streaks',
      content: [
        'Complete your habit every day to build a streak',
        'Your current streak shows consecutive days completed',
        'Longest streak tracks your personal best record',
        'Missing a day resets your current streak to zero',
        'View your streak history in the calendar on each habit',
      ],
    },
    {
      title: 'Managing Habits',
      content: [
        'Swipe left on a habit card to reveal edit and delete options',
        'Tap a habit card to view details, calendar, and edit',
        'Use the 30-day calendar to see your completion history',
        'Check the Stats tab to see your overall progress',
        'Your habits sync automatically across all your devices',
      ],
    },
    {
      title: 'App Features',
      content: [
        'Multi-device sync: Your habits sync to all devices when signed in',
        'Theme toggle: Tap 🌓/🌙 in the header to switch light/dark mode',
        'Privacy: See privacy policy below',
        'Offline support: Works offline, syncs when connected',
        'Secure: Your data is encrypted and stored securely',
      ],
    },
    {
      title: 'Tips for Success',
      content: [
        'Start with 1-3 habits, not too many at once',
        'Choose habits you can realistically do daily',
        'Check off habits at the same time each day to build routine',
        'Use the calendar to identify patterns and missed days',
        'Celebrate your streaks to stay motivated',
        'Review your stats weekly to track overall progress',
      ],
    },
  ];

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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.pageTitle, { color: theme.colors.text }]}>User Guide</Text>
        <Text style={[styles.introText, { color: theme.colors.textSecondary }]}>
          Learn how to get the most out of DailyVibe
        </Text>

      {sections.map((section, index) => (
        <View
          key={index}
          style={[
            styles.section,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {section.title}
          </Text>
          {section.content.map((item, itemIndex) => (
            <View key={itemIndex} style={styles.listItem}>
              <Text style={[styles.bullet, { color: theme.colors.primary }]}>•</Text>
              <Text style={[styles.listText, { color: theme.colors.textSecondary }]}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      ))}

      <TouchableOpacity
        style={[
          styles.privacySection,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
        onPress={() => navigation.navigate('PrivacyPolicy')}
        activeOpacity={0.7}
      >
        <View style={styles.privacyHeader}>
          <Text style={[styles.privacyIcon, { color: theme.colors.primary }]}>ℹ️</Text>
          <Text style={[styles.privacyTitle, { color: theme.colors.text }]}>
            Privacy Policy
          </Text>
        </View>
        <Text style={[styles.privacySubtext, { color: theme.colors.textSecondary }]}>
          Learn how we protect your data and privacy
        </Text>
      </TouchableOpacity>
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
  content: {
    padding: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  introText: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  section: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  listText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  privacySection: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 24,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  privacyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  privacyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  privacySubtext: {
    fontSize: 14,
    lineHeight: 20,
  },
});

