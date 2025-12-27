import React from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../lib/theme';
import { useAuth } from '../hooks/useAuth';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { theme, setThemeMode } = useTheme();
  const { logout, deleteAccount, user } = useAuth();

  const handleThemeToggle = () => {
    // Toggle between light and dark only
    if (theme.mode === 'light') {
      setThemeMode('dark');
    } else {
      setThemeMode('light');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const result = await logout();
            if (!result.success) {
              Alert.alert('Error', result.error || 'Failed to sign out');
            }
            // Navigation will happen automatically via auth state change
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your habit data. This action cannot be undone.\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            // Second confirmation
            Alert.alert(
              'Final Confirmation',
              'This will permanently delete everything. This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async () => {
                    const result = await deleteAccount();
                    if (result.success) {
                      Alert.alert('Account Deleted', 'Your account and all data have been permanently deleted.');
                      // Navigation will happen automatically via auth state change
                    } else {
                      Alert.alert('Error', result.error || 'Failed to delete account');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
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

      <View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
        {user && (
          <View style={[styles.accountInfo, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.accountLabel, { color: theme.colors.textSecondary }]}>
              Signed in as:
            </Text>
            <Text style={[styles.accountEmail, { color: theme.colors.text }]}>
              {user.email}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.signOutButton, { borderColor: theme.colors.border }]}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, { color: theme.colors.text }]}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.deleteButton, { borderColor: theme.colors.error }]}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, { color: theme.colors.error }]}>
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.warning, { color: theme.colors.textSecondary }]}>
          Deleting your account will permanently remove all your habits and data. This cannot be undone.
        </Text>
      </View>
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
  content: {
    flex: 1,
    padding: 20,
    margin: 16,
    borderRadius: 12,
  },
  accountInfo: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  accountLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 16,
    fontWeight: '500',
  },
  actions: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  signOutButton: {
    backgroundColor: 'transparent',
  },
  deleteButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  warning: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

