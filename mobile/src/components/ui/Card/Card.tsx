import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { colors } from '@/design/tokens/colors';
import { borderRadius } from '@/design/tokens/borderRadius';
import { layoutSpacing } from '@/design/tokens/spacing';
import { shadows } from '@/design/tokens/shadows';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'trust';

export interface CardProps {
  variant?: CardVariant;
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  testID?: string;
}

export function Card({
  variant = 'default',
  children,
  padding = 'md',
  style,
  testID,
}: CardProps) {
  const getCardStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
    };

    const paddingStyles: Record<string, ViewStyle> = {
      none: { padding: 0 },
      sm: { padding: layoutSpacing.sm },
      md: { padding: layoutSpacing.md },
      lg: { padding: layoutSpacing.lg },
    };

    const variantStyles: Record<CardVariant, ViewStyle> = {
      default: {
        backgroundColor: colors.dark.surface,
      },
      elevated: {
        backgroundColor: colors.dark.surface,
        ...shadows.md,
      },
      outlined: {
        backgroundColor: colors.transparent,
        borderWidth: 1,
        borderColor: colors.dark.border,
      },
      trust: {
        backgroundColor: colors.trust.background,
      },
    };

    return [baseStyle, paddingStyles[padding], variantStyles[variant], style ?? {}];
  };

  return (
    <View testID={testID} style={getCardStyle()}>
      {children}
    </View>
  );
}

export default Card;
