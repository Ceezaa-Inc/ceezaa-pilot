import { create } from 'zustand';
import {
  profileApi,
  ProfileData,
  ProfileUpdateRequest,
  NotificationPreferences,
  DataExportResponse,
} from '@/services/api';

// Local types with camelCase
export interface Profile {
  id: string;
  username: string | null;
  displayName: string | null;
  phone: string | null;
  avatarEmoji: string | null;
  avatarUrl: string | null;
  createdAt: string;
  linkedAccountsCount: number;
}

export interface ProfileUpdate {
  displayName?: string;
  avatarEmoji?: string;
  avatarUrl?: string;
  phone?: string;
}

export interface LocalNotificationPreferences {
  dailyInsights: boolean;
  streakMilestones: boolean;
  sessionInvites: boolean;
  votingReminders: boolean;
  planConfirmations: boolean;
  marketing: boolean;
}

interface ProfileState {
  profile: Profile | null;
  notifications: LocalNotificationPreferences | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  hasFetchedProfile: boolean;
  hasFetchedNotifications: boolean;

  // Actions
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (userId: string, updates: ProfileUpdate) => Promise<boolean>;
  fetchNotifications: (userId: string) => Promise<void>;
  updateNotification: (
    userId: string,
    key: keyof LocalNotificationPreferences,
    value: boolean
  ) => Promise<void>;
  exportData: (userId: string) => Promise<DataExportResponse>;
  deleteAccount: (userId: string) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

// Convert API profile to local format
function convertApiProfile(apiProfile: ProfileData): Profile {
  return {
    id: apiProfile.id,
    username: apiProfile.username,
    displayName: apiProfile.display_name,
    phone: apiProfile.phone,
    avatarEmoji: apiProfile.avatar_emoji,
    avatarUrl: apiProfile.avatar_url,
    createdAt: apiProfile.created_at,
    linkedAccountsCount: apiProfile.linked_accounts_count,
  };
}

// Convert local profile update to API format
function toApiProfileUpdate(updates: ProfileUpdate): ProfileUpdateRequest {
  const apiUpdates: ProfileUpdateRequest = {};
  if (updates.displayName !== undefined) apiUpdates.display_name = updates.displayName;
  if (updates.avatarEmoji !== undefined) apiUpdates.avatar_emoji = updates.avatarEmoji;
  if (updates.avatarUrl !== undefined) apiUpdates.avatar_url = updates.avatarUrl;
  if (updates.phone !== undefined) apiUpdates.phone = updates.phone;
  return apiUpdates;
}

// Convert API notifications to local format
function convertApiNotifications(
  apiNotifications: NotificationPreferences
): LocalNotificationPreferences {
  return {
    dailyInsights: apiNotifications.daily_insights,
    streakMilestones: apiNotifications.streak_milestones,
    sessionInvites: apiNotifications.session_invites,
    votingReminders: apiNotifications.voting_reminders,
    planConfirmations: apiNotifications.plan_confirmations,
    marketing: apiNotifications.marketing,
  };
}

// Convert local notification key to API format
function toApiNotificationKey(key: keyof LocalNotificationPreferences): keyof NotificationPreferences {
  const keyMap: Record<keyof LocalNotificationPreferences, keyof NotificationPreferences> = {
    dailyInsights: 'daily_insights',
    streakMilestones: 'streak_milestones',
    sessionInvites: 'session_invites',
    votingReminders: 'voting_reminders',
    planConfirmations: 'plan_confirmations',
    marketing: 'marketing',
  };
  return keyMap[key];
}

const initialState = {
  profile: null,
  notifications: null,
  isLoading: false,
  isUpdating: false,
  error: null,
  hasFetchedProfile: false,
  hasFetchedNotifications: false,
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  ...initialState,

  fetchProfile: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      console.log('[ProfileStore] Fetching profile for user:', userId);
      const apiProfile = await profileApi.getProfile(userId);
      console.log('[ProfileStore] Profile fetched:', JSON.stringify(apiProfile));
      console.log('[ProfileStore] Avatar emoji from API:', apiProfile.avatar_emoji);

      set({
        profile: convertApiProfile(apiProfile),
        isLoading: false,
        hasFetchedProfile: true,
      });
    } catch (error) {
      console.error('[ProfileStore] Fetch profile error:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch profile';

      set({
        isLoading: false,
        error: message,
        hasFetchedProfile: true,
      });
    }
  },

