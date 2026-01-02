/**
 * App configuration
 */

import Constants from 'expo-constants';

// Check if running in Expo Go (native modules not available)
export const isExpoGo = Constants.appOwnership === 'expo';

// API base URL - change this to your backend URL
// For local development on iOS simulator, use localhost
// For physical device, use your computer's IP address
export const API_BASE_URL = __DEV__
  ? 'https://ceezaa-pilot.onrender.com'
  : 'https://api.ceezaa.com';

// Supabase configuration
// Get these from: Supabase Dashboard → Project Settings → API
export const SUPABASE_URL = 'https://uhvsujywlsbwmxrjikpw.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVodnN1anl3bHNid214cmppa3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NDM0MjUsImV4cCI6MjA4MTMxOTQyNX0.MbXmf3H9gNzXO3eXT_whYPemTeLZBoBg5OYTmTFrIDE';

// Google OAuth Client IDs
// Get these from: Google Cloud Console → APIs & Services → Credentials
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';

export const config = {
  api: {
    baseUrl: API_BASE_URL,
    timeout: 30000,
  },
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
  },
  oauth: {
    google: {
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    },
  },
};
