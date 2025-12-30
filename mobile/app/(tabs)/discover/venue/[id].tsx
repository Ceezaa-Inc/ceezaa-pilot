import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card, Button } from '@/components/ui';
import { getVenueById, formatHoursForDisplay, Venue } from '@/mocks/venues';
import { discoverApi, DiscoverVenue } from '@/services/api';
import { useAuthStore } from '@/stores/useAuthStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 250;

type VenueDisplay = {
  name: string;
  cuisineType: string;
  priceString: string;
  neighborhood: string;
  rating: number | null;
  reviewCount: number | null;
  matchScore: number;
  address: string;
  tagline: string | null;
  tags: string[];
  features: string[];
  bestFor: string[];
  photoUrls: string[];
};

function getMockVenueDisplay(venue: Venue): VenueDisplay {
  return {
    name: venue.name,
    cuisineType: venue.cuisine || venue.type,
    priceString: '$'.repeat(venue.priceLevel),
    neighborhood: venue.neighborhood,
    rating: venue.rating,
    reviewCount: venue.reviewCount,
    matchScore: venue.matchPercentage,
    address: venue.address,
    tagline: null,
    tags: venue.tags,
    features: venue.features,
    bestFor: venue.moods,
    photoUrls: venue.image ? [venue.image] : [],
  };
}

