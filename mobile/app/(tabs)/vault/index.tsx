import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card, Button } from '@/components/ui';
import { PlaceCard, AddVisitModal } from '@/components/vault';
import { useVaultStore, StatusFilter, Place } from '@/stores/useVaultStore';
import { useAuthStore } from '@/stores/useAuthStore';

// Format currency to 2 decimal places
const formatCurrency = (amount: number): string => {
  return amount.toFixed(2);
};

// Group places by month of last visit
interface MonthGroup {
  key: string;
  label: string;
  places: Place[];
}

function groupPlacesByMonth(places: Place[]): MonthGroup[] {
  const groups: Record<string, Place[]> = {};

  places.forEach((place) => {
    const date = new Date(place.lastVisit);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(place);
  });

  // Sort by key (year-month) descending
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, monthPlaces]) => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return { key, label, places: monthPlaces };
    });
}

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'loved', label: '❤️ Loved' },
  { key: 'good', label: '👍 Good' },
  { key: 'meh', label: '😐 Meh' },
  { key: 'never_again', label: '👎 Never Again' },
  { key: 'unrated', label: 'Unrated' },
];

export default function VaultScreen() {
  const { filteredPlaces, currentFilter, setFilter, stats, addVisit, fetchVisits, isLoading } = useVaultStore();
  const { user } = useAuthStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter places by search query
  const searchFilteredPlaces = useMemo(() => {
    if (!searchQuery.trim()) return filteredPlaces;
    const query = searchQuery.toLowerCase();
    return filteredPlaces.filter((place) =>
      place.venueName.toLowerCase().includes(query)
    );
  }, [filteredPlaces, searchQuery]);

  // Group places by month
  const monthGroups = useMemo(() => groupPlacesByMonth(searchFilteredPlaces), [searchFilteredPlaces]);

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
  const getPlaceKey = (place: Place) => place.venueId || place.venueName;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleInfo}>
              <View style={styles.titleWithEmoji}>
                <Typography variant="h2" color="primary">
                  My Food Diary
                </Typography>
              </View>
              <Typography variant="body" color="secondary">
                Your dining memories
              </Typography>
            </View>
            <Button
              label="+ Add"
              variant="secondary"
              size="sm"
              onPress={() => setShowAddModal(true)}
            />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <StatCard value={String(stats.totalPlaces)} label="Places" />
          <StatCard value={String(stats.totalVisits)} label="Visits" />
          <StatCard value={`$${formatCurrency(stats.thisMonthSpent ?? 0)}`} label="This Month" />
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

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search venues..."
            placeholderTextColor={colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Places List - Grouped by Month */}
        <View style={styles.places}>
          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
              <Typography variant="body" color="secondary" style={styles.loadingText}>
                Loading your food diary...
              </Typography>
            </View>
          ) : searchFilteredPlaces.length === 0 ? (
            <View style={styles.emptyState}>
              <Typography variant="body" color="muted" align="center">
                {searchQuery.trim()
                  ? `No venues matching "${searchQuery}"`
                  : 'No places found with this filter'}
              </Typography>
            </View>
          ) : (
            monthGroups.map((group) => (
              <View key={group.key} style={styles.monthSection}>
                <View style={styles.monthHeader}>
                  <View style={styles.monthDivider} />
                  <Typography variant="label" color="muted" style={styles.monthLabel}>
                    {group.label}
                  </Typography>
                  <View style={styles.monthDivider} />
                </View>
                {group.places.map((place) => (
                  <PlaceCard
                    key={getPlaceKey(place)}
                    place={place}
                    onPress={() => handlePlacePress(getPlaceKey(place))}
                  />
                ))}
              </View>
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
  // Use smaller variant for monetary values to prevent overflow
  const isMonetary = value.startsWith('$');
  return (
    <Card variant="outlined" padding="md" style={styles.statCard}>
      <Typography
        variant={isMonetary ? 'body' : 'h3'}
        color="gold"
        align="center"
        numberOfLines={1}
      >
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
  titleWithEmoji: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.sm,
  },
  headerEmoji: {
    fontSize: 24,
  },
  stats: {
    flexDirection: 'row',
    gap: layoutSpacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 56,
  },
  filters: {
    gap: layoutSpacing.sm,
    paddingRight: layoutSpacing.lg,
  },
  searchContainer: {
    marginTop: -layoutSpacing.sm,
  },
  searchInput: {
    backgroundColor: colors.dark.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: layoutSpacing.md,
    paddingVertical: layoutSpacing.sm,
    color: colors.text.primary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.dark.border,
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
    gap: layoutSpacing.lg,
  },
  monthSection: {
    gap: layoutSpacing.sm,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.md,
    paddingVertical: layoutSpacing.sm,
  },
  monthDivider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.dark.border,
  },
  monthLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyState: {
    paddingVertical: layoutSpacing.xl,
  },
  loadingState: {
    paddingVertical: layoutSpacing.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: layoutSpacing.md,
  },
  loadingText: {
    marginTop: layoutSpacing.sm,
  },
});
