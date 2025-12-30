import React, { useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card, Logo } from '@/components/ui';
import { TasteRing } from '@/components/pulse/TasteRing';
import { useTasteStore, useAuthStore, useVaultStore } from '@/stores';

// Format currency to 2 decimal places
const formatCurrency = (amount: number): string => {
  return amount.toFixed(2);
};

export default function PulseScreen() {
  const { insights, fetchFusedProfile, fetchInsights, hasFetched, hasFetchedInsights, isLoadingInsights } = useTasteStore();
  const { user } = useAuthStore();
  const { stats } = useVaultStore();

  // Fetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        // Fetch fused profile if not already fetched
        if (!hasFetched) {
          fetchFusedProfile(user.id);
        }

        // Fetch insights if not already fetched
        if (!hasFetchedInsights) {
          fetchInsights(user.id);
        }
      }
    }, [user?.id, hasFetched, hasFetchedInsights])
  );

  const navigateToVault = () => {
    router.push('/(tabs)/vault');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Typography variant="h2" color="primary">
                Your Pulse
              </Typography>
              <Typography variant="body" color="secondary">
                Your taste tells a story
              </Typography>
            </View>
            <Logo variant="emblem" size={32} />
          </View>
        </View>

        {/* Taste Ring - Tappable */}
        <TasteRing showCard={false} />

        {/* Stats Row - Links to Vault */}
        <TouchableOpacity onPress={navigateToVault} activeOpacity={0.8}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Typography variant="h3" color="gold" align="center">
                {stats.totalPlaces}
              </Typography>
              <Typography variant="caption" color="secondary" align="center">
                Places
              </Typography>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Typography variant="h3" color="gold" align="center">
                {stats.totalVisits}
              </Typography>
              <Typography variant="caption" color="secondary" align="center">
                Visits
              </Typography>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Typography variant="h3" color="gold" align="center">
                ${formatCurrency(stats.thisMonthSpent ?? 0)}
              </Typography>
              <Typography variant="caption" color="secondary" align="center">
                This Month
              </Typography>
            </View>
          </View>
        </TouchableOpacity>

        {/* Insights - Vertical Full-Width Cards */}
        {isLoadingInsights ? (
          <View style={styles.section}>
            <Typography variant="label" color="muted">
              Your Insights
            </Typography>
            <View style={styles.insightSkeletons}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.insightSkeleton}>
                  <View style={styles.skeletonEmoji} />
                  <View style={styles.skeletonContent}>
                    <View style={styles.skeletonTitle} />
                    <View style={styles.skeletonDesc} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : insights.length > 0 ? (
          <View style={styles.section}>
            <Typography variant="label" color="muted">
              Your Insights
            </Typography>
            <View style={styles.insightsList}>
              {insights.map((insight) => (
                <Card key={insight.id} variant="default" padding="md" style={styles.insightCard}>
                  <View style={styles.insightContent}>
                    <Typography variant="h2" style={styles.insightEmoji}>
                      {insight.emoji}
                    </Typography>
                    <View style={styles.insightText}>
                      <Typography variant="body" color="primary">
                        {insight.title}
                      </Typography>
                      <Typography variant="caption" color="secondary">
                        {insight.description}
                      </Typography>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        ) : null}
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
    gap: layoutSpacing.xl,
  },
  header: {
    gap: layoutSpacing.xs,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.dark.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: layoutSpacing.md,
    paddingHorizontal: layoutSpacing.sm,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.dark.border,
    marginVertical: layoutSpacing.xs,
  },
  section: {
    gap: layoutSpacing.sm,
  },
  insightsList: {
    gap: layoutSpacing.sm,
  },
  insightCard: {
    flexDirection: 'row',
  },
  insightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.md,
  },
  insightEmoji: {
    fontSize: 32,
    lineHeight: 40,
  },
  insightText: {
    flex: 1,
    gap: 2,
  },
  insightSkeletons: {
    gap: layoutSpacing.sm,
  },
  insightSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surface,
    borderRadius: borderRadius.lg,
    padding: layoutSpacing.md,
    gap: layoutSpacing.md,
  },
  skeletonEmoji: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.dark.border,
  },
  skeletonContent: {
    flex: 1,
    gap: layoutSpacing.xs,
  },
  skeletonTitle: {
    height: 16,
    width: '60%',
    borderRadius: borderRadius.sm,
    backgroundColor: colors.dark.border,
  },
  skeletonDesc: {
    height: 12,
    width: '90%',
    borderRadius: borderRadius.sm,
    backgroundColor: colors.dark.border,
  },
});
