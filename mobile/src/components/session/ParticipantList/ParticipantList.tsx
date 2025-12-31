import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { Typography } from '@/components/ui';
import { Participant } from '@/mocks/sessions';

interface ParticipantListProps {
  participants: Participant[];
  maxVisible?: number;
  onInvitePress?: () => void;
}

const AVATAR_COLORS = [
  colors.primary.DEFAULT,
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
];

export function ParticipantList({ participants, maxVisible = 5, onInvitePress }: ParticipantListProps) {
  const visibleParticipants = participants.slice(0, maxVisible);
  const overflow = participants.length - maxVisible;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {visibleParticipants.map((participant, index) => (
        <View key={participant.id} style={styles.participant}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] },
              participant.hasVoted && styles.avatarVoted,
            ]}
          >
            <Typography variant="bodySmall" color="primary">
              {participant.name.charAt(0).toUpperCase()}
            </Typography>
          </View>
          <Typography
            variant="caption"
            color={participant.hasVoted ? 'primary' : 'muted'}
            align="center"
            numberOfLines={1}
          >
            {participant.isHost ? `${participant.name} (Host)` : participant.name}
          </Typography>
          {participant.hasVoted && (
            <View style={styles.votedBadge}>
              <Typography variant="caption" color="primary">
                ✓
              </Typography>
            </View>
          )}
        </View>
      ))}
      {overflow > 0 && (
        <View style={styles.participant}>
          <View style={[styles.avatar, styles.overflowAvatar]}>
            <Typography variant="bodySmall" color="muted">
              +{overflow}
            </Typography>
          </View>
          <Typography variant="caption" color="muted" align="center">
            more
          </Typography>
        </View>
      )}
      {onInvitePress && (
        <TouchableOpacity style={styles.participant} onPress={onInvitePress}>
          <View style={[styles.avatar, styles.inviteAvatar]}>
            <Typography variant="h4" color="gold">
              +
            </Typography>
          </View>
          <Typography variant="caption" color="gold" align="center">
            Invite
          </Typography>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: layoutSpacing.lg,
    gap: layoutSpacing.md,
  },
  participant: {
    alignItems: 'center',
    width: 64,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarVoted: {
    borderWidth: 2,
    borderColor: colors.primary.DEFAULT,
  },
  votedBadge: {
    position: 'absolute',
    top: 0,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overflowAvatar: {
    backgroundColor: colors.dark.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderStyle: 'dashed',
  },
  inviteAvatar: {
    backgroundColor: colors.primary.muted,
    borderWidth: 2,
    borderColor: colors.primary.DEFAULT,
    borderStyle: 'dashed',
  },
});
