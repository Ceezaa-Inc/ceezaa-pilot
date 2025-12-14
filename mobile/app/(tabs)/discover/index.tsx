import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Button } from '@/components/ui';
import { MoodTile, VenueCard } from '@/components/discover';
import { SessionCard, JoinSessionModal } from '@/components/session';
import { useSessionStore } from '@/stores/useSessionStore';
import { MoodType } from '@/mocks/taste';
import { getTopMatches } from '@/mocks/venues';
import { Session } from '@/mocks/sessions';

const MOODS: MoodType[] = ['chill', 'energetic', 'romantic', 'social', 'adventurous', 'cozy'];

export default function DiscoverScreen() {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const { getUserSessions } = useSessionStore();
  const topVenues = getTopMatches(3);
  const userSessions = getUserSessions();

  const handleMoodPress = (mood: MoodType) => {
    router.push({
      pathname: '/(tabs)/discover/feed',
      params: { mood },
    });
  };

  const handleVenuePress = (venueId: string) => {
    router.push({
      pathname: '/(tabs)/discover/venue/[id]',
      params: { id: venueId },
    });
  };

  const handleSessionPress = (session: Session) => {
    if (session.status === 'confirmed') {
      router.push({
        pathname: '/(tabs)/discover/session/confirmed',
        params: { id: session.id, winnerId: session.winnerId, winnerName: session.venues.find(v => v.venueId === session.winnerId)?.venueName || '' },
      });
    } else {
      router.push({
        pathname: '/(tabs)/discover/session/[id]',
        params: { id: session.id },
      });
    }
  };

  const handleJoinSuccess = (session: Session) => {
    setShowJoinModal(false);
    router.push({
      pathname: '/(tabs)/discover/session/[id]',
      params: { id: session.id },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Typography variant="h2" color="primary">
            Discover
          </Typography>
          <Typography variant="body" color="secondary">
            What mood are you in?
          </Typography>
        </View>

        {/* Mood Grid */}
        <View style={styles.moodGrid}>
          {MOODS.map((mood) => (
            <MoodTile key={mood} mood={mood} onPress={() => handleMoodPress(mood)} />
          ))}
        </View>

        {/* Plan with Friends */}
        <View style={styles.planWithFriends}>
          <Typography variant="h4" color="primary">
            Going out with friends?
          </Typography>
          <View style={styles.planButtons}>
            <TouchableOpacity
              style={styles.planButton}
              onPress={() => router.push('/(tabs)/discover/session/create')}
            >
              <Typography variant="body" color="gold">
                + Create Session
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.planButton}
              onPress={() => setShowJoinModal(true)}
            >
              <Typography variant="body" color="gold">
                Join by Code
              </Typography>
            </TouchableOpacity>
          </View>
        </View>

        {/* My Sessions */}
        {userSessions.length > 0 && (
          <View style={styles.section}>
            <Typography variant="h3" color="primary">
              My Sessions
            </Typography>
            {userSessions.slice(0, 3).map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onPress={() => handleSessionPress(session)}
              />
            ))}
          </View>
        )}

        {/* For You Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typography variant="h3" color="primary">
              For You
            </Typography>
            <Button
              label="See all"
              variant="ghost"
              size="sm"
              onPress={() => router.push('/(tabs)/discover/feed')}
            />
          </View>

          {topVenues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} onPress={() => handleVenuePress(venue.id)} />
          ))}
        </View>
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
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layoutSpacing.sm,
  },
  planWithFriends: {
    padding: layoutSpacing.md,
    backgroundColor: colors.dark.surface,
    borderRadius: borderRadius.lg,
    gap: layoutSpacing.sm,
    alignItems: 'center',
  },
  planButtons: {
    flexDirection: 'row',
    gap: layoutSpacing.sm,
    width: '100%',
  },
  planButton: {
    flex: 1,
    paddingVertical: layoutSpacing.md,
    backgroundColor: colors.primary.muted,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  section: {
    gap: layoutSpacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
