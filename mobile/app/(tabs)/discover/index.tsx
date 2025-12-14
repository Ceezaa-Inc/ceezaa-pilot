import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { Typography, Button } from '@/components/ui';
import { MoodTile, VenueCard } from '@/components/discover';
import { MoodType } from '@/mocks/taste';
import { getTopMatches } from '@/mocks/venues';

const MOODS: MoodType[] = ['chill', 'energetic', 'romantic', 'social', 'adventurous', 'cozy'];

export default function DiscoverScreen() {
  const topVenues = getTopMatches(3);

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

          {topVenues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} onPress={() => handleVenuePress(venue.id)} />
          ))}
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
});
