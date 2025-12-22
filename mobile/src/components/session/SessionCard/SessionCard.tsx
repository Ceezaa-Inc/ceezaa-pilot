import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card } from '@/components/ui';
import { Session } from '@/stores/useSessionStore';

interface SessionCardProps {
  session: Session;
  onPress: () => void;
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const getStatusIcon = (status: Session['status']): string => {
  switch (status) {
    case 'voting':
      return '🗳️';
    case 'confirmed':
      return '✅';
    default:
      return '📅';
  }
};

const getStatusLabel = (status: Session['status']): string => {
  switch (status) {
    case 'voting':
      return 'Voting';
    case 'confirmed':
      return 'Confirmed';
    default:
      return 'Planning';
  }
};

const getTotalVotes = (session: Session): number => {
  return session.venues.reduce((sum, v) => sum + v.votes, 0);
};

export function SessionCard({ session, onPress }: SessionCardProps) {
  const isVoting = session.status === 'voting';
  const isConfirmed = session.status === 'confirmed';

  const winnerVenue = isConfirmed
    ? session.venues.find((v) => v.venueId === session.winnerId)
    : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card variant="default" padding="md" style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconContainer}>
            <Typography variant="h3">{getStatusIcon(session.status)}</Typography>
          </View>
          <View style={styles.info}>
            <Typography variant="h4" color="primary" numberOfLines={1}>
              {session.name}
            </Typography>
            {isConfirmed && winnerVenue ? (
              <Typography variant="bodySmall" color="gold" numberOfLines={1}>
                Winner: {winnerVenue.venueName}
              </Typography>
            ) : (
              <Typography variant="bodySmall" color="secondary" numberOfLines={1}>
                {session.venues.length} venues • {getTotalVotes(session)} votes
              </Typography>
            )}
            <Typography variant="caption" color="muted" numberOfLines={1}>
              {getStatusLabel(session.status)}{session.date ? ` • ${formatDate(session.date)}` : ''}{session.time ? ` • ${session.time}` : ''}
            </Typography>
          </View>
          <View style={styles.actionContainer}>
            <Typography variant="caption" color="gold">
              {isVoting ? 'Continue →' : 'View →'}
            </Typography>
          </View>
        </View>
        {session.participants.length > 1 && (
          <View style={styles.participantsRow}>
            <Typography variant="caption" color="muted">
              {session.participants.length} participants
            </Typography>
          </View>
        )}
      </Card>
    </TouchableOpacity>
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
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.dark.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  actionContainer: {
    paddingHorizontal: layoutSpacing.sm,
  },
  participantsRow: {
    marginTop: layoutSpacing.xs,
    paddingLeft: 48 + layoutSpacing.md,
  },
});
