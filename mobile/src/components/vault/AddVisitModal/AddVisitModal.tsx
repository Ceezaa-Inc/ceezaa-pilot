import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal as RNModal,
  KeyboardAvoidingView,
  Platform,
  Image,
  Text,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Button, Card } from '@/components/ui';
import { ReactionPicker } from '@/components/vault';
import { useVaultStore, Place, Reaction } from '@/stores/useVaultStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { discoverApi, DiscoverVenue } from '@/services/api';

// Venue type emoji mapping for fallback when no photo
const VENUE_TYPE_EMOJIS: Record<string, string> = {
  coffee: '☕',
  dining: '🍽️',
  fast_food: '🍔',
  nightlife: '🍸',
  bakery: '🥐',
  default: '🍴',
};

function getVenueEmoji(venueType: string | null | undefined): string {
  if (!venueType) return VENUE_TYPE_EMOJIS.default;
  return VENUE_TYPE_EMOJIS[venueType] || VENUE_TYPE_EMOJIS.default;
}

interface AddVisitData {
  venueId?: string;
  venueName: string;
  venueType?: string;
  date: string;
  amount?: number;
  reaction?: Reaction;
  notes?: string;
}

interface AddVisitModalProps {
  visible: boolean;
  onClose: () => void;
  onAddVisit: (data: AddVisitData) => void;
  preselectedVenue?: Place;
}

type Step = 'venue' | 'details';

// Unified venue type for display
interface DisplayVenue {
  id: string;
  name: string;
  type: string | null;
  photoUrl: string | null;
  neighborhood?: string;
  priceLevel?: string;
  source: 'vault' | 'discover';
}

