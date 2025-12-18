/**
 * useTasteRing - Hook for fetching taste ring visualization data
 *
 * Fetches from the dedicated /api/taste/ring endpoint which provides
 * ring-specific data with visualization optimizations:
 * - Max 5 segments
 * - Minimum 3% threshold
 * - Category-specific colors
 */

import { useState, useCallback } from 'react';
import { tasteApi, RingSegment, TasteRingData } from '@/services/api';

interface UseTasteRingState {
  segments: RingSegment[];
  profileTitle: string;
  tagline: string;
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;
}

interface UseTasteRingReturn extends UseTasteRingState {
  fetchRing: (userId: string) => Promise<void>;
  clearError: () => void;
}

export function useTasteRing(): UseTasteRingReturn {
  const [state, setState] = useState<UseTasteRingState>({
    segments: [],
    profileTitle: '',
    tagline: '',
    isLoading: false,
    error: null,
    hasFetched: false,
  });

  const fetchRing = useCallback(async (userId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('[useTasteRing] Fetching ring for user:', userId);
      const data: TasteRingData = await tasteApi.getRing(userId);
      console.log('[useTasteRing] Ring fetched:', data.segments.length, 'segments');

      setState({
        segments: data.segments,
        profileTitle: data.profile_title,
        tagline: data.tagline,
        isLoading: false,
        error: null,
        hasFetched: true,
      });
    } catch (error) {
      console.error('[useTasteRing] Fetch error:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch ring data';

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
        hasFetched: true,
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    fetchRing,
    clearError,
  };
}
