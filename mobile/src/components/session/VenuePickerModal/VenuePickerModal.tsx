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
import { Place, Reaction } from '@/stores/useVaultStore';
import { getReactionEmoji } from '@/mocks/visits';

interface VenuePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPlace: (place: Place) => void;
  selectedPlaceIds: string[];  // venueId or venueName
  places: Place[];
  reactionFilter?: Reaction | 'all';
  maxVenues?: number;
}

// Get unique identifier for a place
const getPlaceId = (place: Place): string => place.venueId || place.venueName;

export function VenuePickerModal({
  visible,
  onClose,
  onSelectPlace,
  selectedPlaceIds,
  places,
  reactionFilter = 'all',
  maxVenues = 10,
}: VenuePickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlaces = useMemo(() => {
    let result = places;

    // Filter by reaction
    if (reactionFilter !== 'all') {
      result = result.filter((p) => p.reaction === reactionFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.venueName.toLowerCase().includes(query) ||
          p.venueType?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [places, searchQuery, reactionFilter]);

  const isAtMaxVenues = selectedPlaceIds.length >= maxVenues;

  const handleSelectPlace = (place: Place) => {
    const placeId = getPlaceId(place);
    if (!selectedPlaceIds.includes(placeId) && !isAtMaxVenues) {
      onSelectPlace(place);
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
            Add from Vault
          </Typography>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search your places..."
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
          {filteredPlaces.length} places • {selectedPlaceIds.length}/{maxVenues} selected
        </Typography>

        <ScrollView contentContainerStyle={styles.venueList} showsVerticalScrollIndicator={false}>
          {filteredPlaces.length === 0 ? (
            <View style={styles.emptyState}>
              <Typography variant="body" color="muted" align="center">
                {places.length === 0
                  ? 'No places in your vault yet'
                  : 'No places match your search'}
              </Typography>
            </View>
          ) : (
            filteredPlaces.map((place) => {
              const placeId = getPlaceId(place);
              const isSelected = selectedPlaceIds.includes(placeId);
              return (
                <Card key={placeId} variant="default" padding="md" style={styles.venueCard}>
                  <View style={styles.venueRow}>
                    <View style={styles.imageContainer}>
                      {place.reaction ? (
                        <Typography variant="h3">{getReactionEmoji(place.reaction)}</Typography>
                      ) : (
                        <Typography variant="h3">🍽️</Typography>
                      )}
                    </View>
                    <View style={styles.venueInfo}>
                      <Typography variant="h4" color="primary" numberOfLines={1}>
                        {place.venueName}
                      </Typography>
                      <Typography variant="bodySmall" color="secondary" numberOfLines={1}>
                        {place.venueType || 'Restaurant'}
                      </Typography>
                      <Typography variant="caption" color="muted" numberOfLines={1}>
                        {place.visitCount} visits • ${place.totalSpent.toFixed(0)} spent
                      </Typography>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleSelectPlace(place)}
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
            })
          )}
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
  emptyState: {
    paddingVertical: layoutSpacing.xl,
    alignItems: 'center',
  },
});
