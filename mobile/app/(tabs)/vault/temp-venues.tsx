import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card } from '@/components/ui';
import { supabase } from '@/services/supabase';

interface DbVenue {
  id: string;
  name: string;
  formatted_address: string | null;
  google_rating: number | null;
  taste_cluster: string | null;
  cuisine_type: string | null;
  tagline: string | null;
  energy: string | null;
  best_for: string[] | null;
  standout: string[] | null;
  price_tier: string | null;
  photo_references: string[] | null;
}

export default function TempVenuesScreen() {
  const [venues, setVenues] = useState<DbVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchVenues();
  }, [filter]);

  const fetchVenues = async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('venues')
      .select('id, name, formatted_address, google_rating, taste_cluster, cuisine_type, tagline, energy, best_for, standout, price_tier, photo_references')
      .eq('is_active', true)
      .order('name');

    if (filter) {
      query = query.eq('taste_cluster', filter);
    }

    const { data, error: fetchError } = await query.limit(100);

    if (fetchError) {
      setError(fetchError.message);
      setVenues([]);
    } else {
      setVenues(data || []);
    }
    setLoading(false);
  };

  const handleVenuePress = (venueId: string) => {
    router.push({
      pathname: '/(tabs)/vault/temp-venue/[id]',
      params: { id: venueId },
    });
  };

  const clusters = ['dining', 'coffee', 'nightlife'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Typography variant="body" color="primary">
            ← Back
          </Typography>
        </TouchableOpacity>
        <Typography variant="h2" color="primary">
          All Venues ({venues.length})
        </Typography>
        <Typography variant="bodySmall" color="muted">
          Temp page - data from Supabase
        </Typography>
      </View>

      {/* Cluster Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        <TouchableOpacity
          style={[styles.filterChip, !filter && styles.filterActive]}
          onPress={() => setFilter(null)}
        >
          <Typography variant="bodySmall" color={!filter ? 'gold' : 'secondary'}>
            All
          </Typography>
        </TouchableOpacity>
        {clusters.map((cluster) => (
          <TouchableOpacity
            key={cluster}
            style={[styles.filterChip, filter === cluster && styles.filterActive]}
            onPress={() => setFilter(cluster)}
          >
            <Typography variant="bodySmall" color={filter === cluster ? 'gold' : 'secondary'}>
              {cluster.charAt(0).toUpperCase() + cluster.slice(1)}
            </Typography>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Typography variant="body" color="muted">
            Loading venues...
          </Typography>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Typography variant="body" color="error">
            Error: {error}
          </Typography>
          <TouchableOpacity onPress={fetchVenues}>
            <Typography variant="body" color="primary">
              Tap to retry
            </Typography>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {venues.map((venue) => (
            <TouchableOpacity key={venue.id} onPress={() => handleVenuePress(venue.id)}>
              <Card variant="default" padding="md" style={styles.venueCard}>
                <View style={styles.venueHeader}>
                  <View style={styles.venueInfo}>
                    <Typography variant="h4" color="primary" numberOfLines={1}>
                      {venue.name}
                    </Typography>
                    {venue.tagline && (
                      <Typography variant="bodySmall" color="secondary" numberOfLines={2}>
                        "{venue.tagline}"
                      </Typography>
                    )}
                  </View>
                  {venue.google_rating && (
                    <View style={styles.ratingBadge}>
                      <Typography variant="bodySmall" color="gold">
                        ★ {venue.google_rating.toFixed(1)}
                      </Typography>
                    </View>
                  )}
                </View>

                <View style={styles.metaRow}>
                  {venue.taste_cluster && (
                    <View style={[styles.clusterBadge, getClusterStyle(venue.taste_cluster)]}>
                      <Typography variant="caption" color="primary">
                        {venue.taste_cluster}
                      </Typography>
                    </View>
                  )}
                  {venue.cuisine_type && (
                    <Typography variant="caption" color="muted">
                      {venue.cuisine_type}
                    </Typography>
                  )}
                  {venue.energy && (
                    <Typography variant="caption" color="muted">
                      • {venue.energy}
                    </Typography>
                  )}
                  {venue.price_tier && (
                    <Typography variant="caption" color="muted">
                      • {venue.price_tier}
                    </Typography>
                  )}
                </View>

                {venue.best_for && venue.best_for.length > 0 && (
                  <View style={styles.tagsRow}>
                    {venue.best_for.slice(0, 3).map((tag) => (
                      <View key={tag} style={styles.tag}>
                        <Typography variant="caption" color="secondary">
                          {tag.replace('_', ' ')}
                        </Typography>
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function getClusterStyle(cluster: string) {
  switch (cluster) {
    case 'dining':
      return { backgroundColor: colors.dark.surface };
    case 'coffee':
      return { backgroundColor: '#3d2814' };
    case 'nightlife':
      return { backgroundColor: '#1a1a2e' };
    default:
      return { backgroundColor: colors.dark.surface };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    padding: layoutSpacing.lg,
    gap: layoutSpacing.xs,
  },
  filters: {
    paddingHorizontal: layoutSpacing.lg,
    paddingBottom: layoutSpacing.md,
    gap: layoutSpacing.sm,
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
  content: {
    padding: layoutSpacing.lg,
    gap: layoutSpacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: layoutSpacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: layoutSpacing.md,
    padding: layoutSpacing.lg,
  },
  venueCard: {
    gap: layoutSpacing.sm,
  },
  venueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: layoutSpacing.sm,
  },
  venueInfo: {
    flex: 1,
    gap: 4,
  },
  ratingBadge: {
    paddingHorizontal: layoutSpacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.primary.muted,
    borderRadius: borderRadius.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.sm,
    flexWrap: 'wrap',
  },
  clusterBadge: {
    paddingHorizontal: layoutSpacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layoutSpacing.xs,
  },
  tag: {
    paddingHorizontal: layoutSpacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.dark.surfaceAlt,
    borderRadius: borderRadius.sm,
  },
});
