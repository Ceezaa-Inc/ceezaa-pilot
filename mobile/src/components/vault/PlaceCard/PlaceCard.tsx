import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card } from '@/components/ui';
import { Place, getReactionEmoji } from '@/mocks/visits';

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

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card variant="default" padding="md">
        <View style={styles.row}>
          <View style={[styles.reactionBadge, !place.reaction && styles.reactionBadgeUnrated]}>
            {place.reaction ? (
              <Text style={styles.reactionEmoji}>{getReactionEmoji(place.reaction)}</Text>
            ) : (
              <Typography variant="h3" color="gold">?</Typography>
            )}
          </View>
          <View style={styles.info}>
            <Typography variant="h4" color="primary">
              {place.venueName}
            </Typography>
            <Typography variant="bodySmall" color="secondary">
              {place.venueType} • {place.visitCount} {place.visitCount === 1 ? 'visit' : 'visits'}
            </Typography>
            <Typography variant="caption" color="muted">
              Last: {formatLastVisit(place.lastVisit)}
            </Typography>
          </View>
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
  reactionBadge: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.dark.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionBadgeUnrated: {
    borderWidth: 2,
    borderColor: colors.primary.DEFAULT,
    borderStyle: 'dashed',
  },
  reactionEmoji: {
    fontSize: 28,
    lineHeight: 36,
    textAlign: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  chevron: {
    paddingLeft: layoutSpacing.sm,
  },
});

export default PlaceCard;
