import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card } from '@/components/ui';

const FILTERS = ['All', 'Loved', 'Good', 'Meh', 'Never Again'];

const VAULT_PLACES = [
  { name: 'Bella Italia', type: 'Italian', visits: 5, lastVisit: '2 days ago', reaction: '❤️', rating: 'loved' },
  { name: 'The Cozy Corner', type: 'American', visits: 3, lastVisit: '1 week ago', reaction: '👍', rating: 'good' },
  { name: 'Sakura Sushi', type: 'Japanese', visits: 2, lastVisit: '2 weeks ago', reaction: '❤️', rating: 'loved' },
  { name: 'Fast Bites', type: 'Fast Food', visits: 1, lastVisit: '1 month ago', reaction: '😐', rating: 'meh' },
];

export default function VaultScreen() {
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredPlaces = VAULT_PLACES.filter((place) => {
    if (activeFilter === 'All') return true;
    return place.rating.toLowerCase() === activeFilter.toLowerCase();
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Typography variant="h2" color="primary">
            Your Vault
          </Typography>
          <Typography variant="body" color="secondary">
            Every place tells a story
          </Typography>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <StatCard value="15" label="Places" />
          <StatCard value="42" label="Visits" />
          <StatCard value="$680" label="This Month" />
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, activeFilter === filter && styles.filterActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Typography
                variant="bodySmall"
                color={activeFilter === filter ? 'gold' : 'secondary'}
              >
                {filter}
              </Typography>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Places List */}
        <View style={styles.places}>
          {filteredPlaces.map((place, index) => (
            <Card key={index} variant="default" padding="md" style={styles.placeCard}>
              <View style={styles.placeRow}>
                <View style={styles.placeImage}>
                  <Typography variant="h3">{place.reaction}</Typography>
                </View>
                <View style={styles.placeInfo}>
                  <Typography variant="h4" color="primary">
                    {place.name}
                  </Typography>
                  <Typography variant="bodySmall" color="secondary">
                    {place.type} • {place.visits} visits
                  </Typography>
                  <Typography variant="caption" color="muted">
                    Last: {place.lastVisit}
                  </Typography>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
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
  placeCard: {},
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.md,
  },
  placeImage: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.dark.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeInfo: {
    flex: 1,
    gap: 2,
  },
});
