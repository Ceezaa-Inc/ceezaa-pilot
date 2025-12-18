import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card } from '@/components/ui';
import { TasteRing } from '@/components/pulse/TasteRing';
import { useTasteStore } from '@/stores';

// Format name for display (title case, replace underscores)
const formatName = (name: string) => {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function TasteDetailScreen() {
  const { profile, categories, traits } = useTasteStore();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Typography variant="body" color="primary">
              ← Back
            </Typography>
          </TouchableOpacity>
          <Typography variant="h2" color="primary">
            Taste Profile
          </Typography>
          <Typography variant="body" color="secondary">
            Your complete taste breakdown
          </Typography>
        </View>

        {/* Taste Ring - larger version without card wrapper */}
        <View style={styles.ringSection}>
          <TasteRing size={180} showCard={false} onPress={() => {}} />
        </View>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <Typography variant="label" color="muted">
            Category Breakdown
          </Typography>
          {categories.map((category) => (
            <Card key={category.name} variant="default" padding="md" style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                <Typography variant="body" color="primary">
                  {category.name}
                </Typography>
                <Typography variant="body" color="gold" style={styles.categoryScore}>
                  {category.score}%
                </Typography>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${category.score}%`, backgroundColor: category.color },
                  ]}
                />
              </View>
            </Card>
          ))}
        </View>

        {/* Taste Traits */}
        <View style={styles.section}>
          <Typography variant="label" color="muted">
            Your Taste DNA
          </Typography>
          <View style={styles.traitsGrid}>
            {traits.map((trait) => (
              <Card key={trait.name} variant="outlined" padding="md" style={styles.traitCard}>
                <Typography variant="h3" align="center">
                  {trait.emoji}
                </Typography>
                <Typography variant="bodySmall" color="primary" align="center">
                  {trait.name}
                </Typography>
                <Typography variant="caption" color="muted" align="center">
                  {trait.description}
                </Typography>
              </Card>
            ))}
          </View>
        </View>

        {/* Top Cuisines */}
        <View style={styles.section}>
          <Typography variant="label" color="muted">
            Top Cuisines
          </Typography>
          <View style={styles.cuisineList}>
            {profile.topCuisines.map((cuisine, index) => (
              <View key={cuisine} style={styles.cuisineItem}>
                <Typography variant="h3" color="gold">
                  {index + 1}
                </Typography>
                <Typography variant="body" color="primary">
                  {formatName(cuisine)}
                </Typography>
              </View>
            ))}
          </View>
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
  backButton: {
    marginBottom: layoutSpacing.sm,
  },
  ringSection: {
    alignItems: 'center',
    paddingVertical: layoutSpacing.md,
  },
  section: {
    gap: layoutSpacing.sm,
  },
  traitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layoutSpacing.sm,
  },
  traitCard: {
    width: '48%',
    alignItems: 'center',
    gap: layoutSpacing.xs,
  },
  categoryCard: {
    gap: layoutSpacing.xs,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.sm,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryScore: {
    marginLeft: 'auto',
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.dark.surface,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  cuisineList: {
    gap: layoutSpacing.sm,
  },
  cuisineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.md,
    paddingVertical: layoutSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
});
