import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal as RNModal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Button, Card } from '@/components/ui';
import { Place, Reaction } from '@/stores/useVaultStore';
import { discoverApi, DiscoverVenue } from '@/services/api';

type TabType = 'vault' | 'discover';

interface VenuePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPlace: (place: Place) => void;
  selectedPlaceIds: string[];
  places: Place[];
  reactionFilter?: Reaction | 'all';
  maxVenues?: number;
  userId?: string;
}

// Get unique identifier for a place
const getPlaceId = (place: Place): string => place.venueId || place.venueName;

// Unified venue display type
interface DisplayVenue {
  id: string;
  venueId: string | null;
  name: string;
  type: string | null;
  photoUrl: string | null;
  visitCount?: number;
  totalSpent?: number;
  matchScore?: number;
  source: 'vault' | 'discover';
}

export function VenuePickerModal({
  visible,
  onClose,
  onSelectPlace,
  selectedPlaceIds,
  places,
  reactionFilter = 'all',
  maxVenues = 10,
  userId,
}: VenuePickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('vault');
  const [discoverVenues, setDiscoverVenues] = useState<DiscoverVenue[]>([]);
  const [isLoadingDiscover, setIsLoadingDiscover] = useState(false);

  // Fetch discover venues when modal opens
  useEffect(() => {
    if (visible && userId) {
      setIsLoadingDiscover(true);
      discoverApi
        .getFeed(userId, { limit: 30 })
        .then((response) => {
          setDiscoverVenues(response.venues);
        })
        .catch((err) => {
          console.error('[VenuePickerModal] Failed to fetch discover venues:', err);
        })
        .finally(() => {
          setIsLoadingDiscover(false);
        });
    }
  }, [visible, userId]);

  // Reset when modal closes
  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setActiveTab('vault');
    }
  }, [visible]);

  // Convert vault places to display format
  const vaultDisplayVenues: DisplayVenue[] = useMemo(() => {
    let result = places;

    // Filter by reaction
    if (reactionFilter !== 'all') {
      result = result.filter((p) => p.reaction === reactionFilter);
    }

    return result.map((place) => ({
      id: getPlaceId(place),
      venueId: place.venueId || null,
      name: place.venueName,
      type: place.venueType,
      photoUrl: place.photoUrl || null,
      visitCount: place.visitCount,
      totalSpent: place.totalSpent,
      source: 'vault' as const,
    }));
  }, [places, reactionFilter]);

  // Convert discover venues to display format
  const discoverDisplayVenues: DisplayVenue[] = useMemo(() => {
    // Filter out venues that are already in vault
    const vaultNames = new Set(places.map((p) => p.venueName.toLowerCase()));
    return discoverVenues
      .filter((v) => !vaultNames.has(v.name.toLowerCase()))
      .map((venue) => ({
        id: venue.id,
        venueId: venue.id,
        name: venue.name,
        type: venue.cuisine_type || venue.taste_cluster,
        photoUrl: venue.photo_url,
        matchScore: venue.match_score,
        source: 'discover' as const,
      }));
  }, [discoverVenues, places]);

  // Get venues for current tab
  const currentVenues = activeTab === 'vault' ? vaultDisplayVenues : discoverDisplayVenues;

  // Filter by search query
  const filteredVenues = useMemo(() => {
    if (!searchQuery.trim()) return currentVenues;

    const query = searchQuery.toLowerCase();
    return currentVenues.filter(
      (v) =>
        v.name.toLowerCase().includes(query) ||
        v.type?.toLowerCase().includes(query)
    );
  }, [currentVenues, searchQuery]);

  const isAtMaxVenues = selectedPlaceIds.length >= maxVenues;

  const handleSelectVenue = (venue: DisplayVenue) => {
    if (selectedPlaceIds.includes(venue.id) || isAtMaxVenues) return;

    // Convert to Place format for parent component
    const place: Place = {
      venueId: venue.venueId,
      venueName: venue.name,
      venueType: venue.type,
      photoUrl: venue.photoUrl || undefined,
      visitCount: venue.visitCount || 0,
      totalSpent: venue.totalSpent || 0,
      lastVisit: new Date().toISOString(),
      visits: [],
    };
    onSelectPlace(place);
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
            Add Venues
          </Typography>
          <View style={styles.headerSpacer} />
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'vault' && styles.tabActive]}
            onPress={() => setActiveTab('vault')}
          >
            <Typography
              variant="body"
              color={activeTab === 'vault' ? 'gold' : 'secondary'}
            >
              Your Vault
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'discover' && styles.tabActive]}
            onPress={() => setActiveTab('discover')}
          >
            <Typography
              variant="body"
              color={activeTab === 'discover' ? 'gold' : 'secondary'}
            >
              Discover
            </Typography>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${activeTab === 'vault' ? 'your places' : 'venues'}...`}
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
          {filteredVenues.length} venues {selectedPlaceIds.length > 0 && `• ${selectedPlaceIds.length}/${maxVenues} selected`}
        </Typography>

        <ScrollView contentContainerStyle={styles.venueList} showsVerticalScrollIndicator={false}>
          {activeTab === 'discover' && isLoadingDiscover ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
              <Typography variant="body" color="muted" style={{ marginTop: layoutSpacing.md }}>
                Loading recommendations...
              </Typography>
            </View>
          ) : filteredVenues.length === 0 ? (
            <View style={styles.emptyState}>
              <Typography variant="body" color="muted" align="center">
                {activeTab === 'vault'
                  ? places.length === 0
                    ? 'No places in your vault yet'
                    : 'No places match your search'
                  : 'No venues match your search'}
              </Typography>
            </View>
          ) : (
            filteredVenues.map((venue) => {
              const isSelected = selectedPlaceIds.includes(venue.id);
              return (
                <Card key={venue.id} variant="default" padding="md" style={styles.venueCard}>
                  <View style={styles.venueRow}>
                    <View style={styles.imageContainer}>
                      {venue.photoUrl ? (
                        <Image
                          source={{ uri: venue.photoUrl }}
                          style={styles.venueImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <Typography variant="caption" color="muted">
                            No img
                          </Typography>
                        </View>
                      )}
                    </View>
                    <View style={styles.venueInfo}>
                      <Typography variant="h4" color="primary" numberOfLines={1}>
                        {venue.name}
                      </Typography>
                      <Typography variant="bodySmall" color="secondary" numberOfLines={1}>
                        {venue.type || 'Restaurant'}
                      </Typography>
                      {venue.source === 'vault' && venue.visitCount !== undefined && (
                        <Typography variant="caption" color="muted" numberOfLines={1}>
                          {venue.visitCount} visits • ${(venue.totalSpent || 0).toFixed(0)} spent
                        </Typography>
                      )}
                      {venue.source === 'discover' && venue.matchScore !== undefined && (
                        <Typography variant="caption" color="gold" numberOfLines={1}>
                          {venue.matchScore}% match
                        </Typography>
                      )}
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
                        {isSelected ? 'Added' : '+ Add'}
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: layoutSpacing.lg,
    paddingTop: layoutSpacing.sm,
    gap: layoutSpacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: layoutSpacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary.DEFAULT,
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
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.dark.surfaceAlt,
  },
  venueImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.dark.surfaceAlt,
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
  loadingState: {
    paddingVertical: layoutSpacing.xl,
    alignItems: 'center',
  },
});
