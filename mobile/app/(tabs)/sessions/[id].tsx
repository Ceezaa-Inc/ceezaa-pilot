import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Button, Card } from '@/components/ui';
import { VotingCard, ParticipantList, VenuePickerModal } from '@/components/session';
import { useSessionStore } from '@/stores/useSessionStore';
import { Venue, getVenuesByMood } from '@/mocks/venues';
import { SessionVenue } from '@/mocks/sessions';
import { MoodType } from '@/mocks/taste';

export default function VotingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentSession, setCurrentSession, vote, closeVoting, addVenueToSession, removeVenueFromSession } = useSessionStore();
  const [localVenues, setLocalVenues] = useState<SessionVenue[]>([]);
  const [votedVenues, setVotedVenues] = useState<Set<string>>(new Set());
  const [showVenuePicker, setShowVenuePicker] = useState(false);

  useEffect(() => {
    if (id) {
      setCurrentSession(id);
    }
  }, [id]);

  useEffect(() => {
    if (currentSession) {
      // If session has venues, use them; otherwise generate from mood
      if (currentSession.venues.length > 0) {
        setLocalVenues(currentSession.venues);
      } else if (currentSession.mood) {
        const moodVenues = getVenuesByMood(currentSession.mood as MoodType)
          .slice(0, 5)
          .map((v) => ({
            venueId: v.id,
            venueName: v.name,
            venueType: v.cuisine || v.type,
            matchPercentage: v.matchPercentage,
            votes: 0,
            votedBy: [],
          }));
        setLocalVenues(moodVenues);
      }
    }
  }, [currentSession]);

  const handleVote = (venueId: string) => {
    if (votedVenues.has(venueId)) {
      // Unvote
      setVotedVenues((prev) => {
        const next = new Set(prev);
        next.delete(venueId);
        return next;
      });
      setLocalVenues((prev) =>
        prev.map((v) =>
          v.venueId === venueId ? { ...v, votes: Math.max(0, v.votes - 1) } : v
        )
      );
    } else {
      // Vote
      setVotedVenues((prev) => new Set(prev).add(venueId));
      setLocalVenues((prev) =>
        prev.map((v) => (v.venueId === venueId ? { ...v, votes: v.votes + 1 } : v))
      );
      if (id) {
        vote(id, venueId);
      }
    }
  };

  const handleEndVoting = () => {
    if (id && localVenues.length > 0) {
      // Find winner
      const winner = localVenues.reduce((max, v) => (v.votes > max.votes ? v : max));
      router.replace({
        pathname: '/(tabs)/sessions/confirmed',
        params: { id, winnerId: winner.venueId, winnerName: winner.venueName },
      });
    }
  };

  const handleShareCode = async () => {
    if (currentSession?.code) {
      try {
        await Share.share({
          message: `Join my Ceezaa session! Use code: ${currentSession.code}`,
        });
      } catch (error) {
        // Handle error silently
      }
    }
  };

  const handleAddVenue = (venue: Venue) => {
    if (!id || localVenues.length >= 10) return;

    const sessionVenue: SessionVenue = {
      venueId: venue.id,
      venueName: venue.name,
      venueType: venue.cuisine || venue.type,
      matchPercentage: venue.matchPercentage,
      votes: 0,
      votedBy: [],
    };

    // Add to store
    const success = addVenueToSession(id, sessionVenue);
    if (success) {
      // Add to local state
      setLocalVenues((prev) => [...prev, sessionVenue]);
    }
    setShowVenuePicker(false);
  };

  const handleRemoveVenue = (venueId: string) => {
    if (!id || localVenues.length <= 1) return;

    const success = removeVenueFromSession(id, venueId);
    if (success) {
      setLocalVenues((prev) => prev.filter((v) => v.venueId !== venueId));
      setVotedVenues((prev) => {
        const next = new Set(prev);
        next.delete(venueId);
        return next;
      });
    }
  };

  if (!currentSession) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyState}>
          <Typography variant="h3" color="muted" align="center">
            Session not found
          </Typography>
          <Button label="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const isHost = currentSession.hostId === 'u1';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Typography variant="body" color="primary">
            ← Back
          </Typography>
        </TouchableOpacity>
        <Typography variant="h2" color="primary">
          {currentSession.name}
        </Typography>
        <View style={styles.sessionInfo}>
          <Typography variant="body" color="secondary">
            {currentSession.date} • {currentSession.time}
          </Typography>
          <TouchableOpacity onPress={handleShareCode} style={styles.codeButton}>
            <Typography variant="caption" color="gold">
              Code: {currentSession.code}
            </Typography>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.participantsSection}>
        <Typography variant="label" color="muted" style={styles.sectionLabel}>
          Participants ({currentSession.participants.length})
        </Typography>
        <ParticipantList participants={currentSession.participants} />
      </View>

      <View style={styles.divider} />

      <View style={styles.venuesHeader}>
        <Typography variant="label" color="muted">
          Vote for a venue ({localVenues.length}/10)
        </Typography>
        <TouchableOpacity
          style={[styles.proposeButton, localVenues.length >= 10 && styles.proposeButtonDisabled]}
          onPress={() => setShowVenuePicker(true)}
          disabled={localVenues.length >= 10}
        >
          <Typography variant="caption" color={localVenues.length >= 10 ? 'muted' : 'gold'}>
            + Propose
          </Typography>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {localVenues.length === 0 ? (
          <View style={styles.emptyVenues}>
            <Typography variant="body" color="muted" align="center">
              No venues to vote on yet
            </Typography>
            <TouchableOpacity
              style={styles.addFirstVenueButton}
              onPress={() => setShowVenuePicker(true)}
            >
              <Typography variant="body" color="gold">
                + Add a venue
              </Typography>
            </TouchableOpacity>
          </View>
        ) : (
          localVenues
            .sort((a, b) => b.votes - a.votes)
            .map((venue) => (
              <View key={venue.venueId} style={styles.votingCardWrapper}>
                <VotingCard
                  venue={venue}
                  hasVoted={votedVenues.has(venue.venueId)}
                  onVote={() => handleVote(venue.venueId)}
                />
                {localVenues.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeVenueButton}
                    onPress={() => handleRemoveVenue(venue.venueId)}
                  >
                    <Typography variant="caption" color="muted">
                      ✕
                    </Typography>
                  </TouchableOpacity>
                )}
              </View>
            ))
        )}
      </ScrollView>

      <VenuePickerModal
        visible={showVenuePicker}
        onClose={() => setShowVenuePicker(false)}
        onSelectVenue={handleAddVenue}
        selectedVenueIds={localVenues.map((v) => v.venueId)}
        suggestedMood={currentSession.mood as MoodType | undefined}
        maxVenues={10}
      />

      {isHost && (
        <View style={styles.footer}>
          <Button
            label="End Voting & Pick Winner"
            fullWidth
            onPress={handleEndVoting}
            disabled={localVenues.length === 0}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    paddingHorizontal: layoutSpacing.lg,
    paddingTop: layoutSpacing.md,
    gap: layoutSpacing.xs,
  },
  backButton: {
    marginBottom: layoutSpacing.sm,
  },
  sessionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeButton: {
    paddingHorizontal: layoutSpacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.primary.muted,
    borderRadius: borderRadius.full,
  },
  participantsSection: {
    paddingVertical: layoutSpacing.md,
  },
  sectionLabel: {
    paddingHorizontal: layoutSpacing.lg,
    marginBottom: layoutSpacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.dark.border,
    marginVertical: layoutSpacing.sm,
  },
  venuesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layoutSpacing.lg,
    marginBottom: layoutSpacing.sm,
  },
  proposeButton: {
    paddingHorizontal: layoutSpacing.md,
    paddingVertical: layoutSpacing.xs,
    backgroundColor: colors.primary.muted,
    borderRadius: borderRadius.md,
  },
  proposeButtonDisabled: {
    backgroundColor: colors.dark.surface,
  },
  content: {
    padding: layoutSpacing.lg,
    paddingTop: layoutSpacing.sm,
  },
  emptyVenues: {
    padding: layoutSpacing.xl,
    alignItems: 'center',
    gap: layoutSpacing.md,
  },
  addFirstVenueButton: {
    paddingHorizontal: layoutSpacing.md,
    paddingVertical: layoutSpacing.sm,
    backgroundColor: colors.primary.muted,
    borderRadius: borderRadius.md,
  },
  votingCardWrapper: {
    position: 'relative',
    marginBottom: layoutSpacing.sm,
  },
  removeVenueButton: {
    position: 'absolute',
    top: layoutSpacing.sm,
    right: layoutSpacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.dark.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: layoutSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: layoutSpacing.xl,
    gap: layoutSpacing.lg,
  },
});
