import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal as RNModal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Button, Card } from '@/components/ui';
import { Venue, VENUES, getVenuesByMood } from '@/mocks/venues';
import { MoodType } from '@/mocks/taste';

interface VenuePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectVenue: (venue: Venue) => void;
  selectedVenueIds: string[];
  suggestedMood?: MoodType;
  maxVenues?: number;
}

const getPriceString = (level: number): string => {
  return '$'.repeat(level);
};

export function VenuePickerModal({
  visible,
  onClose,
  onSelectVenue,
  selectedVenueIds,
  suggestedMood,
  maxVenues = 10,
}: VenuePickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVenues = useMemo(() => {
    let venues = suggestedMood ? getVenuesByMood(suggestedMood) : VENUES;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      venues = venues.filter(
        (v) =>
          v.name.toLowerCase().includes(query) ||
          v.cuisine?.toLowerCase().includes(query) ||
          v.type.toLowerCase().includes(query) ||
          v.neighborhood.toLowerCase().includes(query)
      );
    }

    return venues;
  }, [searchQuery, suggestedMood]);

  const isAtMaxVenues = selectedVenueIds.length >= maxVenues;

  const handleSelectVenue = (venue: Venue) => {
    if (!selectedVenueIds.includes(venue.id) && !isAtMaxVenues) {
      onSelectVenue(venue);
    }
  };

  return (
    <RNModal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Typography variant="body" color="primary">
              Cancel
            </Typography>
          </TouchableOpacity>
          <Typography variant="h4" color="primary">
            Add Venue
          </Typography>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search venues..."
            placeholderTextColor={colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {isAtMaxVenues && (
          <View style={styles.warningBanner}>
            <Typography variant="caption" color="gold">
              Maximum {maxVenues} venues reached
            </Typography>
          </View>
        )}

        <Typography variant="caption" color="muted" style={styles.countLabel}>
          {filteredVenues.length} venues • {selectedVenueIds.length}/{maxVenues} selected
        </Typography>

        <ScrollView contentContainerStyle={styles.venueList} showsVerticalScrollIndicator={false}>
          {filteredVenues.map((venue) => {
            const isSelected = selectedVenueIds.includes(venue.id);
            return (
              <Card key={venue.id} variant="default" padding="md" style={styles.venueCard}>
                <View style={styles.venueRow}>
                  <View style={styles.imageContainer}>
                    <Typography variant="h3">🍽️</Typography>
                  </View>
                  <View style={styles.venueInfo}>
                    <Typography variant="h4" color="primary" numberOfLines={1}>
                      {venue.name}
                    </Typography>
                    <Typography variant="bodySmall" color="secondary" numberOfLines={1}>
                      {venue.cuisine || venue.type} • {getPriceString(venue.priceLevel)}
                    </Typography>
                    <Typography variant="caption" color="muted" numberOfLines={1}>
                      {venue.neighborhood} • {venue.matchPercentage}% match
                    </Typography>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleSelectVenue(venue)}
                    style={[
                      styles.addButton,
                      isSelected && styles.addButtonSelected,
                      !isSelected && isAtMaxVenues && styles.addButtonDisabled,
                    ]}
                    disabled={isSelected || isAtMaxVenues}
                  >
                    <Typography
                      variant="caption"
                      color={isSelected ? 'gold' : isAtMaxVenues ? 'muted' : 'primary'}
                    >
                      {isSelected ? '✓ Added' : '+ Add'}
                    </Typography>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <Button label="Done" fullWidth onPress={onClose} />
        </View>
      </SafeAreaView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: layoutSpacing.lg,
    paddingVertical: layoutSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  headerSpacer: {
    width: 50,
  },
  searchContainer: {
    paddingHorizontal: layoutSpacing.lg,
    paddingVertical: layoutSpacing.sm,
  },
  searchInput: {
    backgroundColor: colors.dark.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: layoutSpacing.md,
    paddingVertical: layoutSpacing.sm,
    color: colors.text.primary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  warningBanner: {
    backgroundColor: colors.primary.muted,
    paddingVertical: layoutSpacing.xs,
    paddingHorizontal: layoutSpacing.lg,
    alignItems: 'center',
  },
  countLabel: {
    paddingHorizontal: layoutSpacing.lg,
    paddingVertical: layoutSpacing.xs,
  },
  venueList: {
    padding: layoutSpacing.lg,
    gap: layoutSpacing.sm,
  },
  venueCard: {
    marginBottom: 0,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.md,
  },
  imageContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.dark.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  venueInfo: {
    flex: 1,
    gap: 2,
  },
  addButton: {
    paddingHorizontal: layoutSpacing.md,
    paddingVertical: layoutSpacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  addButtonSelected: {
    backgroundColor: colors.primary.muted,
    borderColor: colors.primary.DEFAULT,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  footer: {
    padding: layoutSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
});
