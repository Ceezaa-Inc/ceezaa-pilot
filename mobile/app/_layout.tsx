import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { colors } from '@/design/tokens/colors';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.dark.background }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.dark.background },
          animation: 'slide_from_right',
        }}
      />
    </View>
  );
}
