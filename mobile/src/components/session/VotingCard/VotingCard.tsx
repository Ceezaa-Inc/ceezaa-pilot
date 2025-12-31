import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card } from '@/components/ui';
import { SessionVenue } from '@/stores/useSessionStore';

// Capitalize venue type for display
const capitalizeVenueType = (type: string | null): string => {
  if (!type) return 'Restaurant';
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

interface VotingCardProps {
  venue: SessionVenue;
  hasVoted: boolean;
  onVote: () => void;
}

export function VotingCard({ venue, hasVoted, onVote }: VotingCardProps) {
  return (
    <Card variant="default" padding="md" style={styles.card}>
      <View style={styles.row}>
        <View style={styles.imageContainer}>
          {venue.photoUrl ? (
            <Image
              source={{ uri: venue.photoUrl }}
              style={styles.venueImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Typography variant="h4" color="muted">🍽️</Typography>
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Typography variant="h4" color="primary" numberOfLines={1}>
            {venue.venueName}
          </Typography>
          <Typography variant="bodySmall" color="secondary" numberOfLines={1}>
            {capitalizeVenueType(venue.venueType)}
          </Typography>
          <View style={styles.voteInfo}>
            <Typography variant="caption" color="muted">
              {venue.votes} {venue.votes === 1 ? 'vote' : 'votes'}
            </Typography>
            <View style={styles.matchBadge}>
              <Typography variant="caption" color="gold">
                {venue.matchPercentage}%
              </Typography>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.voteButton, hasVoted && styles.voteButtonActive]}
          onPress={onVote}
          activeOpacity={0.7}
        >
          <Typography variant="bodySmall" color={hasVoted ? 'primary' : 'gold'}>
            {hasVoted ? '✓' : '+1'}
          </Typography>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: layoutSpacing.sm,
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
    overflow: 'hidden',
  },
  venueImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.dark.surfaceAlt,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  voteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.sm,
    marginTop: 2,
  },
  matchBadge: {
    paddingHorizontal: layoutSpacing.xs,
    paddingVertical: 2,
    backgroundColor: colors.primary.muted,
    borderRadius: borderRadius.full,
  },
  voteButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.dark.surface,
    borderWidth: 2,
    borderColor: colors.primary.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voteButtonActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
});
