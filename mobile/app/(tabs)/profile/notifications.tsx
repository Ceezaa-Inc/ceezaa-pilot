import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { Typography, Card } from '@/components/ui';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

const INITIAL_SETTINGS: NotificationSetting[] = [
  {
    id: 'daily_insights',
    title: 'Daily Insights',
    description: 'Get personalized dining insights each morning',
    enabled: true,
  },
  {
    id: 'streak_milestones',
    title: 'Streak Milestones',
    description: 'Celebrate when you hit dining streaks',
    enabled: true,
  },
  {
    id: 'session_invites',
    title: 'Session Invites',
    description: 'When friends invite you to plan together',
    enabled: true,
  },
  {
    id: 'voting_reminders',
    title: 'Voting Reminders',
    description: 'Remind you to vote on active sessions',
    enabled: false,
  },
  {
    id: 'new_venues',
    title: 'New Venue Recommendations',
    description: 'Weekly picks based on your taste',
    enabled: true,
  },
  {
    id: 'spend_alerts',
    title: 'Spending Alerts',
    description: 'When you exceed your dining budget',
    enabled: false,
  },
];

export default function NotificationsScreen() {
  const [settings, setSettings] = useState(INITIAL_SETTINGS);

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Typography variant="body" color="primary">
              ← Back
            </Typography>
          </TouchableOpacity>
          <Typography variant="h2" color="primary">
            Notifications
          </Typography>
          <Typography variant="body" color="secondary">
            Control how and when Ceezaa reaches out
          </Typography>
        </View>

        {/* Settings List */}
        <View style={styles.settingsList}>
          {settings.map((setting) => (
            <Card key={setting.id} variant="default" padding="md">
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Typography variant="body" color="primary">
                    {setting.title}
                  </Typography>
                  <Typography variant="caption" color="muted">
                    {setting.description}
                  </Typography>
                </View>
                <Switch
                  value={setting.enabled}
                  onValueChange={() => toggleSetting(setting.id)}
                  trackColor={{ false: colors.dark.border, true: colors.primary.muted }}
                  thumbColor={setting.enabled ? colors.primary.DEFAULT : colors.text.muted}
                />
              </View>
            </Card>
          ))}
        </View>

        {/* Info */}
        <Typography variant="caption" color="muted" align="center">
          You can change these settings anytime. Notifications help you stay connected with your
          dining community.
        </Typography>
      </ScrollView>
    </SafeAreaView>
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
    gap: layoutSpacing.sm,
  },
  backButton: {
    marginBottom: layoutSpacing.xs,
  },
  settingsList: {
    gap: layoutSpacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.md,
  },
  settingInfo: {
    flex: 1,
    gap: 2,
  },
});
