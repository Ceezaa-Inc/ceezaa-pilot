import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card } from '@/components/ui';
import { supabase } from '@/services/supabase';

interface DbVenue {
  id: string;
  google_place_id: string | null;
  name: string;
  formatted_address: string | null;
  lat: number | null;
  lng: number | null;
  city: string | null;
  google_rating: number | null;
  google_price_level: number | null;
  taste_cluster: string | null;
  cuisine_type: string | null;
  tagline: string | null;
  energy: string | null;
  best_for: string[] | null;
  standout: string[] | null;
  price_tier: string | null;
  vibe_tags: string[] | null;
  photo_references: string[] | null;
  opening_hours: Record<string, string> | null;
  created_at: string;
}

export default function TempVenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [venue, setVenue] = useState<DbVenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchVenue();
    }
  }, [id]);

  const fetchVenue = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('venues')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      setError(fetchError.message);
      setVenue(null);
    } else {
      setVenue(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Typography variant="body" color="primary">
              ← Back
            </Typography>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !venue) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Typography variant="body" color="primary">
              ← Back
            </Typography>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Typography variant="h3" color="muted">
            Venue not found
          </Typography>
          {error && (
            <Typography variant="bodySmall" color="error">
              {error}
            </Typography>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <Typography variant="h1">
              {getClusterEmoji(venue.taste_cluster)}
            </Typography>
          </View>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Typography variant="body" color="primary">
              ←
            </Typography>
          </TouchableOpacity>
          {venue.google_rating && (
            <View style={styles.ratingBadge}>
              <Typography variant="h4" color="gold">
                ★ {venue.google_rating.toFixed(1)}
              </Typography>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerSection}>
            <Typography variant="h2" color="primary">
              {venue.name}
            </Typography>
            {venue.tagline && (
              <Typography variant="body" color="secondary" style={styles.tagline}>
                "{venue.tagline}"
              </Typography>
            )}
            <View style={styles.metaRow}>
              {venue.taste_cluster && (
                <View style={[styles.clusterBadge, getClusterStyle(venue.taste_cluster)]}>
                  <Typography variant="bodySmall" color="primary">
                    {venue.taste_cluster}
                  </Typography>
                </View>
              )}
              {venue.cuisine_type && (
                <Typography variant="body" color="muted">
                  {venue.cuisine_type}
                </Typography>
              )}
              {venue.price_tier && (
                <Typography variant="body" color="muted">
                  • {venue.price_tier}
                </Typography>
              )}
            </View>
          </View>

          {/* Energy */}
          {venue.energy && (
            <Card variant="outlined" padding="md">
              <View style={styles.fieldRow}>
                <Typography variant="label" color="muted">
                  Energy
                </Typography>
                <Typography variant="body" color="primary">
                  {venue.energy.charAt(0).toUpperCase() + venue.energy.slice(1)}
                </Typography>
              </View>
            </Card>
          )}

          {/* Best For */}
          {venue.best_for && venue.best_for.length > 0 && (
            <View style={styles.section}>
              <Typography variant="label" color="muted">
                Best For
              </Typography>
              <View style={styles.tagsContainer}>
                {venue.best_for.map((tag) => (
                  <View key={tag} style={styles.bestForTag}>
                    <Typography variant="bodySmall" color="primary">
                      {formatTag(tag)}
                    </Typography>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Standout */}
          {venue.standout && venue.standout.length > 0 && (
            <View style={styles.section}>
              <Typography variant="label" color="muted">
                Standout Qualities
              </Typography>
              <View style={styles.tagsContainer}>
                {venue.standout.map((tag) => (
                  <View key={tag} style={styles.standoutTag}>
                    <Typography variant="bodySmall" color="gold">
                      ✨ {formatTag(tag)}
                    </Typography>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Location */}
          <View style={styles.section}>
            <Typography variant="label" color="muted">
              Location
            </Typography>
            <Card variant="default" padding="md">
              {venue.formatted_address && (
                <View style={styles.fieldRow}>
                  <Typography variant="bodySmall" color="muted">
                    Address
                  </Typography>
                  <Typography variant="body" color="primary" style={styles.addressText}>
                    {venue.formatted_address}
                  </Typography>
                </View>
              )}
              {venue.city && (
                <View style={styles.fieldRow}>
                  <Typography variant="bodySmall" color="muted">
                    City
                  </Typography>
                  <Typography variant="body" color="primary">
                    {venue.city}
                  </Typography>
                </View>
              )}
              {venue.lat && venue.lng && (
                <View style={styles.fieldRow}>
                  <Typography variant="bodySmall" color="muted">
                    Coordinates
                  </Typography>
                  <Typography variant="caption" color="secondary">
                    {venue.lat.toFixed(5)}, {venue.lng.toFixed(5)}
                  </Typography>
                </View>
              )}
            </Card>
          </View>

          {/* Raw Data */}
          <View style={styles.section}>
            <Typography variant="label" color="muted">
              Raw Data (Debug)
            </Typography>
            <Card variant="outlined" padding="md">
              <View style={styles.rawData}>
                <FieldRow label="ID" value={venue.id} />
                <FieldRow label="Google Place ID" value={venue.google_place_id} />
                <FieldRow label="Price Level" value={venue.google_price_level?.toString()} />
                <FieldRow label="Created" value={new Date(venue.created_at).toLocaleDateString()} />
              </View>
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FieldRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={styles.fieldRow}>
      <Typography variant="caption" color="muted">
        {label}
      </Typography>
      <Typography variant="caption" color="secondary" numberOfLines={1}>
        {value || '-'}
      </Typography>
    </View>
  );
}

function formatTag(tag: string): string {
  return tag
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getClusterEmoji(cluster: string | null): string {
  switch (cluster) {
    case 'dining':
      return '🍽️';
    case 'coffee':
      return '☕';
    case 'nightlife':
      return '🍸';
    case 'bakery':
      return '🥐';
    default:
      return '📍';
  }
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: layoutSpacing.md,
    padding: layoutSpacing.lg,
  },
  hero: {
    height: 180,
    backgroundColor: colors.dark.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  heroContent: {
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: layoutSpacing.md,
    left: layoutSpacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: layoutSpacing.md,
    right: layoutSpacing.md,
    paddingHorizontal: layoutSpacing.md,
    paddingVertical: layoutSpacing.sm,
    backgroundColor: colors.primary.muted,
    borderRadius: borderRadius.md,
  },
  content: {
    padding: layoutSpacing.lg,
    gap: layoutSpacing.lg,
  },
  headerSection: {
    gap: layoutSpacing.sm,
  },
  tagline: {
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.sm,
    flexWrap: 'wrap',
  },
  clusterBadge: {
    paddingHorizontal: layoutSpacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  section: {
    gap: layoutSpacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layoutSpacing.sm,
  },
  bestForTag: {
    paddingHorizontal: layoutSpacing.md,
    paddingVertical: layoutSpacing.sm,
    backgroundColor: colors.dark.surface,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  standoutTag: {
    paddingHorizontal: layoutSpacing.md,
    paddingVertical: layoutSpacing.sm,
    backgroundColor: colors.primary.muted,
    borderRadius: borderRadius.full,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  addressText: {
    flex: 1,
    textAlign: 'right',
    marginLeft: layoutSpacing.md,
  },
  rawData: {
    gap: 4,
  },
});
