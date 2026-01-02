/**
 * Auth store for managing user authentication state
 */

import { create } from 'zustand';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  sendOtp: (phone: string) => Promise<boolean>;
  verifyOtp: (phone: string, token: string) => Promise<boolean>;
  signInWithApple: (idToken: string, nonce?: string) => Promise<boolean>;
  signInWithGoogle: (idToken: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
  devSignIn: () => void; // DEV MODE only
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error.message);
        set({ user: null, session: null, isAuthenticated: false, isLoading: false });
        return;
      }

      set({
        user: session?.user ?? null,
        session,
        isAuthenticated: !!session,
        isLoading: false,
      });

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
        console.log('[Auth] State changed:', event);
        set({
          user: session?.user ?? null,
          session,
          isAuthenticated: !!session,
        });
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ isLoading: false, error: 'Failed to initialize authentication' });
    }
  },

  sendOtp: async (phone: string) => {
    try {
      set({ isLoading: true, error: null });
      console.log('[Auth] Sending OTP to:', phone);

      const { error } = await supabase.auth.signInWithOtp({
        phone,
      });

      if (error) {
        console.log('[Auth] OTP error:', error.message);
        set({ error: error.message, isLoading: false });
        return false;
      }

      console.log('[Auth] OTP sent successfully');
      set({ isLoading: false });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send OTP';
      console.log('[Auth] OTP exception:', message);
      set({ error: message, isLoading: false });
      return false;
    }
  },

  verifyOtp: async (phone: string, token: string) => {
    try {
      set({ isLoading: true, error: null });
      console.log('[Auth] Verifying OTP for phone:', phone, 'token:', token);

      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });

      console.log('[Auth] verifyOtp response:', { data, error });

      if (error) {
        console.error('[Auth] verifyOtp error:', error.message, error);
        set({ error: error.message, isLoading: false });
        return false;
      }

      set({
        user: data.user,
        session: data.session,
        isAuthenticated: !!data.session,
        isLoading: false,
      });

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify OTP';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  signInWithApple: async (idToken: string, nonce?: string) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: idToken,
        nonce,
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }

      set({
        user: data.user,
        session: data.session,
        isAuthenticated: !!data.session,
        isLoading: false,
      });

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Apple sign-in failed';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  signInWithGoogle: async (idToken: string) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }

      set({
        user: data.user,
        session: data.session,
        isAuthenticated: !!data.session,
        isLoading: false,
      });

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign-in failed';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Sign out error:', error.message);
      }

      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      // Even if sign out fails, clear local state
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  // DEV MODE: Quick sign-in for development testing
  devSignIn: () => {
    if (!__DEV__) return;

    // Fixed dev user UUID (matches 008_seed_dev_user.sql migration)
    const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

    // Create a mock user for development
    const mockUser = {
      id: DEV_USER_ID,
      phone: '+15555550100',
      email: 'dev@ceezaa.local',
      created_at: new Date().toISOString(),
      user_metadata: { dev_mode: true },
    } as any;

    set({
      user: mockUser,
      session: { access_token: 'dev-token', refresh_token: 'dev-refresh' } as any,
      isAuthenticated: true,
      isLoading: false,
    });

    console.log('[Auth] DEV MODE: Signed in as', mockUser.id);
  },
}));
