/**
 * API Configuration Helper
 * Giúp cấu hình kết nối giữa Frontend và Backend
 */

// Lấy Base URL từ environment hoặc mặc định
export const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

// Socket.IO URL
export const SOCKET_URL = API_BASE_URL;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/api/auth/register',
  LOGIN: '/api/auth/login',
  ME: '/api/auth/me',
  
  // Games
  GAMES: '/api/games',
  
  // Leaderboard
  LEADERBOARD: '/api/leaderboard',
  SUBMIT_SCORE: '/api/leaderboard/submit',
  
  // Friends
  FRIENDS: '/api/friends',
  ADD_FRIEND: '/api/friends/add',
};

// Request timeout (ms)
export const REQUEST_TIMEOUT = 10000;

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  delay: 1000,
  backoff: 2,
};

export default {
  API_BASE_URL,
  SOCKET_URL,
  API_ENDPOINTS,
  REQUEST_TIMEOUT,
  RETRY_CONFIG,
};
