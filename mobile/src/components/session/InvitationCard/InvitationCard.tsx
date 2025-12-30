import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card, Button } from '@/components/ui';
import { Invitation } from '@/services/api';

interface InvitationCardProps {
  invitation: Invitation;
  onAccept: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '';
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

export function InvitationCard({ invitation, onAccept, onDecline, isLoading }: InvitationCardProps) {
  return (
    <Card variant="default" padding="md" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {invitation.inviter_avatar ? (
            <View style={styles.avatar}>
              <Typography variant="body" color="primary">
                {invitation.inviter_name.charAt(0).toUpperCase()}
              </Typography>
            </View>
          ) : (
            <View style={styles.avatar}>
              <Typography variant="body" color="primary">
                {invitation.inviter_name.charAt(0).toUpperCase()}
              </Typography>
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Typography variant="bodySmall" color="secondary">
            {invitation.inviter_name} invited you to
          </Typography>
          <Typography variant="h4" color="primary" numberOfLines={1}>
            {invitation.session_title}
          </Typography>
          <View style={styles.metaRow}>
            {invitation.session_date && (
              <Typography variant="caption" color="muted">
                {formatDate(invitation.session_date)}
              </Typography>
            )}
            {invitation.session_date && (
              <Typography variant="caption" color="muted">
                {' '}&middot;{' '}
              </Typography>
            )}
            <Typography variant="caption" color="muted">
              {invitation.participant_count} going
            </Typography>
            <Typography variant="caption" color="muted">
              {' '}&middot;{' '}
            </Typography>
            <Typography variant="caption" color="muted">
              {invitation.venue_count} venues
            </Typography>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.declineButton]}
          onPress={onDecline}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Typography variant="bodySmall" color="muted">
            Decline
          </Typography>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={onAccept}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Typography variant="bodySmall" color="primary">
            Accept
          </Typography>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: layoutSpacing.sm,
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: layoutSpacing.md,
  },
  avatarContainer: {
    width: 40,
    height: 40,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: layoutSpacing.sm,
    marginTop: layoutSpacing.md,
    paddingTop: layoutSpacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  actionButton: {
    flex: 1,
    paddingVertical: layoutSpacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: colors.dark.surfaceAlt,
  },
  acceptButton: {
    backgroundColor: colors.primary.DEFAULT,
  },
});
