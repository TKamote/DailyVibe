import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  AppState,
  AppStateStatus,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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
  const { sendVerificationCode, verifyEmailWithCode, checkEmailVerification, user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [code, setCode] = useState('');
  const [displayEmail, setDisplayEmail] = useState(email || user?.email || '');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Null user protection: redirect to Login if user becomes null (prevents sign-out loop)
  useEffect(() => {
    if (!user) {
      stopPolling();
      navigation.replace('Login');
    }
  }, [user, navigation]);

  useEffect(() => {
    if (user?.email && !displayEmail) {
      setDisplayEmail(user.email);
    }
  }, [user]);

  // Cleanup function to stop polling
  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Start polling for verification status
  const startPolling = () => {
    if (!user || user.emailVerified) {
      // If already verified, check once and return
      if (user?.emailVerified) {
        checkEmailVerification();
      }
      return;
    }

    // Reset start time when starting new polling session
    startTimeRef.current = Date.now();

    // Stop polling after 15 minutes to prevent infinite polling
    timeoutRef.current = setTimeout(() => {
      stopPolling();
    }, 15 * 60 * 1000); // 15 minutes

    // Poll every 3 seconds, but only if app is active
    // This will detect verification even if user verified on another device
    // because checkEmailVerification() calls reload() to fetch latest status from Firebase
    intervalRef.current = setInterval(async () => {
      // Only poll if app is in foreground
      if (appStateRef.current === 'active') {
        const result = await checkEmailVerification();
        if (result.success && result.verified) {
          stopPolling();
          // Navigation will happen automatically via RootNavigator
        }
      }
    }, 3000);
  };

  // Listen to app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      appStateRef.current = nextAppState;
      
      if (nextAppState === 'active') {
        // App came to foreground - check immediately (handles verification from another device)
        // and resume polling if needed
        if (user && !user.emailVerified) {
          checkEmailVerification().then((result) => {
            if (!result.success || !result.verified) {
              // Not verified yet, resume polling if not already polling
              if (!intervalRef.current) {
                startPolling();
              }
            }
          });
        }
      } else {
        // App went to background - stop polling to save battery
        stopPolling();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      stopPolling();
    };
  }, [user, checkEmailVerification]);

  // Only poll when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Check immediately when screen is focused (handles verification from another device)
      if (user) {
        if (user.emailVerified) {
          checkEmailVerification();
        } else {
          // Start polling when screen is focused
          startPolling();
        }
      }

      // Cleanup when screen loses focus
      return () => {
        stopPolling();
      };
    }, [user, checkEmailVerification])
  );

  const handleResendCode = async () => {
    if (!user) {
      navigation.replace('Login');
      return;
    }

    setLoading(true);
    const result = await sendVerificationCode();
    setLoading(false);

    if (result.success) {
      setEmailSent(true);
      setCode(''); // Clear code input
      Alert.alert('Success', 'Verification code sent! Please check your email.');
    } else {
      if (result.error === 'RATE_LIMIT_EXCEEDED') {
        Alert.alert('Rate Limit', result.message || 'Too many requests. Please wait before trying again.');
      } else {
        Alert.alert('Error', result.error || 'Failed to send verification code. Please try again.');
      }
    }
  };

  const handleVerifyCode = async () => {
    if (!user) {
      navigation.replace('Login');
      return;
    }

    // Validate code format (6 digits)
    const codeDigits = code.replace(/\D/g, ''); // Remove non-digits
    if (codeDigits.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit verification code.');
      return;
    }

    setVerifying(true);
    const result = await verifyEmailWithCode(codeDigits);
    setVerifying(false);

    if (result.success) {
      // Check verification status immediately
      await checkEmailVerification();
      
      // Show success message briefly, then navigation will happen automatically
      Alert.alert('Success', 'Your email has been verified! Redirecting to the app...', [
        {
          text: 'OK',
          onPress: () => {
            // Navigation will happen automatically via RootNavigator
            // The polling in RootNavigator will detect the verification status change
          },
        },
      ]);
    } else {
      Alert.alert('Verification Failed', result.error || 'Invalid verification code. Please try again.');
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? You can sign in again after verifying your email.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            stopPolling();
            const result = await logout();
            if (result.success) {
              navigation.replace('Login');
            } else {
              Alert.alert('Error', result.error || 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  // Show loading state if user is null (will redirect via useEffect)
  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

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
            We've sent a 6-digit verification code to your email. Please enter it below to verify your account.
          </Text>
        </View>

        {emailSent && (
          <View style={[styles.successBanner, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={[styles.successText, { color: theme.colors.primary }]}>
              ✓ Verification code sent!
            </Text>
          </View>
        )}

        <View style={styles.codeInputContainer}>
          <TextInput
            style={[
              styles.codeInput,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                color: theme.colors.text,
              },
            ]}
            value={code}
            onChangeText={(text) => {
              // Only allow digits, max 6 characters
              const digits = text.replace(/\D/g, '').slice(0, 6);
              setCode(digits);
            }}
            placeholder="000000"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus={true}
            textAlign="center"
            selectTextOnFocus
          />
          <Text style={[styles.codeHint, { color: theme.colors.textSecondary }]}>
            Enter the 6-digit code from your email
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: theme.colors.primary,
                opacity: code.length === 6 ? 1 : 0.5,
              },
            ]}
            onPress={handleVerifyCode}
            disabled={verifying || code.length !== 6}
            activeOpacity={0.7}
          >
            {verifying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify Code</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
            onPress={handleResendCode}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
                Resend Code
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            Didn't receive the code? Check your spam folder or try resending.
          </Text>
        </View>

        <View style={styles.footerActions}>
          {user ? (
            <TouchableOpacity
              style={[styles.signOutButton, { borderColor: theme.colors.error }]}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <Text style={[styles.signOutButtonText, { color: theme.colors.error }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.backButton, { borderColor: theme.colors.border }]}
              onPress={() => navigation.replace('Login')}
              activeOpacity={0.7}
            >
              <Text style={[styles.backButtonText, { color: theme.colors.textSecondary }]}>
                Back to Login
              </Text>
            </TouchableOpacity>
          )}
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
  codeInputContainer: {
    marginBottom: 24,
  },
  codeInput: {
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 8,
    marginBottom: 8,
  },
  codeHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
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
  footerActions: {
    marginTop: 16,
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  signOutButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'center',
  },
  signOutButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

