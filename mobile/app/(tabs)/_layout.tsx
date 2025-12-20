import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/design/tokens/colors';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    pulse: '◉',
    discover: '◈',
    sessions: '◇',
    vault: '▣',
    profile: '◯',
  };

  return (
    <View style={[styles.iconContainer, focused && styles.iconFocused]}>
      <View style={styles.icon}>
        <View
          style={[
            styles.iconInner,
            { backgroundColor: focused ? colors.primary.DEFAULT : colors.text.muted },
          ]}
        />
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary.DEFAULT,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="pulse"
        options={{
          title: 'Pulse',
          tabBarIcon: ({ focused }) => <TabIcon name="pulse" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ focused }) => <TabIcon name="discover" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'Sessions',
          tabBarIcon: ({ focused }) => <TabIcon name="sessions" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          tabBarIcon: ({ focused }) => <TabIcon name="vault" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.dark.surface,
    borderTopColor: colors.dark.border,
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconFocused: {},
  icon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
