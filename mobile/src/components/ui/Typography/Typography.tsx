import React from 'react';
import { Text, TextStyle, TextProps } from 'react-native';
import { colors } from '@/design/tokens/colors';
import { typography } from '@/design/tokens/typography';

export type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'label';

export type TypographyColor = 'primary' | 'secondary' | 'muted' | 'gold' | 'error' | 'success';

export interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: TypographyColor;
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

export function Typography({
  variant = 'body',
  color = 'primary',
  align = 'left',
  style,
  children,
  ...props
}: TypographyProps) {
  const getTextStyle = (): TextStyle => {
    const variantStyles: Record<TypographyVariant, TextStyle> = {
      h1: {
        fontSize: typography.fontSize['3xl'],
        fontWeight: '700',
        lineHeight: typography.fontSize['3xl'] * 1.2,
      },
      h2: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: '700',
        lineHeight: typography.fontSize['2xl'] * 1.2,
      },
      h3: {
        fontSize: typography.fontSize.xl,
        fontWeight: '600',
        lineHeight: typography.fontSize.xl * 1.3,
      },
      h4: {
        fontSize: typography.fontSize.lg,
        fontWeight: '600',
        lineHeight: typography.fontSize.lg * 1.4,
      },
      body: {
        fontSize: typography.fontSize.base,
        fontWeight: '400',
        lineHeight: typography.fontSize.base * 1.5,
      },
      bodySmall: {
        fontSize: typography.fontSize.sm,
        fontWeight: '400',
        lineHeight: typography.fontSize.sm * 1.5,
      },
      caption: {
        fontSize: typography.fontSize.xs,
        fontWeight: '400',
        lineHeight: typography.fontSize.xs * 1.4,
      },
      label: {
        fontSize: typography.fontSize.xs,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      },
    };

    const colorStyles: Record<TypographyColor, TextStyle> = {
      primary: { color: colors.text.primary },
      secondary: { color: colors.text.secondary },
      muted: { color: colors.text.muted },
      gold: { color: colors.primary.DEFAULT },
      error: { color: colors.error },
      success: { color: colors.success },
    };

    return {
      ...variantStyles[variant],
      ...colorStyles[color],
      textAlign: align,
    };
  };

  return (
    <Text style={[getTextStyle(), style]} {...props}>
      {children}
    </Text>
  );
}

export default Typography;
