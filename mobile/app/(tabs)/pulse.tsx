import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { Typography, Card, Button, Logo } from '@/components/ui';

const QUICK_ACTIONS = [
  { emoji: '🍽️', label: 'Find a spot' },
  { emoji: '👥', label: 'Group plan' },
  { emoji: '🎲', label: 'Surprise me' },
];

const RECENT_INSIGHTS = [
  { emoji: '🌟', text: 'You visited 3 new places this week!' },
  { emoji: '🍕', text: 'Your Italian craving is strong lately' },
];

export default function PulseScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Typography variant="h2" color="primary">
                Your Pulse
              </Typography>
              <Typography variant="body" color="secondary">
                What's your taste telling you today?
              </Typography>
            </View>
            <Logo variant="emblem" size={32} />
          </View>
        </View>

        {/* Taste Ring */}
        <Card variant="elevated" padding="lg" style={styles.tasteCard}>
          <View style={styles.tasteRing}>
            <View style={styles.ringOuter}>
              <View style={styles.ringInner}>
                <Typography variant="h1" color="gold">
                  91
                </Typography>
                <Typography variant="caption" color="secondary">
                  Taste Score
                </Typography>
              </View>
            </View>
          </View>
          <Typography variant="bodySmall" color="muted" align="center">
            Your taste profile is getting smarter
          </Typography>
        </Card>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Typography variant="label" color="muted">
            Quick Actions
          </Typography>
          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map((action, index) => (
              <Card key={index} variant="outlined" padding="md" style={styles.actionCard}>
                <Typography variant="h3" align="center">
                  {action.emoji}
                </Typography>
                <Typography variant="caption" color="secondary" align="center">
                  {action.label}
                </Typography>
              </Card>
            ))}
          </View>
        </View>

        {/* Recent Insights */}
        <View style={styles.section}>
          <Typography variant="label" color="muted">
            Recent Insights
          </Typography>
          {RECENT_INSIGHTS.map((insight, index) => (
            <Card key={index} variant="default" padding="md" style={styles.insightCard}>
              <View style={styles.insightRow}>
                <Typography variant="body">{insight.emoji}</Typography>
                <Typography variant="bodySmall" color="secondary" style={styles.insightText}>
                  {insight.text}
                </Typography>
              </View>
            </Card>
          ))}
        </View>

        {/* Mood Suggestion */}
        <Card variant="elevated" padding="lg" style={styles.moodCard}>
          <Typography variant="h4" color="primary">
            Tonight's Mood
          </Typography>
          <Typography variant="body" color="secondary" style={styles.moodText}>
            Based on your patterns, you might be in the mood for something cozy and Italian 🍝
          </Typography>
          <Button label="Show me options" variant="secondary" onPress={() => { }} />
        </Card>
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
    gap: layoutSpacing.xs,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tasteCard: {
    alignItems: 'center',
    gap: layoutSpacing.md,
  },
  tasteRing: {
    marginVertical: layoutSpacing.sm,
  },
  ringOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    borderColor: colors.primary.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    alignItems: 'center',
  },
  section: {
    gap: layoutSpacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    gap: layoutSpacing.sm,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    gap: layoutSpacing.xs,
  },
  insightCard: {
    marginBottom: layoutSpacing.xs,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.sm,
  },
  insightText: {
    flex: 1,
  },
  moodCard: {
    gap: layoutSpacing.sm,
  },
  moodText: {
    marginBottom: layoutSpacing.xs,
  },
});
