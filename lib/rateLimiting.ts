import AsyncStorage from '@react-native-async-storage/async-storage';

const PASSWORD_RESET_STORAGE_KEY = '@dailyvibe:password_reset_requests';
const VERIFICATION_CODE_STORAGE_KEY = '@dailyvibe:verification_code_requests';
const MAX_RESETS_PER_24_HOURS = 3;
const MAX_VERIFICATION_CODES_PER_24_HOURS = 5;
const HOURS_24_IN_MS = 24 * 60 * 60 * 1000;

interface ResetRequest {
  timestamp: number;
  email: string;
}

/**
 * Check if user can request password reset (rate limiting: 3 per 24 hours)
 * @param email - User's email address
 * @returns Object with canRequest flag and timeUntilNextReset in milliseconds
 */
export async function checkPasswordResetRateLimit(
  email: string
): Promise<{ canRequest: boolean; timeUntilNextReset: number | null; message: string | null }> {
  try {
    const stored = await AsyncStorage.getItem(PASSWORD_RESET_STORAGE_KEY);
    const requests: ResetRequest[] = stored ? JSON.parse(stored) : [];

    // Filter requests for this email in the last 24 hours
    const now = Date.now();
    const recentRequests = requests.filter(
      (req) => req.email.toLowerCase() === email.toLowerCase() && now - req.timestamp < HOURS_24_IN_MS
    );

    // Check if limit reached
    if (recentRequests.length >= MAX_RESETS_PER_24_HOURS) {
      // Find the oldest request in the 24-hour window
      const oldestRequest = recentRequests.reduce((oldest, req) =>
        req.timestamp < oldest.timestamp ? req : oldest
      );
      const timeUntilNextReset = HOURS_24_IN_MS - (now - oldestRequest.timestamp);
      const hoursUntilReset = Math.ceil(timeUntilNextReset / (60 * 60 * 1000));

      return {
        canRequest: false,
        timeUntilNextReset,
        message: `You've reached the limit of ${MAX_RESETS_PER_24_HOURS} password reset requests per 24 hours. Please wait ${hoursUntilReset} hour${hoursUntilReset > 1 ? 's' : ''} before requesting another.`,
      };
    }

    return {
      canRequest: true,
      timeUntilNextReset: null,
      message: null,
    };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // On error, allow the request (fail open)
    return {
      canRequest: true,
      timeUntilNextReset: null,
      message: null,
    };
  }
}

/**
 * Record a password reset request
 * @param email - User's email address
 */
export async function recordPasswordResetRequest(email: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(PASSWORD_RESET_STORAGE_KEY);
    const requests: ResetRequest[] = stored ? JSON.parse(stored) : [];

    // Add new request
    requests.push({
      timestamp: Date.now(),
      email: email.toLowerCase(),
    });

    // Clean up old requests (older than 24 hours)
    const now = Date.now();
    const recentRequests = requests.filter((req) => now - req.timestamp < HOURS_24_IN_MS);

    // Save updated requests
    await AsyncStorage.setItem(PASSWORD_RESET_STORAGE_KEY, JSON.stringify(recentRequests));
  } catch (error) {
    console.error('Error recording password reset request:', error);
    // Fail silently - rate limiting is not critical
  }
}

/**
 * Check if user can request verification code (rate limiting: 5 per 24 hours)
 * @param email - User's email address
 * @returns Object with canRequest flag and timeUntilNextReset in milliseconds
 */
export async function checkVerificationCodeRateLimit(
  email: string
): Promise<{ canRequest: boolean; timeUntilNextReset: number | null; message: string | null }> {
  try {
    const stored = await AsyncStorage.getItem(VERIFICATION_CODE_STORAGE_KEY);
    const requests: ResetRequest[] = stored ? JSON.parse(stored) : [];

    // Filter requests for this email in the last 24 hours
    const now = Date.now();
    const recentRequests = requests.filter(
      (req) => req.email.toLowerCase() === email.toLowerCase() && now - req.timestamp < HOURS_24_IN_MS
    );

    // Check if limit reached
    if (recentRequests.length >= MAX_VERIFICATION_CODES_PER_24_HOURS) {
      // Find the oldest request in the 24-hour window
      const oldestRequest = recentRequests.reduce((oldest, req) =>
        req.timestamp < oldest.timestamp ? req : oldest
      );
      const timeUntilNextReset = HOURS_24_IN_MS - (now - oldestRequest.timestamp);
      const hoursUntilReset = Math.ceil(timeUntilNextReset / (60 * 60 * 1000));

      return {
        canRequest: false,
        timeUntilNextReset,
        message: `You've reached the limit of ${MAX_VERIFICATION_CODES_PER_24_HOURS} verification code requests per 24 hours. Please wait ${hoursUntilReset} hour${hoursUntilReset > 1 ? 's' : ''} before requesting another.`,
      };
    }

    return {
      canRequest: true,
      timeUntilNextReset: null,
      message: null,
    };
  } catch (error) {
    console.error('Error checking verification code rate limit:', error);
    // On error, allow the request (fail open)
    return {
      canRequest: true,
      timeUntilNextReset: null,
      message: null,
    };
  }
}

/**
 * Record a verification code request
 * @param email - User's email address
 */
export async function recordVerificationCodeRequest(email: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(VERIFICATION_CODE_STORAGE_KEY);
    const requests: ResetRequest[] = stored ? JSON.parse(stored) : [];

    // Add new request
    requests.push({
      timestamp: Date.now(),
      email: email.toLowerCase(),
    });

    // Clean up old requests (older than 24 hours)
    const now = Date.now();
    const recentRequests = requests.filter((req) => now - req.timestamp < HOURS_24_IN_MS);

    // Save updated requests
    await AsyncStorage.setItem(VERIFICATION_CODE_STORAGE_KEY, JSON.stringify(recentRequests));
  } catch (error) {
    console.error('Error recording verification code request:', error);
    // Fail silently - rate limiting is not critical
  }
}
