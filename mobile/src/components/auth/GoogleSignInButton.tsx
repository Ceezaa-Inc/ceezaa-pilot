/**
 * Google Sign-In Button
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors } from '@/design/tokens/colors';
import { borderRadius } from '@/design/tokens/borderRadius';

interface GoogleSignInButtonProps {
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function GoogleSignInButton({ onPress, isLoading, disabled }: GoogleSignInButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, (isLoading || disabled) && styles.buttonDisabled]}
      onPress={onPress}
      disabled={isLoading || disabled}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.text.primary} size="small" />
      ) : (
        <>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>G</Text>
          </View>
          <Text style={styles.label}>Continue with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: borderRadius.full,
    paddingVertical: 14,
    paddingHorizontal: 28,
    minHeight: 52,
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    color: '#4285F4',
    fontWeight: '700',
    fontSize: 14,
  },
  label: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
