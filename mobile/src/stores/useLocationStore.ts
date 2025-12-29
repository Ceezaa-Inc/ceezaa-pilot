/**
 * Location store for managing user location and venue seeding state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { discoverApi } from '@/services/api';

type PermissionStatus = 'undetermined' | 'granted' | 'denied';
type SeedingStatus = 'not_seeded' | 'seeding' | 'seeded' | 'failed';

interface LocationState {
  // Location data
  latitude: number | null;
  longitude: number | null;
  city: string | null;

  // Status
  permissionStatus: PermissionStatus;
  seedingStatus: SeedingStatus;
  isLoading: boolean;
  error: string | null;

  // Actions
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<boolean>;
  seedVenues: () => Promise<boolean>;
  reset: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      latitude: null,
      longitude: null,
      city: null,
      permissionStatus: 'undetermined',
      seedingStatus: 'not_seeded',
      isLoading: false,
      error: null,

      requestPermission: async () => {
        try {
          set({ isLoading: true, error: null });

          const { status } = await Location.requestForegroundPermissionsAsync();
          const granted = status === 'granted';

          set({
            permissionStatus: granted ? 'granted' : 'denied',
            isLoading: false,
          });

          return granted;
        } catch (error) {
          console.error('[Location] Permission request failed:', error);
          set({
            permissionStatus: 'denied',
            isLoading: false,
            error: 'Failed to request location permission',
          });
          return false;
        }
      },

      getCurrentLocation: async () => {
        try {
          set({ isLoading: true, error: null });

          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          const { latitude, longitude } = location.coords;

          // Try to get city name via reverse geocoding
          let city = 'Los Angeles'; // Default fallback
          try {
            const [geocode] = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (geocode?.city) {
              city = geocode.city;
            } else if (geocode?.subregion) {
              city = geocode.subregion;
            }
          } catch (geoError) {
            console.warn('[Location] Reverse geocoding failed, using default city');
          }

          set({
            latitude,
            longitude,
            city,
            isLoading: false,
          });

          console.log('[Location] Got coordinates:', { latitude, longitude, city });
          return true;
        } catch (error) {
          console.error('[Location] Failed to get location:', error);
          set({
            isLoading: false,
            error: 'Failed to get current location',
          });
          return false;
        }
      },

      seedVenues: async () => {
        const { latitude, longitude, city, seedingStatus } = get();

        // Don't re-seed if already seeded
        if (seedingStatus === 'seeded') {
          console.log('[Location] Venues already seeded, skipping');
          return true;
        }

        if (!latitude || !longitude || !city) {
          console.error('[Location] Cannot seed without location data');
          set({ error: 'Location data required for seeding' });
          return false;
        }

        try {
          set({ seedingStatus: 'seeding', isLoading: true, error: null });

          console.log('[Location] Seeding venues for:', { city, latitude, longitude });

          const response = await discoverApi.seedVenues({
            city,
            lat: latitude,
            lng: longitude,
          });

          console.log('[Location] Seeded venues:', response);

          set({
            seedingStatus: 'seeded',
            isLoading: false,
          });

          return true;
        } catch (error) {
          console.error('[Location] Seeding failed:', error);
          set({
            seedingStatus: 'failed',
            isLoading: false,
            error: 'Failed to seed nearby venues',
          });
          return false;
        }
      },

      reset: () => {
        set({
          latitude: null,
          longitude: null,
          city: null,
          permissionStatus: 'undetermined',
          seedingStatus: 'not_seeded',
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'location-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist these fields
      partialize: (state) => ({
        latitude: state.latitude,
        longitude: state.longitude,
        city: state.city,
        permissionStatus: state.permissionStatus,
        seedingStatus: state.seedingStatus,
      }),
    }
  )
);
