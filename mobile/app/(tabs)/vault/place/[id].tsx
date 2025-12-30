import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card, Button } from '@/components/ui';
import { ReactionPicker, AddVisitModal } from '@/components/vault';
import { useVaultStore, Visit, Reaction } from '@/stores/useVaultStore';
import { getReactionEmoji } from '@/mocks/visits';

// Format currency to 2 decimal places
const formatCurrency = (amount: number): string => {
  return amount.toFixed(2);
};

// Group visits by date
interface DayGroup {
  dateKey: string;
  displayDate: string;
  totalAmount: number;
  visitCount: number;
  visits: Visit[];
}

function groupVisitsByDay(visits: Visit[]): DayGroup[] {
  const groups: Record<string, Visit[]> = {};

  visits.forEach((visit) => {
    const dateKey = visit.date.split('T')[0]; // YYYY-MM-DD
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(visit);
  });

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a)) // Most recent first
    .map(([dateKey, dayVisits]) => {
      const date = new Date(dateKey);
      const displayDate = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      const totalAmount = dayVisits.reduce((sum, v) => sum + (v.amount || 0), 0);

      return {
        dateKey,
        displayDate,
        totalAmount,
        visitCount: dayVisits.length,
        visits: dayVisits,
      };
    });
}

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedPlace, setSelectedPlace, updateReaction, addVisit } = useVaultStore();
  const [showAddModal, setShowAddModal] = useState(false);

  // Group visits by day
  const dayGroups = useMemo(
    () => (selectedPlace ? groupVisitsByDay(selectedPlace.visits) : []),
    [selectedPlace?.visits]
  );

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerNav}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Typography variant="body" color="primary">
                ← Back
              </Typography>
            </TouchableOpacity>
            <Button
              label="+ Add Visit"
              variant="secondary"
              size="sm"
              onPress={() => setShowAddModal(true)}
            />
          </View>

          <View style={styles.titleRow}>
            <View style={styles.reactionBadge}>
              {selectedPlace.reaction ? (
                <Text style={styles.reactionEmoji}>{getReactionEmoji(selectedPlace.reaction)}</Text>
              ) : (
                <Typography variant="h3" color="gold">?</Typography>
              )}
            </View>
            <View style={styles.titleInfo}>
              <Typography variant="h2" color="primary" numberOfLines={1}>
                {selectedPlace.venueName}
              </Typography>
              {selectedPlace.venueType && (
                <Typography variant="body" color="secondary">
                  {selectedPlace.venueType}
                </Typography>
              )}
            </View>
          </View>
        </View>

        {/* Stats Row - using body variant for amounts to prevent overflow */}
        <View style={styles.statsRow}>
          <Card variant="outlined" padding="md" style={styles.statCard}>
            <Typography variant="h4" color="gold" align="center">
              {selectedPlace.visitCount}
            </Typography>
            <Typography variant="caption" color="muted" align="center">
              Visits
            </Typography>
          </Card>
          <Card variant="outlined" padding="md" style={styles.statCard}>
            <Typography variant="body" color="gold" align="center" numberOfLines={1}>
              ${formatCurrency(selectedPlace.totalSpent)}
            </Typography>
            <Typography variant="caption" color="muted" align="center">
              Total Spent
            </Typography>
          </Card>
          <Card variant="outlined" padding="md" style={styles.statCard}>
            <Typography variant="body" color="gold" align="center" numberOfLines={1}>
              ${formatCurrency(selectedPlace.totalSpent / selectedPlace.visitCount)}
            </Typography>
            <Typography variant="caption" color="muted" align="center">
              Avg / Visit
            </Typography>
          </Card>
        </View>

        {/* Rating Section - Single place-level rating only */}
        <View style={styles.section}>
          <Typography variant="label" color="muted" style={styles.sectionLabel}>
            How was it?
          </Typography>
          <ReactionPicker
            selected={selectedPlace.reaction}
            onChange={handleReactionChange}
            showLabels
          />
        </View>

        {/* Visit History - Grouped by day */}
        <View style={styles.section}>
          <Typography variant="label" color="muted" style={styles.sectionLabel}>
            Visit History
          </Typography>
          <View style={styles.timeline}>
            {dayGroups.map((group, index) => (
              <DayCard
                key={group.dateKey}
                group={group}
                isLast={index === dayGroups.length - 1}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <AddVisitModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddVisit={addVisit}
        preselectedVenue={selectedPlace}
      />
    </SafeAreaView>
  );
}

interface DayCardProps {
  group: DayGroup;
  isLast: boolean;
}

function DayCard({ group, isLast }: DayCardProps) {
  return (
    <View style={styles.visitContainer}>
      <View style={styles.timelineDot}>
        <View style={styles.dot} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>
      <Card variant="default" padding="md" style={styles.visitCard}>
        <View style={styles.visitHeader}>
          <Typography variant="bodySmall" color="secondary">
            {group.displayDate}
          </Typography>
          {group.visitCount > 1 && (
            <View style={styles.visitCountBadge}>
              <Typography variant="caption" color="muted">
                {group.visitCount} visits
              </Typography>
            </View>
          )}
        </View>
        {group.totalAmount > 0 && (
          <Typography variant="h4" color="gold">
            ${formatCurrency(group.totalAmount)}
          </Typography>
        )}
        {/* Show notes from visits if any */}
        {group.visits.map((visit) =>
          visit.notes ? (
            <Typography key={visit.id} variant="bodySmall" color="muted" style={styles.visitNotes}>
              "{visit.notes}"
            </Typography>
          ) : null
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
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    justifyContent: 'center',
    gap: 4,
    minHeight: 60,
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
  visitCountBadge: {
    backgroundColor: colors.dark.surfaceAlt,
    paddingHorizontal: layoutSpacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
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
