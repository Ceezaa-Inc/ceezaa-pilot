import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card, Logo } from '@/components/ui';
import { TasteRing } from '@/components/pulse/TasteRing';
import { useTasteStore, useAuthStore } from '@/stores';
import { PLAYLISTS, Playlist } from '@/mocks/playlists';
import { SAVED_PLANS, SavedPlan, getUpcomingPlans } from '@/mocks/plans';
import { MOOD_DATA } from '@/mocks/taste';

export default function PulseScreen() {
  const { insights, fetchFusedProfile, fetchInsights, hasFetched, hasFetchedInsights } = useTasteStore();
  const { user } = useAuthStore();
  const upcomingPlans = getUpcomingPlans(3);

  // Fetch fused profile on mount if not already fetched
  useEffect(() => {
    if (user?.id && !hasFetched) {
      console.log('[PulseScreen] Fetching fused profile for:', user.id);
      fetchFusedProfile(user.id);
    }
  }, [user?.id, hasFetched]);

  // Fetch insights on mount if not already fetched
  useEffect(() => {
    if (user?.id && !hasFetchedInsights) {
      console.log('[PulseScreen] Fetching insights for:', user.id);
      fetchInsights(user.id);
    }
  }, [user?.id, hasFetchedInsights]);

  const renderInsightCard = ({ item }: { item: (typeof insights)[0] }) => (
    <Card variant="default" padding="md" style={styles.insightCard}>
      <View style={styles.insightContent}>
        <Typography variant="h2">{item.emoji}</Typography>
        <Typography variant="caption" color="secondary" numberOfLines={2}>
          {item.description}
        </Typography>
      </View>
    </Card>
  );

  const renderPlaylistCard = ({ item }: { item: Playlist }) => {
    const moodData = MOOD_DATA[item.mood];
    return (
      <Card
        variant="outlined"
        padding="md"
        style={[styles.playlistCard, { borderColor: moodData.gradient[0] }]}
        onPress={() => router.push('/(tabs)/discover')}
      >
        <View style={[styles.playlistBadge, { backgroundColor: moodData.gradient[0] }]}>
          <Typography variant="caption" color="primary">
            {item.venueCount} spots
          </Typography>
        </View>
        <Typography variant="body" color="primary" numberOfLines={1}>
          {item.name}
        </Typography>
        <Typography variant="caption" color="muted" numberOfLines={1}>
          {item.description}
        </Typography>
      </Card>
    );
  };

  const renderPlanCard = (plan: SavedPlan) => (
    <Card
      key={plan.id}
      variant="default"
      padding="md"
      style={styles.planCard}
      onPress={() => router.push('/(tabs)/discover')}
    >
      <View style={styles.planRow}>
        <View style={styles.planInfo}>
          <Typography variant="body" color="primary">
            {plan.name}
          </Typography>
          <Typography variant="caption" color="muted">
            {plan.venueName} • {plan.time}
          </Typography>
        </View>
        <View style={styles.planParticipants}>
          <Typography variant="caption" color="secondary">
            {plan.participants.length} going
          </Typography>
        </View>
      </View>
    </Card>
  );

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
                What's your taste telling you today?
              </Typography>
            </View>
            <Logo variant="emblem" size={32} />
          </View>
        </View>

        {/* Taste Ring - Tappable */}
        <TasteRing showCard={false} />

        {/* Insights - Horizontal Scroll */}
        <View style={styles.section}>
          <Typography variant="label" color="muted">
            Insights
          </Typography>
          <FlatList
            data={insights}
            renderItem={renderInsightCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>

        {/* For You (Playlists) - Horizontal Scroll */}
        <View style={styles.section}>
          <Typography variant="label" color="muted">
            For You
          </Typography>
          <FlatList
            data={PLAYLISTS}
            renderItem={renderPlaylistCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>

        {/* Saved Plans */}
        {upcomingPlans.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Typography variant="label" color="muted">
                Saved Plans
              </Typography>
              <Typography variant="caption" color="gold">
                See all
              </Typography>
            </View>
            {upcomingPlans.map(renderPlanCard)}
          </View>
        )}
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
  section: {
    gap: layoutSpacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  horizontalList: {
    gap: layoutSpacing.sm,
  },
  insightCard: {
    width: 140,
    height: 100,
  },
  insightContent: {
    flex: 1,
    gap: layoutSpacing.xs,
  },
  playlistCard: {
    width: 160,
    gap: layoutSpacing.xs,
  },
  playlistBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: layoutSpacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  planCard: {
    marginBottom: layoutSpacing.xs,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planInfo: {
    flex: 1,
    gap: 2,
  },
  planParticipants: {
    backgroundColor: colors.dark.surface,
    paddingHorizontal: layoutSpacing.sm,
    paddingVertical: layoutSpacing.xs,
    borderRadius: borderRadius.full,
  },
});