function getApiVenueDisplay(venue: DiscoverVenue): VenueDisplay {
  return {
    name: venue.name,
    cuisineType: venue.cuisine_type || venue.taste_cluster || 'Restaurant',
    priceString: venue.price_tier || '$$',
    neighborhood: venue.formatted_address?.split(',')[0] || '',
    rating: venue.google_rating,
    reviewCount: null,
    matchScore: venue.match_score,
    address: venue.formatted_address || '',
    tagline: venue.tagline,
    tags: [],
    features: [],
    bestFor: venue.best_for || [],
    photoUrls: venue.photo_urls || [],
  };
}

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const userId = user?.id || 'test-user';

  const [isLoading, setIsLoading] = useState(false);
  const [apiVenue, setApiVenue] = useState<DiscoverVenue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // First try mock venue
  const mockVenue = getVenueById(id || '');

  // If no mock venue, fetch from API
  useEffect(() => {
    if (!mockVenue && id) {
      setIsLoading(true);
      discoverApi.getVenue(id, userId)
        .then((venue) => {
          setApiVenue(venue);
          setError(null);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load venue');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id, mockVenue, userId]);

  // Determine display data
  const display: VenueDisplay | null = mockVenue
    ? getMockVenueDisplay(mockVenue)
    : apiVenue
      ? getApiVenueDisplay(apiVenue)
      : null;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Typography variant="body" color="primary">
              ← Back
            </Typography>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.primary.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

  if (!display || error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Typography variant="body" color="primary">
              ← Back
            </Typography>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Typography variant="h3" color="muted" align="center">
            {error || 'Venue not found'}
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentImageIndex(slideIndex);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image Carousel */}
        <View style={styles.heroContainer}>
          {display.photoUrls.length > 0 ? (
            <FlatList
              data={display.photoUrls}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.heroImage} resizeMode="cover" />
              )}
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Typography variant="h1">🍽️</Typography>
            </View>
          )}
          <TouchableOpacity style={styles.backButtonOverlay} onPress={() => router.back()}>
            <Typography variant="body" color="primary">
              ←
            </Typography>
          </TouchableOpacity>
          <View style={styles.matchBadge}>
            <Typography variant="h4" color="gold">
              {display.matchScore}% Match
            </Typography>
          </View>
          {/* Pagination Dots */}
          {display.photoUrls.length > 1 && (
            <View style={styles.paginationDots}>
              {display.photoUrls.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, currentImageIndex === index && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Header Info */}
          <View style={styles.headerInfo}>
            <Typography variant="h2" color="primary">
              {display.name}
            </Typography>
            {display.tagline && (
              <Typography variant="body" color="secondary">
                {display.tagline}
              </Typography>
            )}
            <View style={styles.metaRow}>
              <Typography variant="body" color="secondary">
                {display.cuisineType} • {display.priceString} • {display.neighborhood}
              </Typography>
            </View>
            {display.rating && (
              <View style={styles.ratingRow}>
                <Typography variant="body" color="gold">
                  ★ {display.rating}
                </Typography>
                {display.reviewCount && (
                  <Typography variant="bodySmall" color="muted">
                    ({display.reviewCount} reviews)
                  </Typography>
                )}
              </View>
            )}
          </View>

          {/* Tags */}
          {display.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {display.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Typography variant="caption" color="secondary">
                    {tag}
                  </Typography>
                </View>
              ))}
            </View>
          )}

          {/* Details Card */}
          {display.address && (
            <Card variant="default" padding="md" style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Typography variant="body" color="muted">
                  📍 Address
                </Typography>
                <Typography variant="body" color="primary" style={styles.addressText}>
                  {display.address}
                </Typography>
              </View>
            </Card>
          )}

          {/* Hours Section - only for mock venues */}
          {mockVenue && (
            <View style={styles.section}>
              <Typography variant="label" color="muted">
                Hours
              </Typography>
              <Card variant="default" padding="md" style={styles.hoursCard}>
                {formatHoursForDisplay(mockVenue.hours).map((item, index) => (
                  <View key={index} style={styles.hoursRow}>
                    <Typography variant="bodySmall" color="secondary">
                      {item.label}
                    </Typography>
                    <Typography
                      variant="bodySmall"
                      color={item.time === 'Closed' ? 'muted' : 'primary'}
                    >
                      {item.time}
                    </Typography>
                  </View>
                ))}
              </Card>
            </View>
          )}

          {/* Features */}
          {display.features.length > 0 && (
            <View style={styles.section}>
              <Typography variant="label" color="muted">
                Features
              </Typography>
              <View style={styles.featuresGrid}>
                {display.features.map((feature) => (
                  <View key={feature} style={styles.featureItem}>
                    <Typography variant="bodySmall" color="secondary">
                      ✓ {feature}
                    </Typography>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Best For */}
          {display.bestFor.length > 0 && (
            <View style={styles.section}>
              <Typography variant="label" color="muted">
                Best For
              </Typography>
              <View style={styles.moodsRow}>
                {display.bestFor.map((item) => (
                  <View key={item} style={styles.moodChip}>
                    <Typography variant="caption" color="primary">
                      {item.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Typography>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCTA}>
        <Button label="Book a Table" fullWidth onPress={() => {}} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  heroContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  heroPlaceholder: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    backgroundColor: colors.dark.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonOverlay: {
    position: 'absolute',
    top: layoutSpacing.md,
    left: layoutSpacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchBadge: {
    position: 'absolute',
    bottom: layoutSpacing.md,
    right: layoutSpacing.md,
    paddingHorizontal: layoutSpacing.md,
    paddingVertical: layoutSpacing.sm,
    backgroundColor: colors.primary.muted,
    borderRadius: borderRadius.md,
  },
  content: {
    padding: layoutSpacing.lg,
    gap: layoutSpacing.lg,
  },
  headerInfo: {
    gap: layoutSpacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layoutSpacing.sm,
  },
  tag: {
    paddingHorizontal: layoutSpacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.dark.surface,
    borderRadius: borderRadius.sm,
  },
  detailsCard: {
    gap: layoutSpacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: layoutSpacing.md,
  },
  addressText: {
    flex: 1,
    textAlign: 'right',
  },
  hoursCard: {
    gap: layoutSpacing.sm,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  section: {
    gap: layoutSpacing.sm,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layoutSpacing.sm,
  },
  featureItem: {
    width: '48%',
  },
  moodsRow: {
    flexDirection: 'row',
    gap: layoutSpacing.sm,
  },
  moodChip: {
    paddingHorizontal: layoutSpacing.md,
    paddingVertical: layoutSpacing.sm,
    backgroundColor: colors.primary.muted,
    borderRadius: borderRadius.full,
  },
  bottomCTA: {
    padding: layoutSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: layoutSpacing.xl,
  },
  header: {
    padding: layoutSpacing.lg,
  },
  paginationDots: {
    position: 'absolute',
    bottom: layoutSpacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    backgroundColor: colors.primary.DEFAULT,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
