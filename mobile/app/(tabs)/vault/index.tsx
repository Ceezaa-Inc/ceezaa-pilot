import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card, Button } from '@/components/ui';
import { PlaceCard, AddVisitModal } from '@/components/vault';
import { useVaultStore, StatusFilter } from '@/stores/useVaultStore';
import { useAuthStore } from '@/stores/useAuthStore';

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'visited', label: 'Visited' },
  { key: 'review', label: 'Review' },
];

export default function VaultScreen() {
  const { filteredPlaces, currentFilter, setFilter, stats, addVisit, fetchVisits } = useVaultStore();
  const { user } = useAuthStore();
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchVisits(user.id);
    }
  }, [user?.id]);

  const handlePlacePress = (placeId: string) => {
    router.push({
      pathname: '/(tabs)/vault/place/[id]',
      params: { id: placeId },
    });
  };

  // Generate a unique key for each place (venueId or fallback to venueName)
  const getPlaceKey = (place: typeof filteredPlaces[0]) =>
    place.venueId || place.venueName;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleInfo}>
              <Typography variant="h2" color="primary">
                Your Vault
              </Typography>
              <Typography variant="body" color="secondary">
                Every place tells a story
              </Typography>
            </View>
            <View style={styles.headerButtons}>
              <Button
                label="DB Venues"
                variant="ghost"
                size="sm"
                onPress={() => router.push('/(tabs)/vault/temp-venues')}
              />
              <Button
                label="+ Add"
                variant="secondary"
                size="sm"
                onPress={() => setShowAddModal(true)}
              />
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <StatCard value={String(stats.totalPlaces)} label="Places" />
          <StatCard value={String(stats.totalVisits)} label="Visits" />
          <StatCard value={`$${stats.thisMonthSpent ?? 0}`} label="This Month" />
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterChip, currentFilter === filter.key && styles.filterActive]}
              onPress={() => setFilter(filter.key)}
            >
              <Typography
                variant="bodySmall"
                color={currentFilter === filter.key ? 'gold' : 'secondary'}
              >
                {filter.label}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Places List */}
        <View style={styles.places}>
          {filteredPlaces.length === 0 ? (
            <View style={styles.emptyState}>
              <Typography variant="body" color="muted" align="center">
                No places found with this filter
              </Typography>
            </View>
          ) : (
            filteredPlaces.map((place) => (
              <PlaceCard
                key={getPlaceKey(place)}
                place={place}
                onPress={() => handlePlacePress(getPlaceKey(place))}
              />
            ))
          )}
        </View>
      </ScrollView>

      <AddVisitModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddVisit={addVisit}
      />
    </SafeAreaView>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <Card variant="outlined" padding="md" style={styles.statCard}>
      <Typography variant="h3" color="gold" align="center">
        {value}
      </Typography>
      <Typography variant="caption" color="secondary" align="center">
        {label}
      </Typography>
    </Card>
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: layoutSpacing.md,
  },
  titleInfo: {
    flex: 1,
    gap: layoutSpacing.xs,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: layoutSpacing.sm,
  },
  stats: {
    flexDirection: 'row',
    gap: layoutSpacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  filters: {
    gap: layoutSpacing.sm,
    paddingRight: layoutSpacing.lg,
  },
  filterChip: {
    paddingHorizontal: layoutSpacing.md,
    paddingVertical: layoutSpacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  filterActive: {
    backgroundColor: colors.primary.muted,
    borderColor: colors.primary.DEFAULT,
  },
  places: {
    gap: layoutSpacing.sm,
  },
  emptyState: {
    paddingVertical: layoutSpacing.xl,
  },
});
