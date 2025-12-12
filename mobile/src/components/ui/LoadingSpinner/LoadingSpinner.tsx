import React from 'react';
import { ActivityIndicator, View, ViewStyle } from 'react-native';
import { colors } from '@/design/tokens/colors';

export type SpinnerSize = 'small' | 'large';

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  color?: string;
  fullScreen?: boolean;
  testID?: string;
}

export function LoadingSpinner({
  size = 'large',
  color = colors.primary.DEFAULT,
  fullScreen = false,
  testID,
}: LoadingSpinnerProps) {
  const containerStyle: ViewStyle = fullScreen
    ? {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.dark.background,
      }
    : {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      };

  return (
    <View style={containerStyle} testID={testID}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

export default LoadingSpinner;
