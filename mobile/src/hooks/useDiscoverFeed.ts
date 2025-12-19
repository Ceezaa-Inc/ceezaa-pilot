/**
 * useDiscoverFeed - Hook for fetching personalized venue feed
 *
 * Fetches from /api/discover/feed with:
 * - Personalized match scores based on user taste
 * - Optional mood filtering
 * - Pagination support
 */

import { useState, useCallback } from 'react';
import {
  discoverApi,
  DiscoverVenue,
  DiscoverFeedParams,
  MoodOption,
} from '@/services/api';

interface UseDiscoverFeedState {
  venues: DiscoverVenue[];
  moods: MoodOption[];
  selectedMood: string | null;
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

interface UseDiscoverFeedReturn extends UseDiscoverFeedState {
  fetchFeed: (userId: string, params?: DiscoverFeedParams) => Promise<void>;
  fetchMoods: () => Promise<void>;
  loadMore: (userId: string) => Promise<void>;
  setMood: (mood: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const INITIAL_STATE: UseDiscoverFeedState = {
  venues: [],
  moods: [],
  selectedMood: null,
  total: 0,
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  error: null,
};

const PAGE_SIZE = 20;

export function useDiscoverFeed(): UseDiscoverFeedReturn {
  const [state, setState] = useState<UseDiscoverFeedState>(INITIAL_STATE);

  const fetchMoods = useCallback(async () => {
    try {
      console.log('[useDiscoverFeed] Fetching moods');
      const response = await discoverApi.getMoods();
      setState((prev) => ({ ...prev, moods: response.moods }));
      console.log('[useDiscoverFeed] Moods fetched:', response.moods.length);
    } catch (error) {
      console.error('[useDiscoverFeed] Failed to fetch moods:', error);
    }
  }, []);

  const fetchFeed = useCallback(
    async (userId: string, params?: DiscoverFeedParams) => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        selectedMood: params?.mood ?? prev.selectedMood,
      }));

      try {
        console.log('[useDiscoverFeed] Fetching feed for user:', userId, params);
        const response = await discoverApi.getFeed(userId, {
          ...params,
          limit: params?.limit ?? PAGE_SIZE,
          offset: 0,
        });

        console.log('[useDiscoverFeed] Feed fetched:', response.venues.length, 'venues');

        setState((prev) => ({
          ...prev,
          venues: response.venues,
          total: response.total,
          hasMore: response.has_more,
          selectedMood: response.mood,
          isLoading: false,
          error: null,
        }));
      } catch (error) {
        console.error('[useDiscoverFeed] Fetch error:', error);
        const message =
          error instanceof Error ? error.message : 'Failed to fetch venues';

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
      }
    },
    []
  );

  const loadMore = useCallback(
    async (userId: string) => {
      if (state.isLoadingMore || !state.hasMore) return;

      setState((prev) => ({ ...prev, isLoadingMore: true }));

      try {
        const offset = state.venues.length;
        console.log('[useDiscoverFeed] Loading more from offset:', offset);

        const response = await discoverApi.getFeed(userId, {
          mood: state.selectedMood ?? undefined,
          limit: PAGE_SIZE,
          offset,
        });

        console.log('[useDiscoverFeed] Loaded more:', response.venues.length, 'venues');

        setState((prev) => ({
          ...prev,
          venues: [...prev.venues, ...response.venues],
          hasMore: response.has_more,
          isLoadingMore: false,
        }));
      } catch (error) {
        console.error('[useDiscoverFeed] Load more error:', error);
        setState((prev) => ({
          ...prev,
          isLoadingMore: false,
        }));
      }
    },
    [state.venues.length, state.hasMore, state.isLoadingMore, state.selectedMood]
  );

  const setMood = useCallback((mood: string | null) => {
    setState((prev) => ({ ...prev, selectedMood: mood }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    ...state,
    fetchFeed,
    fetchMoods,
    loadMore,
    setMood,
    clearError,
    reset,
  };
}
