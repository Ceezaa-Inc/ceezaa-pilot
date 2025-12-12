import React from 'react';
import { Image, ImageStyle, ViewStyle } from 'react-native';

export type LogoVariant = 'full' | 'emblem';

export interface LogoProps {
  variant?: LogoVariant;
  size?: number;
  style?: ViewStyle | ImageStyle;
  testID?: string;
}

// Import logo images
const logoFull = require('../../../../assets/logos/logo-full.png');
const logoEmblem = require('../../../../assets/logos/emblem.png');

export function Logo({
  variant = 'full',
  size = 60,
  style,
  testID = 'logo',
}: LogoProps) {
  if (variant === 'emblem') {
    // Emblem aspect ratio: 974x743 = 1.31
    const emblemAspect = 974 / 743;
    return (
      <Image
        source={logoEmblem}
        style={[{ width: size * emblemAspect, height: size }, style]}
        resizeMode="contain"
        testID={testID}
      />
    );
  }

  // Full logo: 1642x310 = 5.3
  const aspectRatio = 1642 / 310;
  return (
    <Image
      source={logoFull}
      style={[{ width: size * aspectRatio, height: size }, style]}
      resizeMode="contain"
      testID={testID}
    />
  );
}
