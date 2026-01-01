import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { Typography, Card } from '@/components/ui';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore, LocalNotificationPreferences } from '@/stores/useProfileStore';

interface NotificationSettingConfig {
  key: keyof LocalNotificationPreferences;
  title: string;
  description: string;
}

const NOTIFICATION_SETTINGS: NotificationSettingConfig[] = [
  {
    key: 'dailyInsights',
    title: 'Daily Insights',
    description: 'Get personalized dining insights each morning',
  },
  {
    key: 'streakMilestones',
    title: 'Streak Milestones',
    description: 'Celebrate when you hit dining streaks',
  },
  {
    key: 'sessionInvites',
    title: 'Session Invites',
    description: 'When friends invite you to plan together',
  },
  {
    key: 'votingReminders',
    title: 'Voting Reminders',
    description: 'Remind you to vote on active sessions',
  },
  {
    key: 'planConfirmations',
    title: 'Plan Confirmations',
    description: 'When your group picks a spot',
  },
  {
    key: 'marketing',
    title: 'Product Updates',
    description: 'New features and special offers',
  },
];

export default function NotificationsScreen() {
  const { user } = useAuthStore();
  const {
    notifications,
    isLoading,
    isUpdating,
    fetchNotifications,
    updateNotification,
    hasFetchedNotifications,
  } = useProfileStore();

  // Fetch notifications on mount
  useEffect(() => {
    if (user?.id && !hasFetchedNotifications) {
      fetchNotifications(user.id);
    }
  }, [user?.id, hasFetchedNotifications, fetchNotifications]);

  const handleToggle = (key: keyof LocalNotificationPreferences) => {
    if (!user?.id || !notifications) return;
    const newValue = !notifications[key];
    updateNotification(user.id, key, newValue);
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

        {/* Loading State */}
        {isLoading && !notifications ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          </View>
        ) : (
          /* Settings List */
          <View style={styles.settingsList}>
            {NOTIFICATION_SETTINGS.map((setting) => (
              <Card key={setting.key} variant="default" padding="md">
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
                    value={notifications?.[setting.key] ?? false}
                    onValueChange={() => handleToggle(setting.key)}
                    disabled={isUpdating}
                    trackColor={{ false: colors.dark.border, true: colors.primary.muted }}
                    thumbColor={
                      notifications?.[setting.key]
                        ? colors.primary.DEFAULT
                        : colors.text.muted
                    }
                  />
                </View>
              </Card>
            ))}
          </View>
        )}

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
  loadingContainer: {
    paddingVertical: layoutSpacing.xl,
    alignItems: 'center',
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
