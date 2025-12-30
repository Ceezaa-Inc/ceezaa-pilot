import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Carousel from 'react-native-reanimated-carousel';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card, Button } from '@/components/ui';
import { discoverApi, DiscoverVenue } from '@/services/api';
import { useAuthStore } from '@/stores/useAuthStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 300;

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const userId = user?.id || 'test-user';

  const [isLoading, setIsLoading] = useState(true);
  const [venue, setVenue] = useState<DiscoverVenue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hoursExpanded, setHoursExpanded] = useState(false);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      discoverApi
        .getVenue(id, userId)
        .then((data) => {
          setVenue(data);
          setError(null);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load venue');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id, userId]);

  const openGoogleMaps = () => {
    if (venue?.google_maps_uri) {
      Linking.openURL(venue.google_maps_uri);
    } else if (venue?.formatted_address) {
      const query = encodeURIComponent(venue.formatted_address);
      Linking.openURL(`https://maps.google.com/?q=${query}`);
    }
  };

  const openWebsite = () => {
    if (venue?.website_uri) {
      Linking.openURL(venue.website_uri);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary.DEFAULT} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (!venue || error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Typography variant="h4" color="primary">
              ←
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

  // Derived display data
  const photoUrls = venue.photo_urls || [];
  const summary = venue.generative_summary || venue.editorial_summary || venue.tagline;
  const cuisineDisplay = venue.cuisine_type || venue.taste_cluster || 'Restaurant';
  const priceDisplay = venue.price_tier || '$$';

  // Calculate if venue is currently open based on periods
  const isVenueOpen = (): boolean => {
    if (!venue.opening_hours?.periods) return false;

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    for (const period of venue.opening_hours.periods) {
      const openDay = period.open.day;
      const openTimeMinutes = period.open.hour * 60 + period.open.minute;

      // Handle case where close is not defined (24 hours)
      if (!period.close) {
        if (openDay === currentDay) return true;
        continue;
      }

      const closeDay = period.close.day;
      const closeTimeMinutes = period.close.hour * 60 + period.close.minute;

      // Same day open/close
      if (openDay === closeDay) {
        if (currentDay === openDay && currentTimeMinutes >= openTimeMinutes && currentTimeMinutes < closeTimeMinutes) {
          return true;
        }
      } else {
        // Spans midnight (e.g., opens Sunday 5pm, closes Monday 2am)
        if (currentDay === openDay && currentTimeMinutes >= openTimeMinutes) {
          return true;
        }
        if (currentDay === closeDay && currentTimeMinutes < closeTimeMinutes) {
          return true;
        }
      }
    }
    return false;
  };

  const isOpen = isVenueOpen();
  const hoursStatus = venue.opening_hours ? (isOpen ? 'Open now' : 'Closed') : null;
  const weekdayHours = venue.opening_hours?.weekdayDescriptions || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Hero Image Carousel */}
        <View style={styles.heroContainer}>
          {photoUrls.length > 0 ? (
            <>
              <Carousel
                data={photoUrls}
                width={SCREEN_WIDTH}
                height={HERO_HEIGHT}
                onSnapToItem={setCurrentImageIndex}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item }}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                )}
              />
              {/* Pagination Dots */}
              {photoUrls.length > 1 && (
                <View style={styles.paginationDots}>
                  {photoUrls.map((_, index) => (
                    <View
                      key={index}
                      style={[styles.dot, currentImageIndex === index && styles.dotActive]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.heroPlaceholder}>
              <Typography variant="h1">🍽️</Typography>
            </View>
          )}

          {/* Floating Back Button */}
          <TouchableOpacity style={styles.floatingBack} onPress={() => router.back()}>
            <Typography variant="body" color="primary">
              ←
            </Typography>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Venue Name */}
          <Typography variant="h2" color="primary">
            {venue.name}
          </Typography>

          {/* Compact Info Bar */}
          <View style={styles.infoBar}>
            {venue.google_rating && (
              <>
                <Typography variant="body" color="gold">
                  ★ {venue.google_rating}
                </Typography>
                {venue.google_review_count && (
                  <Typography variant="bodySmall" color="muted">
                    ({venue.google_review_count.toLocaleString()})
                  </Typography>
                )}
                <Typography variant="body" color="muted">
                  ·
                </Typography>
              </>
            )}
            <Typography variant="body" color="secondary">
              {priceDisplay}
            </Typography>
            <Typography variant="body" color="muted">
              ·
            </Typography>
            <Typography variant="body" color="secondary">
              {cuisineDisplay}
            </Typography>
          </View>

          {/* AI Summary */}
          {summary && (
            <Typography variant="body" color="secondary" style={styles.summary}>
              {summary}
            </Typography>
          )}

          {/* Match Card */}
          <Card variant="default" padding="md" style={styles.matchCard}>
            <View style={styles.matchHeader}>
              <Typography variant="h3" color="gold">
                {venue.match_score}% Match
              </Typography>
            </View>
            {venue.match_reasons.length > 0 && (
              <View style={styles.matchReasons}>
                {venue.match_reasons.slice(0, 3).map((reason, index) => (
                  <View key={index} style={styles.matchReasonRow}>
                    <Typography variant="body" color="gold">
                      ✓
                    </Typography>
                    <Typography variant="bodySmall" color="secondary" style={styles.matchReasonText}>
                      {reason}
                    </Typography>
                  </View>
                ))}
              </View>
            )}
          </Card>

          {/* Best For */}
          {venue.best_for.length > 0 && (
            <View style={styles.section}>
              <Typography variant="label" color="muted">
                BEST FOR
              </Typography>
              <View style={styles.chipRow}>
                {venue.best_for.map((item) => (
                  <View key={item} style={styles.chip}>
                    <Typography variant="caption" color="primary">
                      {item.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Typography>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Hours */}
          {venue.opening_hours && (
            <View style={styles.section}>
              <Typography variant="label" color="muted">
                HOURS
              </Typography>
              <TouchableOpacity
                style={styles.hoursRow}
                onPress={() => setHoursExpanded(!hoursExpanded)}
                activeOpacity={0.7}
              >
                <View style={styles.hoursStatus}>
                  <Typography
                    variant="body"
                    color={isOpen ? 'success' : 'error'}
                  >
                    {hoursStatus}
                  </Typography>
                  <Typography variant="bodySmall" color="muted">
                    {hoursExpanded ? '▲' : '▼'}
                  </Typography>
                </View>
              </TouchableOpacity>
              {hoursExpanded && weekdayHours.length > 0 && (
                <View style={styles.hoursExpanded}>
                  {weekdayHours.map((day, index) => (
                    <Typography key={index} variant="bodySmall" color="secondary">
                      {day}
                    </Typography>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Address Row */}
          {venue.formatted_address && (
            <TouchableOpacity style={styles.addressRow} onPress={openGoogleMaps} activeOpacity={0.7}>
              <Typography variant="body" color="primary">
                📍
              </Typography>
              <Typography variant="body" color="secondary" style={styles.addressText}>
                {venue.formatted_address}
              </Typography>
              <Typography variant="body" color="muted">
                →
              </Typography>
            </TouchableOpacity>
          )}

          {/* Website Link */}
          {venue.website_uri && (
            <TouchableOpacity style={styles.websiteRow} onPress={openWebsite} activeOpacity={0.7}>
              <Typography variant="body" color="primary">
                🌐
              </Typography>
              <Typography variant="body" color="secondary" style={styles.addressText}>
                Visit website
              </Typography>
              <Typography variant="body" color="muted">
                →
              </Typography>
            </TouchableOpacity>
          )}

          {/* Spacer for bottom CTA */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCTA}>
        <Button label="Check it out" fullWidth onPress={openGoogleMaps} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: layoutSpacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: layoutSpacing.xl,
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
  floatingBack: {
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
  content: {
    padding: layoutSpacing.lg,
    gap: layoutSpacing.md,
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.sm,
    flexWrap: 'wrap',
  },
  summary: {
    lineHeight: 22,
  },
  matchCard: {
    backgroundColor: colors.primary.muted,
    gap: layoutSpacing.sm,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchReasons: {
    gap: layoutSpacing.xs,
  },
  matchReasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: layoutSpacing.sm,
  },
  matchReasonText: {
    flex: 1,
  },
  section: {
    gap: layoutSpacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layoutSpacing.sm,
  },
  chip: {
    paddingHorizontal: layoutSpacing.md,
    paddingVertical: layoutSpacing.sm,
    backgroundColor: colors.dark.surface,
    borderRadius: borderRadius.full,
  },
  hoursRow: {
    paddingVertical: layoutSpacing.sm,
  },
  hoursStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.sm,
  },
  hoursExpanded: {
    gap: 4,
    paddingTop: layoutSpacing.sm,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.sm,
    paddingVertical: layoutSpacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  websiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.sm,
    paddingVertical: layoutSpacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  addressText: {
    flex: 1,
  },
  bottomSpacer: {
    height: 80,
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: layoutSpacing.lg,
    backgroundColor: colors.dark.background,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
});
