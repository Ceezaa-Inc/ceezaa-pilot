import { Stack } from 'expo-router';
import { colors } from '@/design/tokens/colors';

export default function DiscoverLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.dark.background },
      }}
    />
  );
}
