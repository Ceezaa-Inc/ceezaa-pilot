/**
 * Apple Sign-In Button - Apple HIG Compliant
 * Uses native AppleAuthenticationButton on iOS
 */

import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { colors } from '@/design/tokens/colors';
import { borderRadius } from '@/design/tokens/borderRadius';
import { isExpoGo } from '@/config';

// Conditionally import Apple authentication
let AppleAuthentication: typeof import('expo-apple-authentication') | null = null;
if (!isExpoGo && Platform.OS === 'ios') {
  try {
    AppleAuthentication = require('expo-apple-authentication');
  } catch {
    // Not available
  }
}

interface AppleSignInButtonProps {
  onPress: () => void;
  isLoading?: boolean;
}

export function AppleSignInButton({ onPress, isLoading }: AppleSignInButtonProps) {
  // Only render on iOS when Apple auth is available
  if (Platform.OS !== 'ios' || isExpoGo || !AppleAuthentication) {
    return null;
  }

  return (
    <View style={styles.container}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
        cornerRadius={borderRadius.full}
        style={styles.button}
        onPress={onPress}
      />
      {isLoading && <View style={styles.loadingOverlay} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  button: {
    height: 52,
    width: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: borderRadius.full,
  },
});
