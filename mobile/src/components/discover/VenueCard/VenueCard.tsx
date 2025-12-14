import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card } from '@/components/ui';
import { Venue } from '@/mocks/venues';

interface VenueCardProps {
  venue: Venue;
  onPress?: () => void;
}

const getPriceString = (level: number): string => {
  return '$'.repeat(level);
};

export function VenueCard({ venue, onPress }: VenueCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card variant="default" padding="md" style={styles.card}>
        <View style={styles.row}>
          <View style={styles.imageContainer}>
            <Typography variant="h3">🍽️</Typography>
          </View>
          <View style={styles.info}>
            <Typography variant="h4" color="primary" numberOfLines={1}>
              {venue.name}
            </Typography>
            <Typography variant="bodySmall" color="secondary" numberOfLines={1}>
              {venue.cuisine || venue.type} • {getPriceString(venue.priceLevel)}
            </Typography>
            <Typography variant="caption" color="muted" numberOfLines={1}>
              {venue.neighborhood} • {venue.distance}
            </Typography>
          </View>
          <View style={styles.matchBadge}>
            <Typography variant="caption" color="gold">
              {venue.matchPercentage}%
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
