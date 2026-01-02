/**
 * Social authentication hook for Google and Apple Sign-In
 */

import { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Crypto from 'expo-crypto';
import { useAuthStore } from '@/stores';
import {
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID,
  isExpoGo,
} from '@/config';

// Conditionally import Apple authentication (only available in dev builds)
let AppleAuthentication: typeof import('expo-apple-authentication') | null = null;
if (!isExpoGo && Platform.OS === 'ios') {
  try {
    AppleAuthentication = require('expo-apple-authentication');
  } catch {
    // Not available in Expo Go
  }
}

// Required for web browser auth flow to complete
WebBrowser.maybeCompleteAuthSession();

interface UseSocialAuthReturn {
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  isGoogleLoading: boolean;
  isAppleLoading: boolean;
  isAppleAvailable: boolean;
}

export function useSocialAuth(): UseSocialAuthReturn {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  const { signInWithGoogle: storeSignInWithGoogle, signInWithApple: storeSignInWithApple } =
    useAuthStore();

  // Check Apple Sign-In availability (iOS 13+ only, not in Expo Go)
  useEffect(() => {
    const checkAppleAvailability = async () => {
      if (Platform.OS === 'ios' && !isExpoGo && AppleAuthentication) {
        try {
          const available = await AppleAuthentication.isAvailableAsync();
          setIsAppleAvailable(available);
        } catch {
          setIsAppleAvailable(false);
        }
      }
    };
    checkAppleAvailability();
  }, []);

  // Google Auth Session setup
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  // Handle Google auth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSuccess(id_token);
    } else if (response?.type === 'error') {
      setIsGoogleLoading(false);
      Alert.alert('Error', 'Google sign-in failed. Please try again.');
    } else if (response?.type === 'dismiss') {
      setIsGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleSuccess = async (idToken: string) => {
    try {
      const success = await storeSignInWithGoogle(idToken);
      if (!success) {
        Alert.alert('Error', 'Failed to complete Google sign-in.');
      }
    } catch (error) {
      console.error('[SocialAuth] Google sign-in error:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSignInWithGoogle = async () => {
    // Check if Google client IDs are configured
    if (!GOOGLE_WEB_CLIENT_ID) {
      Alert.alert(
        'Not Configured',
        'Google Sign-In is not configured yet. Use phone OTP for now.'
      );
      return;
    }

    if (!request) {
      Alert.alert(
        'Not Available',
        'Google Sign-In requires a development build. Use phone OTP for now in Expo Go.'
      );
      return;
    }

    setIsGoogleLoading(true);
    try {
      await promptAsync();
      // Response handled in useEffect above
    } catch (error) {
      console.error('[SocialAuth] Google prompt error:', error);
      setIsGoogleLoading(false);
      Alert.alert('Error', 'Failed to start Google sign-in.');
    }
  };

  const handleSignInWithApple = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Not Available', 'Apple Sign-In is only available on iOS devices.');
      return;
    }

    if (isExpoGo || !AppleAuthentication) {
      Alert.alert(
        'Development Build Required',
        'Apple Sign-In requires a development build. Use phone OTP for now in Expo Go.'
      );
      return;
    }

    if (!isAppleAvailable) {
      Alert.alert('Not Available', 'Apple Sign-In is not available on this device.');
      return;
    }

    setIsAppleLoading(true);

    try {
      // Generate nonce for security
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (credential.identityToken) {
        const success = await storeSignInWithApple(credential.identityToken, rawNonce);
        if (!success) {
          Alert.alert('Error', 'Failed to complete Apple sign-in.');
        }
      } else {
        Alert.alert('Error', 'No identity token received from Apple.');
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User cancelled - don't show error
        console.log('[SocialAuth] Apple sign-in cancelled by user');
      } else {
        console.error('[SocialAuth] Apple sign-in error:', error);
        Alert.alert('Error', 'Apple sign-in failed. Please try again.');
      }
    } finally {
      setIsAppleLoading(false);
    }
  };

  return {
    signInWithGoogle: handleSignInWithGoogle,
    signInWithApple: handleSignInWithApple,
    isGoogleLoading,
    isAppleLoading,
    isAppleAvailable: isAppleAvailable && Platform.OS === 'ios' && !isExpoGo,
  };
}
