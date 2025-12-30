import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card } from '@/components/ui';
import { Place } from '@/stores/useVaultStore';
import { getReactionEmoji } from '@/mocks/visits';

// Venue type emoji mapping for fallback when no photo
const VENUE_TYPE_EMOJIS: Record<string, string> = {
  'Coffee Shop': '☕',
  'Restaurant': '🍽️',
  'Fast Food': '🍔',
  'Bar': '🍸',
  'Bakery': '🥐',
  'Cafe': '☕',
  coffee: '☕',
  dining: '🍽️',
  fast_food: '🍔',
  nightlife: '🍸',
  default: '🍴',
};

function getVenueEmoji(venueType: string | null | undefined): string {
  if (!venueType) return VENUE_TYPE_EMOJIS.default;
  return VENUE_TYPE_EMOJIS[venueType] || VENUE_TYPE_EMOJIS.default;
}

// Format venue type to Title Case (e.g., "fast_food" → "Fast Food")
function formatVenueType(type: string | null | undefined): string {
  if (!type) return '';
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

interface PlaceCardProps {
  place: Place;
  onPress: () => void;
}

export function PlaceCard({ place, onPress }: PlaceCardProps) {
  const formatLastVisit = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 60) return '1 month ago';
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Build the visit info string, handling null venueType gracefully
  const formattedType = formatVenueType(place.venueType);
  const visitInfo = formattedType
    ? `${formattedType} • ${place.visitCount} ${place.visitCount === 1 ? 'visit' : 'visits'}`
    : `${place.visitCount} ${place.visitCount === 1 ? 'visit' : 'visits'}`;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card variant="default" padding="md">
        <View style={styles.row}>
          <View style={[styles.badge, place.reaction && styles.badgeWithReaction]}>
            {place.photoUrl ? (
              <Image source={{ uri: place.photoUrl }} style={styles.photo} />
            ) : place.reaction ? (
              <Text style={styles.reactionEmoji}>{getReactionEmoji(place.reaction)}</Text>
            ) : (
              <Text style={styles.venueEmoji}>{getVenueEmoji(place.venueType)}</Text>
            )}
          </View>
          <View style={styles.info}>
            <Typography variant="h4" color="primary" numberOfLines={1}>
              {place.venueName}
            </Typography>
            <Typography variant="bodySmall" color="secondary">
              {visitInfo}
            </Typography>
            <Typography variant="caption" color="muted">
              Last: {formatLastVisit(place.lastVisit)}
            </Typography>
          </View>
          {place.reaction && (
            <View style={styles.reactionIndicator}>
              <Text style={styles.smallReaction}>{getReactionEmoji(place.reaction)}</Text>
            </View>
          )}
          <View style={styles.chevron}>
            <Typography variant="body" color="muted">
              ›
            </Typography>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.md,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.dark.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  badgeWithReaction: {
    backgroundColor: colors.dark.surfaceAlt,
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
  },
  reactionEmoji: {
    fontSize: 28,
    lineHeight: 36,
    textAlign: 'center',
  },
  venueEmoji: {
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  reactionIndicator: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallReaction: {
    fontSize: 18,
    lineHeight: 24,
  },
  chevron: {
    paddingLeft: layoutSpacing.sm,
  },
});

export default PlaceCard;
