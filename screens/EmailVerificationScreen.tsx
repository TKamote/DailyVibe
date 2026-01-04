import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../lib/theme';

interface EmailVerificationScreenProps {
  navigation: any;
  email?: string;
}

export const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({ 
  navigation,
  email 
}) => {
  const { theme } = useTheme();
  const { sendVerificationEmail, checkEmailVerification, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [displayEmail, setDisplayEmail] = useState(email || user?.email || '');

  useEffect(() => {
    if (user?.email && !displayEmail) {
      setDisplayEmail(user.email);
    }
  }, [user]);

  const handleResendEmail = async () => {
    setLoading(true);
    const result = await sendVerificationEmail();
    setLoading(false);

    if (result.success) {
      setEmailSent(true);
      Alert.alert('Success', 'Verification email sent! Please check your inbox.');
    } else {
      Alert.alert('Error', result.error || 'Failed to send verification email. Please try again.');
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    const result = await checkEmailVerification();
    setChecking(false);

    if (result.success && result.verified) {
      Alert.alert('Success', 'Your email has been verified! You can now use the app.', [
        {
          text: 'OK',
          onPress: () => {
            // Navigation will happen automatically via auth state change
            // But we can also manually navigate if needed
          },
        },
      ]);
    } else {
      Alert.alert(
        'Not Verified Yet',
        'Your email has not been verified yet. Please check your inbox and click the verification link.'
      );
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={[styles.icon, { color: theme.colors.primary }]}>✉️</Text>
        </View>

        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Verify Your Email
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            We've sent a verification email to
          </Text>
          {displayEmail && (
            <Text style={[styles.email, { color: theme.colors.primary }]}>
              {displayEmail}
            </Text>
          )}
        </View>

        <View style={styles.instructionsContainer}>
          <Text style={[styles.instructions, { color: theme.colors.textSecondary }]}>
            Please check your email and click the verification link to activate your account.
          </Text>
          <Text style={[styles.instructions, { color: theme.colors.textSecondary, marginTop: 12 }]}>
            Once verified, you'll be able to use all features of DailyVibe.
          </Text>
        </View>

        {emailSent && (
          <View style={[styles.successBanner, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={[styles.successText, { color: theme.colors.primary }]}>
              ✓ Verification email sent!
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleCheckVerification}
            disabled={checking}
            activeOpacity={0.7}
          >
            {checking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>I've Verified My Email</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
            onPress={handleResendEmail}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
                Resend Verification Email
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            Didn't receive the email? Check your spam folder or try resending.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 64,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  instructionsContainer: {
    marginBottom: 24,
  },
  instructions: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  successBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    marginBottom: 24,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

