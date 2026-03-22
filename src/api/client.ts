import axios, { AxiosError } from 'axios';
import { storageService } from '../services/storageService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://music.kuldeepjadeja.dev';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CRITICAL: Include cookies in all requests
});

// NO TOKEN INTERCEPTORS - Backend uses HTTP-only cookies
// Cookies are sent automatically by axios when withCredentials: true