const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export function AddVisitModal({
  visible,
  onClose,
  onAddVisit,
  preselectedVenue,
}: AddVisitModalProps) {
  const { places } = useVaultStore();
  const { user } = useAuthStore();
  const userId = user?.id || 'test-user';

  // Start at details step if venue is preselected
  const [step, setStep] = useState<Step>(preselectedVenue ? 'details' : 'venue');
  const [selectedVenue, setSelectedVenue] = useState<DisplayVenue | null>(
    preselectedVenue
      ? {
          id: preselectedVenue.venueId || preselectedVenue.venueName,
          name: preselectedVenue.venueName,
          type: preselectedVenue.venueType,
          photoUrl: preselectedVenue.photoUrl || null,
          source: 'vault',
        }
      : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [rateNow, setRateNow] = useState(false);
  const [reaction, setReaction] = useState<Reaction | undefined>(undefined);

  // Discover venues state
  const [discoverVenues, setDiscoverVenues] = useState<DiscoverVenue[]>([]);
  const [isLoadingDiscover, setIsLoadingDiscover] = useState(false);

  // Fetch discover venues when modal opens
  useEffect(() => {
    if (visible && !preselectedVenue) {
      setIsLoadingDiscover(true);
      discoverApi
        .getFeed(userId, { limit: 20 })
        .then((response) => {
          setDiscoverVenues(response.venues);
        })
        .catch((err) => {
          console.error('[AddVisitModal] Failed to fetch discover venues:', err);
        })
        .finally(() => {
          setIsLoadingDiscover(false);
        });
    }
  }, [visible, userId, preselectedVenue]);

  // Reset state when preselectedVenue changes
  useEffect(() => {
    if (preselectedVenue) {
      setStep('details');
      setSelectedVenue({
        id: preselectedVenue.venueId || preselectedVenue.venueName,
        name: preselectedVenue.venueName,
        type: preselectedVenue.venueType,
        photoUrl: preselectedVenue.photoUrl || null,
        source: 'vault',
      });
    }
  }, [preselectedVenue]);

  // Convert vault places to display format
  const vaultDisplayVenues: DisplayVenue[] = useMemo(() => {
    return places.map((place) => ({
      id: place.venueId || place.venueName,
      name: place.venueName,
      type: place.venueType,
      photoUrl: place.photoUrl || null,
      source: 'vault' as const,
    }));
  }, [places]);

  // Convert discover venues to display format
  const discoverDisplayVenues: DisplayVenue[] = useMemo(() => {
    // Filter out venues that are already in vault
    const vaultNames = new Set(places.map((p) => p.venueName.toLowerCase()));
    return discoverVenues
      .filter((v) => !vaultNames.has(v.name.toLowerCase()))
      .map((venue) => ({
        id: venue.id,
        name: venue.name,
        type: venue.taste_cluster || venue.cuisine_type,
        photoUrl: venue.photo_url,
        neighborhood: venue.formatted_address?.split(',')[1]?.trim(),
        priceLevel: venue.price_tier || undefined,
        source: 'discover' as const,
      }));
  }, [discoverVenues, places]);

  // Combined and filtered venues
  const filteredVenues = useMemo(() => {
    const allVenues = [...vaultDisplayVenues, ...discoverDisplayVenues];

    if (!searchQuery.trim()) return allVenues;

    const query = searchQuery.toLowerCase();
    return allVenues.filter(
      (v) =>
        v.name.toLowerCase().includes(query) ||
        v.type?.toLowerCase().includes(query) ||
        v.neighborhood?.toLowerCase().includes(query)
    );
  }, [vaultDisplayVenues, discoverDisplayVenues, searchQuery]);

  const handleSelectVenue = (venue: DisplayVenue) => {
    setSelectedVenue(venue);
    setStep('details');
  };

  const handleBack = () => {
    if (step === 'details' && !preselectedVenue) {
      setStep('venue');
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    // Reset state
    setStep(preselectedVenue ? 'details' : 'venue');
    setSelectedVenue(
      preselectedVenue
        ? {
            id: preselectedVenue.venueId || preselectedVenue.venueName,
            name: preselectedVenue.venueName,
            type: preselectedVenue.venueType,
            photoUrl: preselectedVenue.photoUrl || null,
            source: 'vault',
          }
        : null
    );
    setSearchQuery('');
    setDate(getTodayDate());
    setAmount('');
    setNotes('');
    setRateNow(false);
    setReaction(undefined);
    onClose();
  };

  const handleAddVisit = () => {
    if (!selectedVenue) return;

    const visitData: AddVisitData = {
      venueId: selectedVenue.source === 'vault' ? selectedVenue.id : undefined,
      venueName: selectedVenue.name,
      venueType: selectedVenue.type || undefined,
      date,
      amount: amount ? parseFloat(amount) : undefined,
      notes: notes.trim() || undefined,
      reaction: rateNow ? reaction : undefined,
    };

    onAddVisit(visitData);
    handleClose();
  };

  const isValidForm = selectedVenue && date;

  return (
    <RNModal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack}>
              <Typography variant="body" color="primary">
                {step === 'venue' || preselectedVenue ? 'Cancel' : '← Back'}
              </Typography>
            </TouchableOpacity>
            <Typography variant="h4" color="primary">
              {step === 'venue' ? 'Select Venue' : 'Visit Details'}
            </Typography>
            <View style={styles.headerSpacer} />
          </View>

          {step === 'venue' ? (
            <>
              {/* Search */}
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search venues..."
                  placeholderTextColor={colors.text.muted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Section Headers */}
              {vaultDisplayVenues.length > 0 && !searchQuery && (
                <Typography variant="label" color="muted" style={styles.sectionLabel}>
                  YOUR PLACES ({vaultDisplayVenues.length})
                </Typography>
              )}

              {/* Venue List */}
              <ScrollView
                contentContainerStyle={styles.venueList}
                showsVerticalScrollIndicator={false}
              >
                {isLoadingDiscover && filteredVenues.length === 0 ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color={colors.primary.DEFAULT} />
                  </View>
                ) : filteredVenues.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Typography variant="body" color="muted" align="center">
                      No venues found
                    </Typography>
                  </View>
                ) : (
                  <>
                    {/* Vault venues first */}
                    {filteredVenues
                      .filter((v) => v.source === 'vault')
                      .map((venue) => (
                        <TouchableOpacity
                          key={`vault-${venue.id}`}
                          onPress={() => handleSelectVenue(venue)}
                          activeOpacity={0.7}
                        >
                          <Card variant="default" padding="md" style={styles.venueCard}>
                            <View style={styles.venueRow}>
                              <View style={styles.imageContainer}>
                                {venue.photoUrl ? (
                                  <Image
                                    source={{ uri: venue.photoUrl }}
                                    style={styles.venuePhoto}
                                  />
                                ) : (
                                  <Text style={styles.venueEmoji}>
                                    {getVenueEmoji(venue.type)}
                                  </Text>
                                )}
                              </View>
                              <View style={styles.venueInfo}>
                                <Typography variant="h4" color="primary" numberOfLines={1}>
                                  {venue.name}
                                </Typography>
                                <Typography variant="bodySmall" color="secondary" numberOfLines={1}>
                                  {venue.type || 'Restaurant'}
                                </Typography>
                              </View>
                              <View style={styles.selectIndicator}>
                                <Typography variant="body" color="muted">
                                  →
                                </Typography>
                              </View>
                            </View>
                          </Card>
                        </TouchableOpacity>
                      ))}

                    {/* Discover section */}
                    {!searchQuery &&
                      filteredVenues.filter((v) => v.source === 'discover').length > 0 && (
                        <Typography variant="label" color="muted" style={styles.discoverLabel}>
                          DISCOVER NEW PLACES
                        </Typography>
                      )}

                    {/* Discover venues */}
                    {filteredVenues
                      .filter((v) => v.source === 'discover')
                      .map((venue) => (
                        <TouchableOpacity
                          key={`discover-${venue.id}`}
                          onPress={() => handleSelectVenue(venue)}
                          activeOpacity={0.7}
                        >
                          <Card variant="default" padding="md" style={styles.venueCard}>
                            <View style={styles.venueRow}>
                              <View style={styles.imageContainer}>
                                {venue.photoUrl ? (
                                  <Image
                                    source={{ uri: venue.photoUrl }}
                                    style={styles.venuePhoto}
                                  />
                                ) : (
                                  <Text style={styles.venueEmoji}>
                                    {getVenueEmoji(venue.type)}
                                  </Text>
                                )}
                              </View>
                              <View style={styles.venueInfo}>
                                <Typography variant="h4" color="primary" numberOfLines={1}>
                                  {venue.name}
                                </Typography>
                                <Typography variant="bodySmall" color="secondary" numberOfLines={1}>
                                  {venue.type || 'Restaurant'}
                                  {venue.priceLevel ? ` • ${venue.priceLevel}` : ''}
                                </Typography>
                                {venue.neighborhood && (
                                  <Typography variant="caption" color="muted" numberOfLines={1}>
                                    {venue.neighborhood}
                                  </Typography>
                                )}
                              </View>
                              <View style={styles.selectIndicator}>
                                <Typography variant="body" color="muted">
                                  →
                                </Typography>
                              </View>
                            </View>
                          </Card>
                        </TouchableOpacity>
                      ))}
                  </>
                )}
              </ScrollView>
            </>
          ) : (
            <>
              {/* Selected Venue Header */}
              {selectedVenue && (
                <Card variant="outlined" padding="md" style={styles.selectedVenueCard}>
                  <View style={styles.venueRow}>
                    <View style={styles.imageContainer}>
                      {selectedVenue.photoUrl ? (
                        <Image
                          source={{ uri: selectedVenue.photoUrl }}
                          style={styles.venuePhoto}
                        />
                      ) : (
                        <Text style={styles.venueEmoji}>
                          {getVenueEmoji(selectedVenue.type)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.venueInfo}>
                      <Typography variant="h4" color="gold" numberOfLines={1}>
                        {selectedVenue.name}
                      </Typography>
                      <Typography variant="bodySmall" color="secondary" numberOfLines={1}>
                        {selectedVenue.type || 'Restaurant'}
                      </Typography>
                    </View>
                  </View>
                </Card>
              )}

              {/* Details Form */}
              <ScrollView
                contentContainerStyle={styles.detailsForm}
                showsVerticalScrollIndicator={false}
              >
                {/* Date Input */}
                <View style={styles.inputGroup}>
                  <Typography variant="label" color="muted" style={styles.inputLabel}>
                    Date
                  </Typography>
                  <TextInput
                    style={styles.textInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.text.muted}
                    value={date}
                    onChangeText={setDate}
                  />
                </View>

                {/* Amount Input */}
                <View style={styles.inputGroup}>
                  <Typography variant="label" color="muted" style={styles.inputLabel}>
                    Amount Spent (optional)
                  </Typography>
                  <View style={styles.amountInputContainer}>
                    <Typography variant="body" color="muted" style={styles.currencyPrefix}>
                      $
                    </Typography>
                    <TextInput
                      style={styles.amountInput}
                      placeholder="0.00"
                      placeholderTextColor={colors.text.muted}
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                {/* Notes Input */}
                <View style={styles.inputGroup}>
                  <Typography variant="label" color="muted" style={styles.inputLabel}>
                    Notes (optional)
                  </Typography>
                  <TextInput
                    style={[styles.textInput, styles.notesInput]}
                    placeholder="How was your experience?"
                    placeholderTextColor={colors.text.muted}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Rate Now Toggle */}
                <View style={styles.inputGroup}>
                  <TouchableOpacity
                    style={styles.rateNowToggle}
                    onPress={() => setRateNow(!rateNow)}
                    activeOpacity={0.7}
                  >
                    <Typography variant="body" color="primary">
                      Rate this visit now?
                    </Typography>
                    <View style={[styles.toggleIndicator, rateNow && styles.toggleActive]}>
                      <Typography variant="caption" color={rateNow ? 'gold' : 'muted'}>
                        {rateNow ? 'Yes' : 'No'}
                      </Typography>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Reaction Picker */}
                {rateNow && (
                  <View style={styles.inputGroup}>
                    <Typography variant="label" color="muted" style={styles.inputLabel}>
                      Your Reaction
                    </Typography>
                    <ReactionPicker selected={reaction} onChange={setReaction} showLabels />
                  </View>
                )}
              </ScrollView>

              {/* Add Button */}
              <View style={styles.footer}>
                <Button
                  label="Add Visit"
                  fullWidth
                  onPress={handleAddVisit}
                  disabled={!isValidForm}
                />
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  keyboardAvoid: {
    flex: 1,
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
  sectionLabel: {
    paddingHorizontal: layoutSpacing.lg,
    paddingTop: layoutSpacing.sm,
    paddingBottom: layoutSpacing.xs,
  },
  discoverLabel: {
    paddingTop: layoutSpacing.lg,
    paddingBottom: layoutSpacing.xs,
  },
  venueList: {
    padding: layoutSpacing.lg,
    paddingTop: layoutSpacing.sm,
    gap: layoutSpacing.sm,
  },
  loadingContainer: {
    paddingVertical: layoutSpacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: layoutSpacing.xl,
    alignItems: 'center',
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
    overflow: 'hidden',
  },
  venuePhoto: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
  },
  venueEmoji: {
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
  },
  venueInfo: {
    flex: 1,
    gap: 2,
  },
  selectIndicator: {
    paddingHorizontal: layoutSpacing.sm,
  },
  selectedVenueCard: {
    margin: layoutSpacing.lg,
    marginBottom: 0,
    borderColor: colors.primary.DEFAULT,
  },
  detailsForm: {
    padding: layoutSpacing.lg,
    gap: layoutSpacing.lg,
  },
  inputGroup: {
    gap: layoutSpacing.xs,
  },
  inputLabel: {
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: colors.dark.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: layoutSpacing.md,
    paddingVertical: layoutSpacing.sm,
    color: colors.text.primary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  currencyPrefix: {
    paddingLeft: layoutSpacing.md,
  },
  amountInput: {
    flex: 1,
    paddingHorizontal: layoutSpacing.sm,
    paddingVertical: layoutSpacing.sm,
    color: colors.text.primary,
    fontSize: 16,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rateNowToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.dark.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: layoutSpacing.md,
    paddingVertical: layoutSpacing.md,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  toggleIndicator: {
    paddingHorizontal: layoutSpacing.md,
    paddingVertical: layoutSpacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.dark.surfaceAlt,
  },
  toggleActive: {
    backgroundColor: colors.primary.muted,
  },
  footer: {
    padding: layoutSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
});

export default AddVisitModal;
