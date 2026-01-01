import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { Typography } from '@/components/ui';
import { Participant } from '@/mocks/sessions';

export interface PendingInvitation {
  id: string;
  name: string;
}

interface ParticipantListProps {
  participants: Participant[];
  pendingInvitations?: PendingInvitation[];
  maxVisible?: number;
  onInvitePress?: () => void;
  isHost?: boolean;
  onRemoveParticipant?: (participantId: string) => void;
}

const AVATAR_COLORS = [
  colors.primary.DEFAULT,
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
];

export function ParticipantList({
  participants,
  pendingInvitations = [],
  maxVisible = 5,
  onInvitePress,
  isHost = false,
  onRemoveParticipant,
}: ParticipantListProps) {
  const visibleParticipants = participants.slice(0, maxVisible);
  const totalCount = participants.length + pendingInvitations.length;
  const overflow = totalCount - maxVisible;

  const showParticipantStatus = (name: string, status: 'accepted' | 'invited') => {
    Alert.alert(
      name,
      status === 'accepted' ? 'Joined session' : 'Invitation pending',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {visibleParticipants.map((participant, index) => (
        <TouchableOpacity
          key={participant.id}
          style={styles.participant}
          onPress={() => showParticipantStatus(participant.name, 'accepted')}
          activeOpacity={0.7}
        >
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
          {isHost && !participant.isHost && onRemoveParticipant && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemoveParticipant(participant.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Typography variant="caption" color="muted">
                ✕
              </Typography>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      ))}
      {pendingInvitations.slice(0, Math.max(0, maxVisible - visibleParticipants.length)).map((invite, index) => (
        <TouchableOpacity
          key={`invite-${invite.id}`}
          style={styles.participant}
          onPress={() => showParticipantStatus(invite.name, 'invited')}
          activeOpacity={0.7}
        >
          <View style={[styles.avatar, styles.invitedAvatar]}>
            <Typography variant="bodySmall" color="muted">
              {invite.name.charAt(0).toUpperCase()}
            </Typography>
          </View>
          <Typography
            variant="caption"
            color="muted"
            align="center"
            numberOfLines={1}
          >
            {invite.name}
          </Typography>
          <View style={styles.invitedBadge}>
            <Typography variant="caption" color="muted">
              -
            </Typography>
          </View>
        </TouchableOpacity>
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
  removeButton: {
    position: 'absolute',
    top: -4,
    left: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.dark.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.dark.border,
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
  invitedAvatar: {
    backgroundColor: colors.dark.surfaceAlt,
    opacity: 0.7,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderStyle: 'dashed',
  },
  invitedBadge: {
    position: 'absolute',
    top: 0,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.dark.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.dark.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
