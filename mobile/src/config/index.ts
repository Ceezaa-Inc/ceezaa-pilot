/**
 * App configuration
 */

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

export const config = {
  api: {
    baseUrl: API_BASE_URL,
    timeout: 30000,
  },
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
  },
};
