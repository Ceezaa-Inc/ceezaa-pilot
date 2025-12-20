import React, { useEffect } from 'react';
import { View, StyleSheet, Share, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Button, Card } from '@/components/ui';
import { ParticipantList } from '@/components/session';
import { useSessionStore } from '@/stores/useSessionStore';
import { getVenueById } from '@/mocks/venues';

export default function ConfirmedScreen() {
  const { id, winnerId, winnerName } = useLocalSearchParams<{
    id: string;
    winnerId: string;
    winnerName: string;
  }>();

  const { currentSession, setCurrentSession } = useSessionStore();

  useEffect(() => {
    if (id) {
      setCurrentSession(id);
    }
  }, [id]);
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.celebrationSection}>
          <Typography variant="h1" align="center" style={styles.emoji}>
            🎉
          </Typography>
          <Typography variant="h2" color="primary" align="center">
            It's Decided!
          </Typography>
          <Typography variant="body" color="secondary" align="center">
            Your group has voted
          </Typography>
        </View>

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
