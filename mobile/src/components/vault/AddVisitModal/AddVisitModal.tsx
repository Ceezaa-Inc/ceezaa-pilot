import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal as RNModal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Button, Card } from '@/components/ui';
import { ReactionPicker } from '@/components/vault';
import { Venue, VENUES } from '@/mocks/venues';
import { Reaction, VisitSource } from '@/mocks/visits';

interface AddVisitData {
  venueId: string;
  venueName: string;
  venueType: string;
  date: string;
  amount?: number;
  reaction?: Reaction;
  notes?: string;
  source?: VisitSource;
}

interface AddVisitModalProps {
  visible: boolean;
  onClose: () => void;
  onAddVisit: (data: AddVisitData) => void;
}

type Step = 'venue' | 'details';

const getPriceString = (level: number): string => {
  return '$'.repeat(level);
};

const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export function AddVisitModal({ visible, onClose, onAddVisit }: AddVisitModalProps) {
  const [step, setStep] = useState<Step>('venue');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [rateNow, setRateNow] = useState(false);
  const [reaction, setReaction] = useState<Reaction | undefined>(undefined);

  const filteredVenues = useMemo(() => {
    if (!searchQuery.trim()) return VENUES;

    const query = searchQuery.toLowerCase();
    return VENUES.filter(
      (v) =>
        v.name.toLowerCase().includes(query) ||
        v.cuisine?.toLowerCase().includes(query) ||
        v.type.toLowerCase().includes(query) ||
        v.neighborhood.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSelectVenue = (venue: Venue) => {
    setSelectedVenue(venue);
    setStep('details');
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('venue');
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    // Reset state
    setStep('venue');
    setSelectedVenue(null);
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
      venueId: selectedVenue.id,
      venueName: selectedVenue.name,
      venueType: selectedVenue.cuisine || selectedVenue.type,
      date,
      amount: amount ? parseFloat(amount) : undefined,
      notes: notes.trim() || undefined,
      reaction: rateNow ? reaction : undefined,
      source: 'manual',
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
                {step === 'venue' ? 'Cancel' : '← Back'}
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

              <Typography variant="caption" color="muted" style={styles.countLabel}>
                {filteredVenues.length} venues
              </Typography>

              {/* Venue List */}
              <ScrollView
                contentContainerStyle={styles.venueList}
                showsVerticalScrollIndicator={false}
              >
                {filteredVenues.map((venue) => (
                  <TouchableOpacity
                    key={venue.id}
                    onPress={() => handleSelectVenue(venue)}
                    activeOpacity={0.7}
                  >
                    <Card variant="default" padding="md" style={styles.venueCard}>
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
                            {venue.neighborhood}
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
              </ScrollView>
            </>
          ) : (
            <>
              {/* Selected Venue Header */}
              {selectedVenue && (
                <Card variant="outlined" padding="md" style={styles.selectedVenueCard}>
                  <View style={styles.venueRow}>
                    <View style={styles.imageContainer}>
                      <Typography variant="h3">🍽️</Typography>
                    </View>
                    <View style={styles.venueInfo}>
                      <Typography variant="h4" color="gold" numberOfLines={1}>
                        {selectedVenue.name}
                      </Typography>
                      <Typography variant="bodySmall" color="secondary" numberOfLines={1}>
                        {selectedVenue.cuisine || selectedVenue.type}
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
                    <ReactionPicker
                      selected={reaction}
                      onChange={setReaction}
                      showLabels
                    />
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
