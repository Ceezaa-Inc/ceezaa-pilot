import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '@/design/tokens/colors';
import { borderRadius } from '@/design/tokens/borderRadius';
import { typography } from '@/design/tokens/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
  onPress?: () => void;
  testID?: string;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  onPress,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    const sizeStyles: Record<ButtonSize, ViewStyle> = {
      sm: { paddingVertical: 10, paddingHorizontal: 20, minHeight: 40 },
      md: { paddingVertical: 14, paddingHorizontal: 28, minHeight: 52 },
      lg: { paddingVertical: 18, paddingHorizontal: 36, minHeight: 60 },
    };

    const variantStyles: Record<ButtonVariant, ViewStyle> = {
      primary: { backgroundColor: colors.primary.DEFAULT },
      secondary: {
        backgroundColor: colors.transparent,
        borderWidth: 1,
        borderColor: colors.dark.border,
      },
      ghost: { backgroundColor: colors.transparent },
      danger: { backgroundColor: colors.error },
    };

    return [
      baseStyle,
      sizeStyles[size],
      variantStyles[variant],
      fullWidth ? { width: '100%' } : {},
      isDisabled ? { opacity: 0.5 } : {},
    ];
  };

  const getTextColor = (): string => {
    const variantColors: Record<ButtonVariant, string> = {
      primary: colors.navy,
      secondary: colors.text.primary,
      ghost: colors.text.secondary,
      danger: colors.white,
    };
    return variantColors[variant];
  };

  const getTextStyle = (): TextStyle => {
    const sizeStyles: Record<ButtonSize, TextStyle> = {
      sm: { fontSize: typography.fontSize.sm },
      md: { fontSize: typography.fontSize.base },
      lg: { fontSize: typography.fontSize.lg },
    };

    return {
      fontWeight: '600',
      textAlign: 'center',
      color: getTextColor(),
      ...sizeStyles[size],
    };
  };

  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.8}
      disabled={isDisabled}
      onPress={onPress}
      style={getButtonStyle()}
    >
      {loading ? (
        <ActivityIndicator
          testID="button-loading"
          color={getTextColor()}
          size="small"
        />
      ) : children ? (
        <View>{children}</View>
      ) : (
        <Text style={getTextStyle()} numberOfLines={1}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

export default Button;
