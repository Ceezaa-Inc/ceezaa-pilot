/**
 * App configuration
 */

// API base URL - change this to your backend URL
// For local development on iOS simulator, use localhost
// For physical device, use your computer's IP address
export const API_BASE_URL = __DEV__
  ? 'http://192.168.68.51:8000'
  : 'https://api.ceezaa.com';

export const config = {
  api: {
    baseUrl: API_BASE_URL,
    timeout: 30000,
  },
};
