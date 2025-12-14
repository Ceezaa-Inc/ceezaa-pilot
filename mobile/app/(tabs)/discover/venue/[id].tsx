import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card, Button } from '@/components/ui';
import { getVenueById, formatHoursForDisplay } from '@/mocks/venues';

const getPriceString = (level: number): string => {
  return '$'.repeat(level);
};

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const venue = getVenueById(id || '');

  if (!venue) {
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
            Venue not found
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image Placeholder */}
        <View style={styles.heroImage}>
          <Typography variant="h1">🍽️</Typography>
          <TouchableOpacity style={styles.backButtonOverlay} onPress={() => router.back()}>
            <Typography variant="body" color="primary">
              ←
            </Typography>
          </TouchableOpacity>
          <View style={styles.matchBadge}>
            <Typography variant="h4" color="gold">
              {venue.matchPercentage}% Match
            </Typography>
          </View>
        </View>

        <View style={styles.content}>
          {/* Header Info */}
          <View style={styles.headerInfo}>
            <Typography variant="h2" color="primary">
              {venue.name}
            </Typography>
            <View style={styles.metaRow}>
              <Typography variant="body" color="secondary">
                {venue.cuisine || venue.type} • {getPriceString(venue.priceLevel)} •{' '}
                {venue.neighborhood}
              </Typography>
            </View>
            <View style={styles.ratingRow}>
              <Typography variant="body" color="gold">
                ★ {venue.rating}
              </Typography>
              <Typography variant="bodySmall" color="muted">
                ({venue.reviewCount} reviews)
              </Typography>
              <Typography variant="bodySmall" color="muted">
                • {venue.distance}
              </Typography>
            </View>
          </View>

          {/* Tags */}
          <View style={styles.tagsContainer}>
            {venue.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Typography variant="caption" color="secondary">
                  {tag}
                </Typography>
              </View>
            ))}
          </View>

          {/* Details Card */}
          <Card variant="default" padding="md" style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Typography variant="body" color="muted">
                📍 Address
              </Typography>
              <Typography variant="body" color="primary">
                {venue.address}
              </Typography>
            </View>
          </Card>

          {/* Hours Section */}
          <View style={styles.section}>
            <Typography variant="label" color="muted">
              Hours
            </Typography>
            <Card variant="default" padding="md" style={styles.hoursCard}>
              {formatHoursForDisplay(venue.hours).map((item, index) => (
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

          {/* Features */}
          <View style={styles.section}>
            <Typography variant="label" color="muted">
              Features
            </Typography>
            <View style={styles.featuresGrid}>
              {venue.features.map((feature) => (
                <View key={feature} style={styles.featureItem}>
                  <Typography variant="bodySmall" color="secondary">
                    ✓ {feature}
                  </Typography>
                </View>
              ))}
            </View>
          </View>

          {/* Moods */}
          <View style={styles.section}>
            <Typography variant="label" color="muted">
              Best For
            </Typography>
            <View style={styles.moodsRow}>
              {venue.moods.map((mood) => (
                <View key={mood} style={styles.moodChip}>
                  <Typography variant="caption" color="primary">
                    {mood.charAt(0).toUpperCase() + mood.slice(1)}
                  </Typography>
                </View>
              ))}
            </View>
          </View>
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
  heroImage: {
    height: 200,
    backgroundColor: colors.dark.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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
    alignItems: 'center',
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
});
