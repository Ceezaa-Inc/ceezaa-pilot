import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography } from '@/components/ui';
import { SessionCard, JoinSessionModal } from '@/components/session';
import { useSessionStore } from '@/stores/useSessionStore';
import { Session } from '@/mocks/sessions';

export default function SessionsScreen() {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const { getUserSessions } = useSessionStore();
  const userSessions = getUserSessions();

  // Separate active and past sessions
  const activeSessions = userSessions.filter(
    (s) => s.status === 'voting' || s.status === 'pending'
  );
  const pastSessions = userSessions.filter((s) => s.status === 'confirmed');

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

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <View style={styles.section}>
            <Typography variant="h4" color="primary">
              Active Sessions
            </Typography>
            {activeSessions.map((session) => (
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
        {userSessions.length === 0 && (
          <View style={styles.emptyState}>
            <Typography variant="h3" style={styles.emptyEmoji}>
              🎉
            </Typography>
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
  emptyEmoji: {
    fontSize: 48,
  },
});
