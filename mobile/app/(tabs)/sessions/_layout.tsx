import { Stack } from 'expo-router';
import { colors } from '@/design/tokens/colors';

export default function SessionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.dark.background },
      }}
    />
  );
}
