import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card, Button } from '@/components/ui';
import { ReactionPicker } from '@/components/vault';
import { useVaultStore, Visit, Reaction } from '@/stores/useVaultStore';
import { getReactionEmoji } from '@/mocks/visits';

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedPlace, setSelectedPlace, updateReaction, rateVisit } = useVaultStore();

  useEffect(() => {
    if (id) {
      setSelectedPlace(id);
    }
    return () => setSelectedPlace(null);
  }, [id]);

  if (!selectedPlace) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyState}>
          <Typography variant="h3" color="muted" align="center">
            Place not found
          </Typography>
          <Button label="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const handleReactionChange = (reaction: Reaction) => {
    if (id) {
      updateReaction(id, reaction);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Typography variant="body" color="primary">
              ← Back
            </Typography>
          </TouchableOpacity>

          <View style={styles.titleRow}>
            <View style={styles.reactionBadge}>
              {selectedPlace.reaction ? (
                <Text style={styles.reactionEmoji}>{getReactionEmoji(selectedPlace.reaction)}</Text>
              ) : (
                <Typography variant="h3" color="gold">?</Typography>
              )}
            </View>
            <View style={styles.titleInfo}>
              <Typography variant="h2" color="primary">
                {selectedPlace.venueName}
              </Typography>
              <Typography variant="body" color="secondary">
                {selectedPlace.venueType}
              </Typography>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Card variant="outlined" padding="md" style={styles.statCard}>
            <Typography variant="h3" color="gold" align="center">
              {selectedPlace.visitCount}
            </Typography>
            <Typography variant="caption" color="muted" align="center">
              Visits
            </Typography>
          </Card>
          <Card variant="outlined" padding="md" style={styles.statCard}>
            <Typography variant="h3" color="gold" align="center">
              ${selectedPlace.totalSpent}
            </Typography>
            <Typography variant="caption" color="muted" align="center">
              Total Spent
            </Typography>
          </Card>
          <Card variant="outlined" padding="md" style={styles.statCard}>
            <Typography variant="h3" color="gold" align="center">
              ${Math.round(selectedPlace.totalSpent / selectedPlace.visitCount)}
            </Typography>
            <Typography variant="caption" color="muted" align="center">
              Avg / Visit
            </Typography>
          </Card>
        </View>

        {/* Reaction Section */}
        <View style={styles.section}>
          <Typography variant="label" color="muted" style={styles.sectionLabel}>
            Your Rating
          </Typography>
          <ReactionPicker
            selected={selectedPlace.reaction}
            onChange={handleReactionChange}
            showLabels
          />
        </View>

        {/* Visit History */}
        <View style={styles.section}>
          <Typography variant="label" color="muted" style={styles.sectionLabel}>
            Visit History
          </Typography>
          <View style={styles.timeline}>
            {selectedPlace.visits.map((visit, index) => (
              <VisitCard
                key={visit.id}
                visit={visit}
                isLast={index === selectedPlace.visits.length - 1}
                onRateVisit={rateVisit}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface VisitCardProps {
  visit: Visit;
  isLast: boolean;
  onRateVisit: (visitId: string, reaction: Reaction) => void;
}

function VisitCard({ visit, isLast, onRateVisit }: VisitCardProps) {
  const [showRatingPicker, setShowRatingPicker] = useState(false);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleRateVisit = (reaction: Reaction) => {
    onRateVisit(visit.id, reaction);
    setShowRatingPicker(false);
  };

  return (
    <View style={styles.visitContainer}>
      <View style={styles.timelineDot}>
        <View style={[styles.dot, !visit.reaction && styles.dotUnrated]} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>
      <Card variant="default" padding="md" style={styles.visitCard}>
        <View style={styles.visitHeader}>
          <Typography variant="bodySmall" color="secondary">
            {formatDate(visit.date)}
          </Typography>
          <View style={styles.visitReaction}>
            {visit.reaction ? (
              <Text style={styles.visitReactionEmoji}>{getReactionEmoji(visit.reaction)}</Text>
            ) : (
              <TouchableOpacity
                style={styles.rateButton}
                onPress={() => setShowRatingPicker(!showRatingPicker)}
              >
                <Typography variant="caption" color="gold">
                  {showRatingPicker ? 'Cancel' : 'Rate'}
                </Typography>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {visit.amount && (
          <Typography variant="h4" color="gold">
            ${visit.amount}
          </Typography>
        )}
        {visit.notes && (
          <Typography variant="bodySmall" color="muted" style={styles.visitNotes}>
            "{visit.notes}"
          </Typography>
        )}
        {showRatingPicker && (
          <View style={styles.ratingPickerContainer}>
            <ReactionPicker
              selected={undefined}
              onChange={handleRateVisit}
              showLabels={false}
            />
          </View>
        )}
      </Card>
    </View>
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
    gap: layoutSpacing.md,
  },
  backButton: {
    marginBottom: layoutSpacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.md,
  },
  reactionBadge: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.dark.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleInfo: {
    flex: 1,
    gap: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: layoutSpacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  section: {
    gap: layoutSpacing.sm,
  },
  sectionLabel: {
    marginBottom: layoutSpacing.xs,
  },
  timeline: {
    gap: 0,
  },
  visitContainer: {
    flexDirection: 'row',
    gap: layoutSpacing.md,
  },
  timelineDot: {
    alignItems: 'center',
    width: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary.DEFAULT,
    marginTop: layoutSpacing.md,
  },
  dotUnrated: {
    backgroundColor: colors.primary.muted,
    borderWidth: 2,
    borderColor: colors.primary.DEFAULT,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.dark.border,
    marginTop: 4,
  },
  visitCard: {
    flex: 1,
    marginBottom: layoutSpacing.sm,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  visitReaction: {
    minHeight: 28,
    justifyContent: 'center',
  },
  visitReactionEmoji: {
    fontSize: 20,
    lineHeight: 28,
  },
  rateButton: {
    paddingHorizontal: layoutSpacing.sm,
    paddingVertical: layoutSpacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.muted,
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
  },
  ratingPickerContainer: {
    marginTop: layoutSpacing.md,
    paddingTop: layoutSpacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  visitNotes: {
    marginTop: layoutSpacing.xs,
    fontStyle: 'italic',
  },
  reactionEmoji: {
    fontSize: 32,
    lineHeight: 40,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: layoutSpacing.xl,
    gap: layoutSpacing.lg,
  },
});
