import * as Linking from 'expo-linking';

export interface DeepLinkParams {
  mode: 'verifyEmail';
  oobCode: string;
  continueUrl?: string;
}

/**
 * Parse deep link URL to extract Firebase email verification parameters
 * Expected format: dailyvibe://verify-email?mode=verifyEmail&oobCode=xxx
 */
export function parseDeepLink(url: string): DeepLinkParams | null {
  try {
    const parsed = Linking.parse(url);
    
    const path = parsed.path || '';
    const queryParams = parsed.queryParams || {};
    
    // Only handle email verification deep links
    // Password reset uses Firebase's default web handler (works on all devices)
    const isVerifyEmail = path.includes('verify-email') || queryParams.mode === 'verifyEmail';
    
    if (!isVerifyEmail) {
      return null;
    }
    
    // Extract oobCode from query params
    const oobCode = queryParams.oobCode as string || queryParams.oobcode as string || queryParams.code as string;
    
    if (!oobCode) {
      return null;
    }
    
    return {
      mode: 'verifyEmail',
      oobCode,
      continueUrl: queryParams.continueUrl as string,
    };
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return null;
  }
}

/**
 * Get initial deep link URL when app is opened via deep link
 */
export async function getInitialURL(): Promise<string | null> {
  try {
    const url = await Linking.getInitialURL();
    return url;
  } catch (error) {
    console.error('Error getting initial URL:', error);
    return null;
  }
}

/**
 * Subscribe to deep link events
 */
export function subscribeToDeepLinks(callback: (url: string) => void): () => void {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    callback(url);
  });
  
  return () => {
    subscription.remove();
  };
}

