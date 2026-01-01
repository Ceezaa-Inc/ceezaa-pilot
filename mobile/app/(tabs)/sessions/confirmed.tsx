import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Share, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Button, Card } from '@/components/ui';
import { ParticipantList } from '@/components/session';
import { useSessionStore } from '@/stores/useSessionStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { getVenueById } from '@/mocks/venues';

export default function ConfirmedScreen() {
  const { id, winnerId: paramWinnerId, winnerName: paramWinnerName } = useLocalSearchParams<{
    id: string;
    winnerId: string;
    winnerName: string;
  }>();

  const { currentSession, setCurrentSession, fetchSession, reopenVoting } = useSessionStore();
  const { user } = useAuthStore();
  const [isReopening, setIsReopening] = useState(false);

  useEffect(() => {
    if (id) {
      setCurrentSession(id);
      // Fetch full session data to get winnerId
      fetchSession(id);
    }
  }, [id]);

  // Use params if available, otherwise fall back to currentSession data
  const winnerId = paramWinnerId || currentSession?.winnerId || '';
  const winnerVenueFromSession = currentSession?.venues?.find((v) => v.venueId === winnerId);
  const winnerName = paramWinnerName || winnerVenueFromSession?.venueName || '';
  const winnerVenue = winnerId ? getVenueById(winnerId) : null;

  const handleViewDetails = () => {
    if (winnerId) {
      router.push({
        pathname: '/(tabs)/discover/venue/[id]',
        params: { id: winnerId },
      });
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `We're going to ${winnerName || winnerVenue?.name}! Join us on ${currentSession?.date} at ${currentSession?.time}.`,
      });
    } catch (error) {
      // Handle silently
    }
  };

  const handleDone = () => {
    router.replace('/(tabs)/sessions');
  };

  const handleReopenVoting = async () => {
    if (!id || !user?.id) return;
    setIsReopening(true);
    const session = await reopenVoting(id, user.id);
    setIsReopening(false);
    if (session) {
      // Navigate back to voting screen
      router.replace({
        pathname: '/(tabs)/sessions/[id]',
        params: { id },
      });
    }
  };

  // Check if user is host
  const isHost = currentSession?.hostId === user?.id;

  // Check if session is upcoming (date >= today or no date set)
  const isUpcoming = (() => {
    if (!currentSession?.date) return true; // No date = upcoming
    const today = new Date().toISOString().split('T')[0];
    return currentSession.date >= today;
  })();

  // Show reopen option for host on upcoming confirmed sessions
  const canReopenVoting = isHost && isUpcoming && currentSession?.status === 'confirmed';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.celebrationSection}>
          <Typography variant="h1" align="center" style={styles.emoji}>
            {winnerId ? '🎉' : '📋'}
          </Typography>
          <Typography variant="h2" color="primary" align="center">
            {winnerId ? "It's Decided!" : 'Session Ended'}
          </Typography>
          <Typography variant="body" color="secondary" align="center">
            {winnerId ? 'Your group has voted' : 'No votes were cast'}
          </Typography>
        </View>

        {winnerId ? (
          <Card variant="default" padding="lg" style={styles.winnerCard}>
            <View style={styles.winnerContent}>
              <Typography variant="h2" align="center" style={styles.winnerEmoji}>
                🏆
              </Typography>
              <Typography variant="h3" color="primary" align="center">
                {winnerName || winnerVenue?.name || 'Selected Venue'}
              </Typography>
              {winnerVenue && (
                <>
                  <Typography variant="body" color="secondary" align="center">
                    {winnerVenue.cuisine || winnerVenue.type}
                  </Typography>
                  <Typography variant="caption" color="muted" align="center">
                    {winnerVenue.neighborhood} • {winnerVenue.distance}
                  </Typography>
                </>
              )}
            </View>
            {currentSession && (
              <View style={styles.dateTime}>
                <Typography variant="label" color="gold" align="center">
                  {currentSession.date} • {currentSession.time}
                </Typography>
              </View>
            )}
          </Card>
        ) : (
          <Card variant="default" padding="lg" style={styles.noWinnerCard}>
            <Typography variant="body" color="muted" align="center">
              This session ended without a winner.
            </Typography>
            <Typography variant="caption" color="muted" align="center" style={styles.noWinnerHint}>
              Create a new session to plan your next outing!
            </Typography>
          </Card>
        )}

        {currentSession && currentSession.participants.length > 0 && (
          <View style={styles.participantsSection}>
            <Typography variant="caption" color="muted" align="center">
              GOING WITH
            </Typography>
            <View style={styles.participantsContainer}>
              <ParticipantList
                participants={currentSession.participants}
                maxVisible={6}
              />
            </View>
          </View>
        )}

        <View style={styles.buttonsSection}>
          <Button
            label="View Venue Details"
            fullWidth
            onPress={handleViewDetails}
            disabled={!winnerId}
          />
          <Button
            label="Share Plan"
            variant="secondary"
            fullWidth
            onPress={handleShare}
          />
          {canReopenVoting && (
            <Button
              label={isReopening ? 'Reopening...' : 'Reopen Voting'}
              variant="secondary"
              fullWidth
              onPress={handleReopenVoting}
              disabled={isReopening}
            />
          )}
          <Button
            label="Back to Sessions"
            variant="ghost"
            fullWidth
            onPress={handleDone}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
    overflow: 'visible',
  },
  scrollView: {
    flex: 1,
    overflow: 'visible',
  },
  content: {
    flexGrow: 1,
    padding: layoutSpacing.lg,
    paddingTop: layoutSpacing.xl,
    gap: layoutSpacing.lg,
  },
  celebrationSection: {
    alignItems: 'center',
    gap: layoutSpacing.sm,
    marginTop: layoutSpacing.md,
  },
  emoji: {
    fontSize: 44,
    lineHeight: 52,
  },
  winnerCard: {
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary.DEFAULT,
  },
  noWinnerCard: {
    alignItems: 'center',
    gap: layoutSpacing.sm,
  },
  noWinnerHint: {
    marginTop: layoutSpacing.xs,
  },
  winnerContent: {
    alignItems: 'center',
    gap: layoutSpacing.sm,
  },
  winnerEmoji: {
    fontSize: 36,
  },
  dateTime: {
    marginTop: layoutSpacing.md,
    paddingTop: layoutSpacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
    width: '100%',
  },
  participantsSection: {
    gap: layoutSpacing.md,
  },
  participantsContainer: {
    alignItems: 'center',
  },
  buttonsSection: {
    gap: layoutSpacing.sm,
    marginTop: layoutSpacing.md,
    paddingBottom: layoutSpacing.xl,
  },
});
