import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Button, Card } from '@/components/ui';
import { VotingCard, ParticipantList, VenuePickerModal, InviteModal } from '@/components/session';
import { useSessionStore } from '@/stores/useSessionStore';
import { useVaultStore, Place } from '@/stores/useVaultStore';
import { useAuthStore } from '@/stores/useAuthStore';

// Get unique identifier for a place
const getPlaceId = (place: Place): string => place.venueId || place.venueName;

export default function VotingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentSession, setCurrentSession, fetchSession, vote, closeVoting, addVenueToSession, removeVenueFromSession, removeParticipant } = useSessionStore();
  const { places, fetchVisits } = useVaultStore();
  const { user } = useAuthStore();
  const [votedVenues, setVotedVenues] = useState<Set<string>>(new Set());
  const [showVenuePicker, setShowVenuePicker] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Derive venues from currentSession - single source of truth
  const venues = currentSession?.venues || [];
  const sortedVenues = [...venues].sort((a, b) => b.votes - a.votes);
  const totalVotes = venues.reduce((sum, v) => sum + v.votes, 0);

  useEffect(() => {
    if (id) {
      setCurrentSession(id);
    }
  }, [id]);

  // Fetch vault places on mount
  useEffect(() => {
    if (user?.id && places.length === 0) {
      fetchVisits(user.id);
    }
  }, [user?.id, places.length, fetchVisits]);

  // Sync votedVenues from currentSession (track what user has voted for)
  useEffect(() => {
    if (currentSession?.venues && user?.id) {
      const userVotes = new Set(
        currentSession.venues
          .filter((v) => v.votedBy.includes(user.id))
          .map((v) => v.venueId)
      );
      setVotedVenues(userVotes);
    }
  }, [currentSession?.venues, user?.id]);

  const handleVote = async (venueId: string) => {
    if (!id || !user?.id) return;

    if (votedVenues.has(venueId)) {
      // Unvote - just update local UI tracking (API doesn't support unvoting yet)
      setVotedVenues((prev) => {
        const next = new Set(prev);
        next.delete(venueId);
        return next;
      });
    } else {
      // Vote - optimistic UI update then sync with backend
      setVotedVenues((prev) => new Set(prev).add(venueId));
      await vote(id, venueId, user.id);
    }
  };

  const handleEndVoting = async () => {
    if (!id || !user?.id || venues.length === 0) return;

    // Close voting on backend - returns session with winner
    const updatedSession = await closeVoting(id, user.id);

    // Get winner from returned session
    const winnerId = updatedSession?.winnerId;
    const winnerVenue = updatedSession?.venues.find((v) => v.venueId === winnerId);

    router.replace({
      pathname: '/(tabs)/sessions/confirmed',
      params: {
        id,
        winnerId: winnerId || '',
        winnerName: winnerVenue?.venueName || '',
      },
    });
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

  const handleAddPlace = async (place: Place) => {
    if (!id || !user?.id || venues.length >= 10) return;

    // Create venue data for API
    const venueData = place.venueId
      ? { venue_id: place.venueId }
      : { venue_name: place.venueName, venue_type: place.venueType || undefined };

    // Add to store (this calls the API and updates currentSession)
    await addVenueToSession(id, venueData, user.id);
    setShowVenuePicker(false);
  };

  const handleRemoveVenue = (venueId: string) => {
    if (!id || venues.length <= 1) return;

    const success = removeVenueFromSession(id, venueId);
    if (success) {
      // Update votedVenues to remove this venue if voted
      setVotedVenues((prev) => {
        const next = new Set(prev);
        next.delete(venueId);
        return next;
      });
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!id || !user?.id) return;
    await removeParticipant(id, participantId, user.id);
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

  const isHost = currentSession.hostId === user?.id;

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
          Participants ({currentSession.participants.length + (currentSession.pendingInvitations?.length || 0)})
        </Typography>
        <ParticipantList
          participants={currentSession.participants}
          pendingInvitations={currentSession.pendingInvitations}
          onInvitePress={() => setShowInviteModal(true)}
          isHost={isHost}
          onRemoveParticipant={handleRemoveParticipant}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.venuesHeader}>
        <Typography variant="label" color="muted">
          Vote for a venue ({venues.length}/10)
        </Typography>
        <TouchableOpacity
          style={[styles.proposeButton, venues.length >= 10 && styles.proposeButtonDisabled]}
          onPress={() => setShowVenuePicker(true)}
          disabled={venues.length >= 10}
        >
          <Typography variant="caption" color={venues.length >= 10 ? 'muted' : 'gold'}>
            + Propose
          </Typography>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {venues.length === 0 ? (
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
          sortedVenues.map((venue) => (
            <View key={venue.venueId} style={styles.votingCardWrapper}>
              <VotingCard
                venue={venue}
                hasVoted={votedVenues.has(venue.venueId)}
                onVote={() => handleVote(venue.venueId)}
                totalVotes={totalVotes}
              />
              {venues.length > 1 && (
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
        onSelectPlace={handleAddPlace}
        selectedPlaceIds={venues.map((v) => v.venueId)}
        places={places}
        maxVenues={10}
        userId={user?.id}
      />

      <InviteModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        mode="invite"
        sessionId={id as string}
        sessionCode={currentSession?.code}
        sessionName={currentSession?.name}
        userId={user?.id || ''}
        onInvitesSent={() => id && fetchSession(id)}
      />

      {isHost && (
        <View style={styles.footer}>
          <Button
            label="End Voting & Pick Winner"
            fullWidth
            onPress={handleEndVoting}
            disabled={venues.length === 0}
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
