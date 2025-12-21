import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Button, Input, Card } from '@/components/ui';
import { VenuePickerModal } from '@/components/session';
import { useSessionStore } from '@/stores/useSessionStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { MoodType, MOOD_DATA } from '@/mocks/taste';
import { Venue, getVenuesByMood } from '@/mocks/venues';
import { SessionVenue } from '@/mocks/sessions';

const MOODS: MoodType[] = ['chill', 'energetic', 'romantic', 'social', 'adventurous', 'cozy'];

const getMoodEmoji = (mood: MoodType): string => {
  const emojis: Record<MoodType, string> = {
    chill: '😌',
    energetic: '⚡',
    romantic: '💕',
    social: '🎉',
    adventurous: '🌍',
    cozy: '🕯️',
  };
  return emojis[mood];
};

export default function CreateSessionScreen() {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [selectedVenues, setSelectedVenues] = useState<SessionVenue[]>([]);
  const [showVenuePicker, setShowVenuePicker] = useState(false);

  const { createSession } = useSessionStore();
  const { user } = useAuthStore();

  // Get suggested venues based on selected mood
  const suggestedVenues = useMemo(() => {
    if (!selectedMood) return [];
    return getVenuesByMood(selectedMood).slice(0, 5);
  }, [selectedMood]);

  const venueToSessionVenue = (venue: Venue): SessionVenue => ({
    venueId: venue.id,
    venueName: venue.name,
    venueType: venue.cuisine || venue.type,
    matchPercentage: venue.matchPercentage,
    votes: 0,
    votedBy: [],
  });

  const handleAddVenue = (venue: Venue) => {
    if (selectedVenues.length >= 10) return;
    if (selectedVenues.some((v) => v.venueId === venue.id)) return;
    setSelectedVenues((prev) => [...prev, venueToSessionVenue(venue)]);
  };

  const handleRemoveVenue = (venueId: string) => {
    setSelectedVenues((prev) => prev.filter((v) => v.venueId !== venueId));
  };

  const handleToggleSuggested = (venue: Venue) => {
    const exists = selectedVenues.some((v) => v.venueId === venue.id);
    if (exists) {
      handleRemoveVenue(venue.id);
    } else {
      handleAddVenue(venue);
    }
  };

  const dismissPickers = () => {
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const formatDate = (d: Date): string => {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (t: Date): string => {
    return t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || selectedVenues.length === 0 || !user?.id) return;

    try {
      const session = await createSession(user.id, {
        name: name.trim(),
        date: date.toISOString().split('T')[0],
        time: formatTime(time),
      });

      router.replace({
        pathname: '/(tabs)/sessions/[id]',
        params: { id: session.id },
      });
    } catch (error) {
      console.error('[Sessions] Failed to create session:', error);
    }
  };

  const isValid = name.trim().length > 0 && selectedVenues.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Typography variant="body" color="primary">
            ← Back
          </Typography>
        </TouchableOpacity>
        <Typography variant="h2" color="primary">
          Plan with Friends
        </Typography>
        <Typography variant="body" color="secondary">
          Create a group session to vote on where to go
        </Typography>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={dismissPickers}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Typography variant="label" color="muted">
            Session Name
          </Typography>
          <Input
            placeholder="e.g., Friday Night Dinner"
            value={name}
            onChangeText={setName}
            onFocus={dismissPickers}
          />
        </View>

        <View style={styles.section}>
          <Typography variant="label" color="muted">
            Date & Time (Optional)
          </Typography>
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => {
                setShowTimePicker(false);
                setShowDatePicker(true);
              }}
            >
              <Typography variant="caption" color="muted">
                📅
              </Typography>
              <Typography variant="body" color="primary">
                {formatDate(date)}
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => {
                setShowDatePicker(false);
                setShowTimePicker(true);
              }}
            >
              <Typography variant="caption" color="muted">
                🕐
              </Typography>
              <Typography variant="body" color="primary">
                {formatTime(time)}
              </Typography>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Typography variant="body" color="gold">
                    Done
                  </Typography>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={new Date()}
                themeVariant="dark"
              />
            </View>
          )}

          {showTimePicker && (
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Typography variant="body" color="gold">
                    Done
                  </Typography>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={time}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                themeVariant="dark"
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Typography variant="label" color="muted">
            What's the vibe?
          </Typography>
          <View style={styles.moodGrid}>
            {MOODS.map((mood) => (
              <TouchableOpacity
                key={mood}
                onPress={() => {
                  dismissPickers();
                  setSelectedMood(mood === selectedMood ? null : mood);
                }}
                style={[styles.moodItem, mood === selectedMood && styles.moodSelected]}
              >
                <Typography variant="h3">{getMoodEmoji(mood)}</Typography>
                <Typography
                  variant="caption"
                  color={mood === selectedMood ? 'gold' : 'secondary'}
                  align="center"
                >
                  {MOOD_DATA[mood].label}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typography variant="label" color="muted">
              Add Venues to Vote On
            </Typography>
            <Typography variant="caption" color="muted">
              {selectedVenues.length}/10
            </Typography>
          </View>

          <TouchableOpacity
            style={styles.addVenueButton}
            onPress={() => {
              dismissPickers();
              setShowVenuePicker(true);
            }}
            disabled={selectedVenues.length >= 10}
          >
            <Typography variant="body" color={selectedVenues.length >= 10 ? 'muted' : 'gold'}>
              + Browse & Add Venues
            </Typography>
          </TouchableOpacity>

          {selectedMood && suggestedVenues.length > 0 && (
            <View style={styles.suggestedSection}>
              <Typography variant="caption" color="muted">
                Suggested for {MOOD_DATA[selectedMood].label}:
              </Typography>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestedScroll}
              >
                {suggestedVenues.map((venue) => {
                  const isSelected = selectedVenues.some((v) => v.venueId === venue.id);
                  return (
                    <TouchableOpacity
                      key={venue.id}
                      style={[styles.suggestedChip, isSelected && styles.suggestedChipSelected]}
                      onPress={() => handleToggleSuggested(venue)}
                    >
                      <Typography
                        variant="caption"
                        color={isSelected ? 'gold' : 'secondary'}
                        numberOfLines={1}
                      >
                        {venue.name}
                      </Typography>
                      {isSelected && (
                        <Typography variant="caption" color="gold">
                          ✓
                        </Typography>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {selectedVenues.length > 0 && (
            <View style={styles.selectedVenuesList}>
              <Typography variant="caption" color="muted">
                Selected ({selectedVenues.length}):
              </Typography>
              {selectedVenues.map((venue) => (
                <View key={venue.venueId} style={styles.selectedVenueItem}>
                  <View style={styles.selectedVenueInfo}>
                    <Typography variant="body" color="primary" numberOfLines={1}>
                      {venue.venueName}
                    </Typography>
                    <Typography variant="caption" color="muted">
                      {venue.venueType} • {venue.matchPercentage}% match
                    </Typography>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveVenue(venue.venueId)}
                    style={styles.removeButton}
                  >
                    <Typography variant="body" color="muted">
                      ✕
                    </Typography>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {selectedVenues.length === 0 && (
            <Card variant="default" padding="md" style={styles.emptyVenuesBox}>
              <Typography variant="body" color="muted" align="center">
                Add at least 1 venue to start voting
              </Typography>
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <Typography variant="label" color="muted">
            Invite Friends
          </Typography>
          <Card variant="default" padding="md" style={styles.inviteBox}>
            <Typography variant="body" color="muted" align="center">
              Share the session code after creation
            </Typography>
            <Typography variant="caption" color="muted" align="center">
              (Friend invite coming soon)
            </Typography>
          </Card>
        </View>
      </ScrollView>

      <VenuePickerModal
        visible={showVenuePicker}
        onClose={() => setShowVenuePicker(false)}
        onSelectVenue={handleAddVenue}
        selectedVenueIds={selectedVenues.map((v) => v.venueId)}
        suggestedMood={selectedMood || undefined}
        maxVenues={10}
      />

      <View style={styles.footer}>
        <Button
          label="Start Session"
          fullWidth
          onPress={handleCreate}
          disabled={!isValid}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    paddingHorizontal: layoutSpacing.lg,
    paddingTop: layoutSpacing.md,
    gap: layoutSpacing.xs,
  },
  backButton: {
    marginBottom: layoutSpacing.sm,
  },
  content: {
    padding: layoutSpacing.lg,
    gap: layoutSpacing.lg,
  },
  section: {
    gap: layoutSpacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: layoutSpacing.md,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.sm,
    padding: layoutSpacing.md,
    backgroundColor: colors.dark.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  pickerContainer: {
    backgroundColor: colors.dark.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: layoutSpacing.sm,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: layoutSpacing.md,
    paddingVertical: layoutSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: layoutSpacing.sm,
  },
  moodItem: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
    justifyContent: 'center',
    alignItems: 'center',
    gap: layoutSpacing.xs,
  },
  moodSelected: {
    borderColor: colors.primary.DEFAULT,
    borderWidth: 2,
    backgroundColor: colors.primary.muted,
  },
  inviteBox: {
    borderStyle: 'dashed',
    gap: layoutSpacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addVenueButton: {
    padding: layoutSpacing.md,
    backgroundColor: colors.dark.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  suggestedSection: {
    gap: layoutSpacing.sm,
  },
  suggestedScroll: {
    gap: layoutSpacing.sm,
  },
  suggestedChip: {
    paddingHorizontal: layoutSpacing.md,
    paddingVertical: layoutSpacing.sm,
    backgroundColor: colors.dark.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.dark.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.xs,
  },
  suggestedChipSelected: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: colors.primary.muted,
  },
  selectedVenuesList: {
    gap: layoutSpacing.sm,
  },
  selectedVenueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: layoutSpacing.md,
    backgroundColor: colors.dark.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  selectedVenueInfo: {
    flex: 1,
    gap: 2,
  },
  removeButton: {
    padding: layoutSpacing.sm,
  },
  emptyVenuesBox: {
    borderStyle: 'dashed',
  },
  footer: {
    padding: layoutSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
});
