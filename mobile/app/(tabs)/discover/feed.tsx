import React, { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography } from '@/components/ui';
import { VenueCard } from '@/components/discover';
import { useDiscoverFeed } from '@/hooks';
import { useAuthStore } from '@/stores/useAuthStore';
import { MoodOption } from '@/services/api';

export default function FeedScreen() {
  const { mood: initialMood } = useLocalSearchParams<{ mood?: string }>();
  const { user } = useAuthStore();
  const userId = user?.id || 'test-user';

  const {
    venues,
    moods,
    selectedMood,
    total,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    fetchFeed,
    fetchMoods,
    loadMore,
    setMood,
  } = useDiscoverFeed();

  // Fetch moods on mount
  useEffect(() => {
    fetchMoods();
  }, [fetchMoods]);

  // Fetch feed when user or mood changes
  useEffect(() => {
    if (userId) {
      fetchFeed(userId, { mood: initialMood || undefined });
    }
  }, [userId, initialMood, fetchFeed]);

  const handleRefresh = useCallback(() => {
    fetchFeed(userId, { mood: selectedMood || undefined });
  }, [userId, selectedMood, fetchFeed]);

  const handleVenuePress = (venueId: string) => {
    router.push({
      pathname: '/(tabs)/discover/venue/[id]',
      params: { id: venueId },
    });
  };

  const handleFilterPress = (moodId: string) => {
    const newMood = moodId === selectedMood ? null : moodId;
    setMood(newMood);
    fetchFeed(userId, { mood: newMood || undefined });
  };

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      loadMore(userId);
    }
  }, [hasMore, isLoadingMore, loadMore, userId]);

  // Get title from selected mood
  const getMoodLabel = (moodId: string | null): string => {
    if (!moodId) return 'All Venues';
    const mood = moods.find((m) => m.id === moodId);
    return mood?.label || 'All Venues';
  };

  const title = getMoodLabel(selectedMood);

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
          {isLoading ? 'Loading...' : `${total} places found`}
        </Typography>
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {moods.map((m: MoodOption) => {
            const isActive = m.id === selectedMood;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => handleFilterPress(m.id)}
              >
                <Typography variant="bodySmall" color={isActive ? 'gold' : 'primary'}>
                  {m.emoji} {m.label}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Venue List */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={colors.primary.DEFAULT} />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 100;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            handleEndReached();
          }
        }}
        scrollEventThrottle={400}
      >
        {error ? (
          <View style={styles.emptyState}>
            <Typography variant="h3" color="muted" align="center">
              Something went wrong
            </Typography>
            <Typography variant="body" color="muted" align="center">
              {error}
            </Typography>
          </View>
        ) : venues.length === 0 && !isLoading ? (
          <View style={styles.emptyState}>
            <Typography variant="h3" color="muted" align="center">
              No venues found
            </Typography>
            <Typography variant="body" color="muted" align="center">
              Try a different mood filter
            </Typography>
          </View>
        ) : (
          <>
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} onPress={() => handleVenuePress(venue.id)} />
            ))}
            {isLoadingMore && (
              <View style={styles.loadingMore}>
                <ActivityIndicator color={colors.primary.DEFAULT} />
              </View>
            )}
          </>
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
  loadingMore: {
    paddingVertical: layoutSpacing.lg,
    alignItems: 'center',
  },
});
