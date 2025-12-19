import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card } from '@/components/ui';
import { Venue } from '@/mocks/venues';
import { DiscoverVenue } from '@/services/api';

// Support both mock Venue and API DiscoverVenue types
type VenueData = Venue | DiscoverVenue;

interface VenueCardProps {
  venue: VenueData;
  onPress?: () => void;
}

// Type guard to check if venue is DiscoverVenue (API response)
function isDiscoverVenue(venue: VenueData): venue is DiscoverVenue {
  return 'match_score' in venue;
}

function getVenueDisplay(venue: VenueData) {
  if (isDiscoverVenue(venue)) {
    // API venue format
    const cuisineOrCluster = venue.cuisine_type || venue.taste_cluster || 'Restaurant';
    return {
      name: venue.name,
      subtitle: `${cuisineOrCluster} • ${venue.price_tier || '$$'}`,
      location: venue.formatted_address?.split(',')[0] || '',
      matchScore: venue.match_score,
      matchReasons: venue.match_reasons,
      tagline: venue.tagline,
    };
  } else {
    // Mock venue format
    return {
      name: venue.name,
      subtitle: `${venue.cuisine || venue.type} • ${'$'.repeat(venue.priceLevel)}`,
      location: `${venue.neighborhood} • ${venue.distance}`,
      matchScore: venue.matchPercentage,
      matchReasons: [],
      tagline: null,
    };
  }
}

export function VenueCard({ venue, onPress }: VenueCardProps) {
  const display = getVenueDisplay(venue);
  const hasReasons = display.matchReasons.length > 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card variant="default" padding="md" style={styles.card}>
        <View style={styles.row}>
          <View style={styles.imageContainer}>
            <Typography variant="h3">🍽️</Typography>
          </View>
          <View style={styles.info}>
            <Typography variant="h4" color="primary" numberOfLines={1}>
              {display.name}
            </Typography>
            {display.tagline ? (
              <Typography variant="bodySmall" color="secondary" numberOfLines={1}>
                {display.tagline}
              </Typography>
            ) : (
              <Typography variant="bodySmall" color="secondary" numberOfLines={1}>
                {display.subtitle}
              </Typography>
            )}
            {hasReasons ? (
              <Typography variant="caption" color="gold" numberOfLines={1}>
                {display.matchReasons[0]}
              </Typography>
            ) : (
              <Typography variant="caption" color="muted" numberOfLines={1}>
                {display.location}
              </Typography>
            )}
          </View>
          <View style={styles.matchBadge}>
            <Typography variant="caption" color="gold">
              {display.matchScore}%
            </Typography>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: layoutSpacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.md,
  },
  imageContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.dark.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  matchBadge: {
    paddingHorizontal: layoutSpacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.primary.muted,
    borderRadius: borderRadius.full,
  },
});
