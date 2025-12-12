import { Stack } from 'expo-router';
import { colors } from '@/design/tokens/colors';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.dark.background },
        animation: 'slide_from_right',
        gestureEnabled: false, // Prevent going back during onboarding
      }}
    />
  );
}
