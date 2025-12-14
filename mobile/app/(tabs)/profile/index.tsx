import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card, Button } from '@/components/ui';

const MENU_ITEMS = [
  { icon: '💳', label: 'Linked Cards', subtitle: '1 card connected', route: '/(tabs)/profile/cards' },
  { icon: '🔔', label: 'Notifications', subtitle: 'Manage alerts', route: '/(tabs)/profile/notifications' },
  { icon: '🔒', label: 'Privacy', subtitle: 'Control your data', route: '/(tabs)/profile/privacy' },
  { icon: '❓', label: 'Help & Support', subtitle: 'Get assistance', route: null },
];

export default function ProfileScreen() {
  const handleMenuPress = (route: string | null) => {
    if (route) {
      router.push(route as any);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Typography variant="h1">👤</Typography>
          </View>
          <Typography variant="h2" color="primary">
            Alex Johnson
          </Typography>
          <Typography variant="body" color="secondary">
            Member since Dec 2024
          </Typography>
        </View>

        {/* Taste Summary */}
        <Card variant="elevated" padding="lg" style={styles.tasteCard}>
          <View style={styles.tasteHeader}>
            <Typography variant="h4" color="primary">
              Your Taste DNA
            </Typography>
            <TouchableOpacity onPress={() => router.push('/(tabs)/pulse/taste-detail')}>
              <Typography variant="bodySmall" color="gold">
                View full →
              </Typography>
            </TouchableOpacity>
          </View>
          <View style={styles.tasteTraits}>
            <TraitBadge label="Adventurous" value={85} />
            <TraitBadge label="Social" value={72} />
            <TraitBadge label="Refined" value={91} />
          </View>
        </Card>

        {/* Menu Items */}
        <View style={styles.menu}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity key={index} onPress={() => handleMenuPress(item.route)}>
              <Card variant="default" padding="md" style={styles.menuItem}>
                <View style={styles.menuRow}>
                  <View style={styles.menuIcon}>
                    <Typography variant="body">{item.icon}</Typography>
                  </View>
                  <View style={styles.menuText}>
                    <Typography variant="body" color="primary">
                      {item.label}
                    </Typography>
                    <Typography variant="caption" color="muted">
                      {item.subtitle}
                    </Typography>
                  </View>
                  <Typography variant="body" color="muted">
                    →
                  </Typography>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <Button label="Sign Out" variant="ghost" fullWidth onPress={() => {}} />

        <Typography variant="caption" color="muted" align="center">
          Version 1.0.0
        </Typography>
      </ScrollView>
    </SafeAreaView>
  );
}

function TraitBadge({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.traitBadge}>
      <Typography variant="caption" color="secondary">
        {label}
      </Typography>
      <Typography variant="bodySmall" color="gold">
        {value}%
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  content: {
    padding: layoutSpacing.lg,
    gap: layoutSpacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: layoutSpacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary.DEFAULT,
  },
  tasteCard: {
    gap: layoutSpacing.md,
  },
  tasteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tasteTraits: {
    flexDirection: 'row',
    gap: layoutSpacing.sm,
  },
  traitBadge: {
    flex: 1,
    paddingVertical: layoutSpacing.sm,
    paddingHorizontal: layoutSpacing.xs,
    backgroundColor: colors.dark.surfaceAlt,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    gap: 4,
  },
  menu: {
    gap: layoutSpacing.sm,
  },
  menuItem: {},
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    gap: 2,
  },
});
