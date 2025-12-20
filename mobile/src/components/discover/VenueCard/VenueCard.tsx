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

// Normalize price tier to dollar signs ($, $$, $$$, $$$$)
function normalizePriceDisplay(priceTier: string | null | undefined): string {
  if (!priceTier) return '$$';

  // Already in dollar sign format
  if (/^\$+$/.test(priceTier)) return priceTier;

  // Map price ranges to dollar signs
  const priceMap: Record<string, string> = {
    '$1-10': '$',
    '$1–10': '$',
    '$10-20': '$$',
    '$10–20': '$$',
    '$20-30': '$$',
    '$20–30': '$$',
    '$30-50': '$$$',
    '$30–50': '$$$',
    '$50-100': '$$$',
    '$50–100': '$$$',
    '$100+': '$$$$',
  };

  return priceMap[priceTier] || '$$';
}

function getVenueDisplay(venue: VenueData) {
  if (isDiscoverVenue(venue)) {
    // API venue format
    const cuisineOrCluster = venue.cuisine_type || venue.taste_cluster || 'Restaurant';
    const priceDisplay = normalizePriceDisplay(venue.price_tier);
    return {
      name: venue.name,
      tagline: venue.tagline || 'A local favorite',
      subtitle: `${cuisineOrCluster} • ${priceDisplay}`,
      matchScore: venue.match_score,
    };
  } else {
    // Mock venue format
    return {
      name: venue.name,
      tagline: `${venue.neighborhood} gem`,
      subtitle: `${venue.cuisine || venue.type} • ${'$'.repeat(venue.priceLevel)}`,
      matchScore: venue.matchPercentage,
    };
  }
}

export function VenueCard({ venue, onPress }: VenueCardProps) {
  const display = getVenueDisplay(venue);

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
            <Typography variant="bodySmall" color="secondary" numberOfLines={2}>
              {display.tagline}
            </Typography>
            <Typography variant="caption" color="muted" numberOfLines={1}>
              {display.subtitle}
            </Typography>
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
