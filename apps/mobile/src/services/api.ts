import axios from 'axios';
import { secureStorage } from './secureStorage';

// Single source of truth for the API base URL across the app (api.ts,
// websocket.ts, signaling.ts, mobile-security-api.ts): the EXPO_PUBLIC_*
// env var convention, which Expo inlines from .env at build time — unlike
// app.json's `extra` block, this supports per-environment .env files
// without editing checked-in config. Previously this file read
// `Constants.expoConfig.extra.apiUrl` (a hardcoded LAN IP baked into the
// committed app.json) while other files read this same env var, so fixing
// one environment meant remembering to fix both.
const rawApiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
const API_URL = `${String(rawApiUrl).replace(/\/$/, '').replace(/\/api$/, '')}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await secureStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await secureStorage.clearAccessToken();
      // TODO: Navigate to login screen
    }
    return Promise.reject(error);
  }
);

export default api;
