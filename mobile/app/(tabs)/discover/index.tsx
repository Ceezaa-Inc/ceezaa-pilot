import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { Typography, Button } from '@/components/ui';
import { MoodTile, VenueCard } from '@/components/discover';
import { useDiscoverFeed } from '@/hooks';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLocationStore } from '@/stores/useLocationStore';
import { MoodType } from '@/mocks/taste';

const MOODS: MoodType[] = ['chill', 'energetic', 'romantic', 'social', 'adventurous', 'cozy'];

export default function DiscoverScreen() {
  const { user } = useAuthStore();
  const userId = user?.id || 'test-user';
  const { city } = useLocationStore();

  const { venues, isLoading, fetchFeed } = useDiscoverFeed();

  // Fetch feed on mount with city filter
  useEffect(() => {
    if (userId) {
      fetchFeed(userId, { city: city || undefined });
    }
  }, [userId, city, fetchFeed]);

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

  // Get top 3 venues for For You section
  const topVenues = venues.slice(0, 3);

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

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.primary.DEFAULT} />
            </View>
          ) : topVenues.length > 0 ? (
            topVenues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} onPress={() => handleVenuePress(venue.id)} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Typography variant="body" color="muted" align="center">
                Complete the taste quiz to get personalized recommendations
              </Typography>
            </View>
          )}
        </View>
      </ScrollView>
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
  section: {
    gap: layoutSpacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loadingContainer: {
    paddingVertical: layoutSpacing.xl,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: layoutSpacing.lg,
    alignItems: 'center',
  },
});