  updateProfile: async (userId: string, updates: ProfileUpdate) => {
    const currentProfile = get().profile;

    // Optimistic update
    if (currentProfile) {
      set({
        isUpdating: true,
        profile: {
          ...currentProfile,
          ...(updates.displayName !== undefined && { displayName: updates.displayName }),
          ...(updates.avatarEmoji !== undefined && { avatarEmoji: updates.avatarEmoji }),
          ...(updates.avatarUrl !== undefined && { avatarUrl: updates.avatarUrl }),
          ...(updates.phone !== undefined && { phone: updates.phone }),
        },
      });
    }

    try {
      console.log('[ProfileStore] Updating profile:', updates);
      const apiUpdates = toApiProfileUpdate(updates);
      const apiProfile = await profileApi.updateProfile(userId, apiUpdates);
      console.log('[ProfileStore] Profile updated');

      set({
        profile: convertApiProfile(apiProfile),
        isUpdating: false,
      });
      return true;
    } catch (error) {
      console.error('[ProfileStore] Update profile error:', error);

      // Rollback on error
      set({
        profile: currentProfile,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to update profile',
      });
      return false;
    }
  },

  fetchNotifications: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      console.log('[ProfileStore] Fetching notifications for user:', userId);
      const apiNotifications = await profileApi.getNotifications(userId);
      console.log('[ProfileStore] Notifications fetched');

      set({
        notifications: convertApiNotifications(apiNotifications),
        isLoading: false,
        hasFetchedNotifications: true,
      });
    } catch (error) {
      console.error('[ProfileStore] Fetch notifications error:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch notifications';

      set({
        isLoading: false,
        error: message,
        hasFetchedNotifications: true,
      });
    }
  },

  updateNotification: async (
    userId: string,
    key: keyof LocalNotificationPreferences,
    value: boolean
  ) => {
    const currentNotifications = get().notifications;
    if (!currentNotifications) return;

    // Optimistic update
    set({
      isUpdating: true,
      notifications: {
        ...currentNotifications,
        [key]: value,
      },
    });

    try {
      console.log('[ProfileStore] Updating notification:', key, value);
      const apiKey = toApiNotificationKey(key);
      await profileApi.updateNotifications(userId, { [apiKey]: value });
      console.log('[ProfileStore] Notification updated');

      set({ isUpdating: false });
    } catch (error) {
      console.error('[ProfileStore] Update notification error:', error);

      // Rollback on error
      set({
        isUpdating: false,
        notifications: currentNotifications,
        error: error instanceof Error ? error.message : 'Failed to update notification',
      });
    }
  },

  exportData: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      console.log('[ProfileStore] Exporting data for user:', userId);
      const response = await profileApi.exportData(userId);
      console.log('[ProfileStore] Data exported at:', response.exported_at);

      set({ isLoading: false });
      return response;
    } catch (error) {
      console.error('[ProfileStore] Export data error:', error);
      const message = error instanceof Error ? error.message : 'Failed to export data';

      set({
        isLoading: false,
        error: message,
      });
      throw error;
    }
  },

  deleteAccount: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      console.log('[ProfileStore] Deleting account for user:', userId);
      const response = await profileApi.deleteAccount(userId);
      console.log('[ProfileStore] Account deleted:', response.success);

      set({ isLoading: false });
      return response.success;
    } catch (error) {
      console.error('[ProfileStore] Delete account error:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete account';

      set({
        isLoading: false,
        error: message,
      });
      return false;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));
