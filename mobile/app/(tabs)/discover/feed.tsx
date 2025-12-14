import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography } from '@/components/ui';
import { VenueCard } from '@/components/discover';
import { MoodType, MOOD_DATA } from '@/mocks/taste';
import { getVenuesByMood, VENUES } from '@/mocks/venues';

const MOODS: MoodType[] = ['chill', 'energetic', 'romantic', 'social', 'adventurous', 'cozy'];

export default function FeedScreen() {
  const { mood } = useLocalSearchParams<{ mood?: string }>();
  const selectedMood = mood as MoodType | undefined;

  const venues = selectedMood ? getVenuesByMood(selectedMood) : VENUES;
  const title = selectedMood ? MOOD_DATA[selectedMood].label : 'All Venues';

  const handleVenuePress = (venueId: string) => {
    router.push({
      pathname: '/(tabs)/discover/venue/[id]',
      params: { id: venueId },
    });
  };

  const handleFilterPress = (newMood: MoodType) => {
    if (newMood === selectedMood) {
      // Deselect - show all
      router.setParams({ mood: '' });
    } else {
      router.setParams({ mood: newMood });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Typography variant="body" color="primary">
            ← Back
          </Typography>
        </TouchableOpacity>
        <Typography variant="h2" color="primary">
          {title}
        </Typography>
        <Typography variant="body" color="secondary">
          {venues.length} places found
        </Typography>
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {MOODS.map((m) => {
            const isActive = m === selectedMood;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => handleFilterPress(m)}
              >
                <Typography variant="bodySmall" color={isActive ? 'gold' : 'primary'}>
                  {MOOD_DATA[m].label}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Venue List */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {venues.length === 0 ? (
          <View style={styles.emptyState}>
            <Typography variant="h3" color="muted" align="center">
              No venues found
            </Typography>
            <Typography variant="body" color="muted" align="center">
              Try a different mood filter
            </Typography>
          </View>
        ) : (
          venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} onPress={() => handleVenuePress(venue.id)} />
          ))
        )}
      </ScrollView>
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
  filtersWrapper: {
    height: 56,
  },
  filtersContent: {
    paddingHorizontal: layoutSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: layoutSpacing.md,
    paddingVertical: layoutSpacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
    marginRight: layoutSpacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary.muted,
    borderColor: colors.primary.DEFAULT,
  },
  content: {
    padding: layoutSpacing.lg,
    paddingTop: 0,
  },
  emptyState: {
    paddingVertical: layoutSpacing.xl,
    gap: layoutSpacing.sm,
  },
});
