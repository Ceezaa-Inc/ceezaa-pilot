import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card, Button } from '@/components/ui';

const { width } = Dimensions.get('window');
const TILE_SIZE = (width - layoutSpacing.lg * 2 - layoutSpacing.sm) / 2;

const MOODS = [
  { id: 'chill', label: 'Chill', emoji: '😌', gradient: [colors.mood.chill.start, colors.mood.chill.end] },
  { id: 'energetic', label: 'Energetic', emoji: '⚡', gradient: [colors.mood.energetic.start, colors.mood.energetic.end] },
  { id: 'romantic', label: 'Romantic', emoji: '💕', gradient: [colors.mood.romantic.start, colors.mood.romantic.end] },
  { id: 'social', label: 'Social', emoji: '🎉', gradient: [colors.mood.social.start, colors.mood.social.end] },
  { id: 'adventurous', label: 'Adventurous', emoji: '🌍', gradient: [colors.mood.adventurous.start, colors.mood.adventurous.end] },
  { id: 'cozy', label: 'Cozy', emoji: '🕯️', gradient: [colors.mood.cozy.start, colors.mood.cozy.end] },
];

const FOR_YOU_VENUES = [
  { name: 'Bella Italia', type: 'Italian', match: 94, price: '$$' },
  { name: 'The Cozy Corner', type: 'American', match: 89, price: '$' },
  { name: 'Sakura Sushi', type: 'Japanese', match: 87, price: '$$$' },
];

export default function DiscoverScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
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
            <MoodTile key={mood.id} mood={mood} />
          ))}
        </View>

        {/* For You Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typography variant="h3" color="primary">
              For You
            </Typography>
            <Button label="See all" variant="ghost" size="sm" onPress={() => {}} />
          </View>

          {FOR_YOU_VENUES.map((venue, index) => (
            <Card key={index} variant="default" padding="md" style={styles.venueCard}>
              <View style={styles.venueRow}>
                <View style={styles.venueImage}>
                  <Typography variant="h3">🍽️</Typography>
                </View>
                <View style={styles.venueInfo}>
                  <Typography variant="h4" color="primary">
                    {venue.name}
                  </Typography>
                  <Typography variant="bodySmall" color="secondary">
                    {venue.type} • {venue.price}
                  </Typography>
                </View>
                <View style={styles.matchBadge}>
                  <Typography variant="caption" color="gold">
                    {venue.match}%
                  </Typography>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MoodTile({ mood }: { mood: typeof MOODS[0] }) {
  return (
    <LinearGradient
      colors={mood.gradient as [string, string]}
      style={styles.moodTile}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Typography variant="h2" align="center">
        {mood.emoji}
      </Typography>
      <Typography variant="bodySmall" color="primary" align="center">
        {mood.label}
      </Typography>
    </LinearGradient>
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
  moodTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: layoutSpacing.xs,
  },
  section: {
    gap: layoutSpacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  venueCard: {
    marginBottom: layoutSpacing.xs,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.md,
  },
  venueImage: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.dark.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  venueInfo: {
    flex: 1,
    gap: 2,
  },
  matchBadge: {
    paddingHorizontal: layoutSpacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.primary.muted,
    borderRadius: borderRadius.full,
  },
});
