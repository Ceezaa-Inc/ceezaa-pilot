import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography } from '@/components/ui';
import { SessionCard, JoinSessionModal, InvitationCard } from '@/components/session';
import { useSessionStore, Session } from '@/stores/useSessionStore';
import { useAuthStore } from '@/stores/useAuthStore';

export default function SessionsScreen() {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [respondingInvitation, setRespondingInvitation] = useState<string | null>(null);
  const {
    sessions,
    activeSessions: upcomingSessions,
    pastSessions,
    fetchSessions,
    pendingInvitations,
    isLoadingInvitations,
    fetchInvitations,
    acceptInvitation,
    declineInvitation,
  } = useSessionStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.id) {
      fetchSessions(user.id);
      fetchInvitations(user.id);
    }
  }, [user?.id]);

  const handleSessionPress = (session: Session) => {
    if (session.status === 'confirmed') {
      router.push({
        pathname: '/(tabs)/sessions/confirmed',
        params: {
          id: session.id,
          winnerId: session.winnerId,
          winnerName:
            session.venues.find((v) => v.venueId === session.winnerId)?.venueName || '',
        },
      });
    } else {
      router.push({
        pathname: '/(tabs)/sessions/[id]',
        params: { id: session.id },
      });
    }
  };

  const handleJoinSuccess = (session: Session) => {
    setShowJoinModal(false);
    router.push({
      pathname: '/(tabs)/sessions/[id]',
      params: { id: session.id },
    });
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    if (!user?.id) return;
    setRespondingInvitation(invitationId);
    const session = await acceptInvitation(invitationId, user.id);
    setRespondingInvitation(null);
    if (session) {
      router.push({
        pathname: '/(tabs)/sessions/[id]',
        params: { id: session.id },
      });
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    if (!user?.id) return;
    setRespondingInvitation(invitationId);
    await declineInvitation(invitationId, user.id);
    setRespondingInvitation(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Typography variant="h2" color="primary">
            Sessions
          </Typography>
          <Typography variant="body" color="secondary">
            Plan outings with friends
          </Typography>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/sessions/create')}
          >
            <Typography variant="h3">+</Typography>
            <Typography variant="body" color="gold">
              Create Session
            </Typography>
            <Typography variant="caption" color="muted">
              Start a new group vote
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowJoinModal(true)}
          >
            <Typography variant="h3">🔗</Typography>
            <Typography variant="body" color="gold">
              Join by Code
            </Typography>
            <Typography variant="caption" color="muted">
              Enter a friend's code
            </Typography>
          </TouchableOpacity>
        </View>

        {/* Pending Invitations */}
        {(pendingInvitations.length > 0 || isLoadingInvitations) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Typography variant="h4" color="primary">
                Invitations
              </Typography>
              {pendingInvitations.length > 0 && (
                <View style={styles.badge}>
                  <Typography variant="caption" color="primary">
                    {pendingInvitations.length}
                  </Typography>
                </View>
              )}
            </View>
            {isLoadingInvitations ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.primary.DEFAULT} />
              </View>
            ) : (
              pendingInvitations.map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  onAccept={() => handleAcceptInvitation(invitation.id)}
                  onDecline={() => handleDeclineInvitation(invitation.id)}
                  isLoading={respondingInvitation === invitation.id}
                />
              ))
            )}
          </View>
        )}

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <View style={styles.section}>
            <Typography variant="h4" color="primary">
              Upcoming Sessions
            </Typography>
            {upcomingSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onPress={() => handleSessionPress(session)}
              />
            ))}
          </View>
        )}

        {/* Past Sessions */}
        {pastSessions.length > 0 && (
          <View style={styles.section}>
            <Typography variant="h4" color="primary">
              Past Sessions
            </Typography>
            {pastSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onPress={() => handleSessionPress(session)}
              />
            ))}
          </View>
        )}

        {/* Empty State */}
        {sessions.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emojiContainer}>
              <Typography variant="h3" style={styles.emptyEmoji}>
                🎉
              </Typography>
            </View>
            <Typography variant="body" color="muted" align="center">
              No sessions yet
            </Typography>
            <Typography variant="caption" color="muted" align="center">
              Create a session to start planning with friends
            </Typography>
          </View>
        )}
      </ScrollView>

      <JoinSessionModal
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoinSuccess={handleJoinSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  content: {
    padding: layoutSpacing.lg,
    gap: layoutSpacing.lg,
  },
  header: {
    gap: layoutSpacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: layoutSpacing.md,
  },
  actionButton: {
    flex: 1,
    padding: layoutSpacing.md,
    backgroundColor: colors.dark.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.dark.border,
    alignItems: 'center',
    gap: layoutSpacing.xs,
  },
  section: {
    gap: layoutSpacing.sm,
  },
  emptyState: {
    paddingVertical: layoutSpacing.xl,
    alignItems: 'center',
    gap: layoutSpacing.sm,
  },
  emojiContainer: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    lineHeight: 56,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.sm,
  },
  badge: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  loadingContainer: {
    paddingVertical: layoutSpacing.lg,
    alignItems: 'center',
  },
});
