import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  TextInputProps,
  StyleSheet,
  Pressable,
} from 'react-native';
import { colors } from '@/design/tokens/colors';
import { componentRadius } from '@/design/tokens/borderRadius';
import { layoutSpacing } from '@/design/tokens/spacing';
import { typography } from '@/design/tokens/typography';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const borderColor = error
    ? colors.error
    : isFocused
      ? colors.primary.DEFAULT
      : colors.dark.border;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          {
            borderColor,
            backgroundColor: colors.dark.surfaceAlt,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
          ]}
          placeholderTextColor={colors.text.muted}
          selectionColor={colors.primary.DEFAULT}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {rightIcon && (
          <Pressable
            onPress={onRightIconPress}
            style={styles.rightIcon}
            hitSlop={8}
          >
            {rightIcon}
          </Pressable>
        )}
      </View>

      {(error || hint) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.text.muted,
    marginBottom: layoutSpacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: componentRadius.input,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: layoutSpacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  leftIcon: {
    paddingLeft: layoutSpacing.md,
  },
  rightIcon: {
    paddingRight: layoutSpacing.md,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    marginTop: layoutSpacing.xs,
  },
  errorText: {
    color: colors.error,
  },
});

export default Input;
