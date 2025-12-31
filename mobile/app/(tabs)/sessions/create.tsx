import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Button, Input, Card } from '@/components/ui';
import { VenuePickerModal, InviteModal, SelectedUser } from '@/components/session';
import { useSessionStore } from '@/stores/useSessionStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useVaultStore, Place } from '@/stores/useVaultStore';

// Selected place type for session creation
interface SelectedPlace {
  placeId: string;  // venueId or venueName
  venueName: string;
  venueType: string | null;
  venueId: string | null;
  photoUrl: string | null;
  visitCount: number;
  totalSpent: number;
}

// Get unique identifier for a place
const getPlaceId = (place: Place): string => place.venueId || place.venueName;

// Capitalize venue type for display
const capitalizeVenueType = (type: string | null): string => {
  if (!type) return 'Restaurant';
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

export default function CreateSessionScreen() {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedPlaces, setSelectedPlaces] = useState<SelectedPlace[]>([]);
  const [showVenuePicker, setShowVenuePicker] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitees, setInvitees] = useState<SelectedUser[]>([]);
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { createSession, addVenueToSession, sendInvitations } = useSessionStore();
  const { user } = useAuthStore();
  const { places, fetchVisits } = useVaultStore();

  // Fetch vault places on mount
  useEffect(() => {
    if (user?.id && places.length === 0) {
      fetchVisits(user.id);
    }
  }, [user?.id, places.length, fetchVisits]);

  const placeToSelectedPlace = (place: Place): SelectedPlace => ({
    placeId: getPlaceId(place),
    venueName: place.venueName,
    venueType: place.venueType,
    venueId: place.venueId,
    photoUrl: place.photoUrl || null,
    visitCount: place.visitCount,
    totalSpent: place.totalSpent,
  });

  const handleAddPlace = (place: Place) => {
    if (selectedPlaces.length >= 10) return;
    const placeId = getPlaceId(place);
    if (selectedPlaces.some((p) => p.placeId === placeId)) return;
    setSelectedPlaces((prev) => [...prev, placeToSelectedPlace(place)]);
  };

  const handleRemovePlace = (placeId: string) => {
    setSelectedPlaces((prev) => prev.filter((p) => p.placeId !== placeId));
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

  // Format time for API (24-hour format that PostgreSQL accepts)
  const formatTimeForApi = (t: Date): string => {
    const hours = t.getHours().toString().padStart(2, '0');
    const minutes = t.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}:00`;
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
    if (!name.trim() || selectedPlaces.length === 0 || !user?.id) return;

    setIsCreating(true);
    try {
      const session = await createSession(user.id, {
        name: name.trim(),
        date: date.toISOString().split('T')[0],
        time: formatTimeForApi(time),
      });

      // Add selected places to the session
      for (const place of selectedPlaces) {
        // If place has venueId, use it; otherwise send venue_name for on-the-fly creation
        const venueData = place.venueId
          ? { venue_id: place.venueId }
          : { venue_name: place.venueName, venue_type: place.venueType || undefined };

        await addVenueToSession(session.id, venueData, user.id);
      }

      // Send invitations if any invitees selected
      if (invitees.length > 0) {
        await sendInvitations(session.id, { user_ids: invitees.map((i) => i.id) }, user.id);
      }

      router.replace({
        pathname: '/(tabs)/sessions/[id]',
        params: { id: session.id },
      });
    } catch (error) {
      console.error('[Sessions] Failed to create session:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRemoveInvitee = (userId: string) => {
    setInvitees(invitees.filter((i) => i.id !== userId));
  };

  const isValid = name.trim().length > 0 && selectedPlaces.length > 0;

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
          <View style={styles.sectionHeader}>
            <Typography variant="label" color="muted">
              Add Places to Vote On
            </Typography>
            <Typography variant="caption" color="muted">
              {selectedPlaces.length}/10
            </Typography>
          </View>

          <TouchableOpacity
            style={styles.addVenueButton}
            onPress={() => {
              dismissPickers();
              setShowVenuePicker(true);
            }}
            disabled={selectedPlaces.length >= 10}
          >
            <Typography variant="body" color={selectedPlaces.length >= 10 ? 'muted' : 'gold'}>
              Browse Venues
            </Typography>
          </TouchableOpacity>

          {selectedPlaces.length > 0 && (
            <View style={styles.selectedVenuesList}>
              <Typography variant="caption" color="muted">
                Selected ({selectedPlaces.length}):
              </Typography>
              {selectedPlaces.map((place) => (
                <View key={place.placeId} style={styles.selectedVenueItem}>
                  <View style={styles.selectedVenueImage}>
                    {place.photoUrl ? (
                      <Image
                        source={{ uri: place.photoUrl }}
                        style={styles.venueImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.venueImagePlaceholder}>
                        <Typography variant="caption" color="muted">
                          No img
                        </Typography>
                      </View>
                    )}
                  </View>
                  <View style={styles.selectedVenueInfo}>
                    <Typography variant="body" color="primary" numberOfLines={1}>
                      {place.venueName}
                    </Typography>
                    <Typography variant="caption" color="muted">
                      {capitalizeVenueType(place.venueType)}
                    </Typography>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemovePlace(place.placeId)}
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

          {selectedPlaces.length === 0 && (
            <Card variant="default" padding="md" style={styles.emptyVenuesBox}>
              <Typography variant="body" color="muted" align="center">
                {places.length === 0
                  ? 'No places in your vault yet'
                  : 'Add at least 1 place to start voting'}
              </Typography>
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typography variant="label" color="muted">
              Invite Friends
            </Typography>
            {invitees.length > 0 && (
              <Typography variant="caption" color="muted">
                {invitees.length} selected
              </Typography>
            )}
          </View>

          <TouchableOpacity
            style={styles.addVenueButton}
            onPress={() => {
              dismissPickers();
              setShowInviteModal(true);
            }}
          >
            <Typography variant="body" color="gold">
              + Add Friends
            </Typography>
          </TouchableOpacity>

          {invitees.length > 0 && (
            <View style={styles.inviteesList}>
              {invitees.map((invitee) => (
                <View key={invitee.id} style={styles.inviteeChip}>
                  <View style={styles.inviteeAvatar}>
                    <Typography variant="caption" color="primary">
                      {(invitee.display_name || 'U').charAt(0).toUpperCase()}
                    </Typography>
                  </View>
                  <Typography variant="body" color="primary" style={{ flex: 1 }}>
                    {invitee.display_name || 'User'}
                  </Typography>
                  <TouchableOpacity
                    onPress={() => handleRemoveInvitee(invitee.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Typography variant="body" color="muted">✕</Typography>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {invitees.length === 0 && (
            <Typography variant="caption" color="muted" align="center" style={{ marginTop: layoutSpacing.xs }}>
              You can also share the session code after creation
            </Typography>
          )}
        </View>
      </ScrollView>

      <VenuePickerModal
        visible={showVenuePicker}
        onClose={() => setShowVenuePicker(false)}
        onSelectPlace={handleAddPlace}
        selectedPlaceIds={selectedPlaces.map((p) => p.placeId)}
        places={places}
        maxVenues={10}
        userId={user?.id}
      />

      <InviteModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        mode="select"
        onSelectUsers={setInvitees}
        initialSelected={invitees}
        userId={user?.id}
      />

      <View style={styles.footer}>
        <Button
          label={isCreating ? 'Creating...' : 'Start Session'}
          fullWidth
          onPress={handleCreate}
          disabled={!isValid || isCreating}
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
  selectedVenuesList: {
    gap: layoutSpacing.sm,
  },
  selectedVenueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: layoutSpacing.sm,
    backgroundColor: colors.dark.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.dark.border,
    gap: layoutSpacing.sm,
  },
  selectedVenueImage: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.dark.surfaceAlt,
  },
  venueImage: {
    width: '100%',
    height: '100%',
  },
  venueImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
  inviteesList: {
    gap: layoutSpacing.sm,
  },
  inviteeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: layoutSpacing.sm,
    backgroundColor: colors.dark.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.dark.border,
    gap: layoutSpacing.sm,
  },
  inviteeAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.dark.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: layoutSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
});
