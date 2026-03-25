import { apiClient } from './client';

export interface AudioUrlResponse {
  audioUrl: string;
  expiresAt: number; // Unix timestamp in milliseconds
  videoId?: string;
  format?: string;
  bitrate?: number;
}

// In-memory cache for audio URLs to avoid redundant API calls
const audioUrlCache = new Map<string, AudioUrlResponse>();

/**
 * Fetch the actual audio stream URL for a YouTube video ID.
 * This calls the backend which uses youtubei.js to extract the CDN URL.
 * URLs are cached in Redis with ~2 hour TTL.
 * 
 * IMPORTANT: YouTube URLs expire after ~6 hours. Always check expiresAt
 * before using a cached URL.
 */
export async function getAudioUrl(youtubeVideoId: string, forceRefresh = false): Promise<AudioUrlResponse> {
  // Check in-memory cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = audioUrlCache.get(youtubeVideoId);
    if (cached && cached.expiresAt > Date.now()) {
      console.log(`[audio.ts] Using cached audio URL for ${youtubeVideoId} (expires in ${Math.round((cached.expiresAt - Date.now()) / 1000 / 60)}m)`);
      return cached;
    }
    
    if (cached) {
      console.log(`[audio.ts] Cached URL expired for ${youtubeVideoId}, refetching...`);
      audioUrlCache.delete(youtubeVideoId);
    }
  }

  // Fetch from backend
  console.log(`[audio.ts] Fetching audio URL from backend for ${youtubeVideoId}`);
  const response = await apiClient.get<AudioUrlResponse>(`/api/audio-url/${youtubeVideoId}`);
  
  // Cache in memory
  audioUrlCache.set(youtubeVideoId, response.data);
  
  return response.data;
}

/**
 * Get audio URL from cache or extract it.
 * Automatically refetches if URL has expired.
 * Returns null if extraction fails.
 */
export async function getAudioUrlSafe(youtubeVideoId: string): Promise<string | null> {
  try {
    // Check cache first and validate expiry
    const cached = audioUrlCache.get(youtubeVideoId);
    if (cached) {
      // CRITICAL: Check if URL has expired
      if (Date.now() > cached.expiresAt) {
        console.log(`[audio.ts] ⚠️ Cached URL expired for ${youtubeVideoId}, refetching...`);
        audioUrlCache.delete(youtubeVideoId);
        const result = await getAudioUrl(youtubeVideoId, true);
        return result.audioUrl;
      }
      return cached.audioUrl;
    }

    // Not in cache, fetch fresh
    const result = await getAudioUrl(youtubeVideoId);
    return result.audioUrl;
  } catch (error) {
    console.error(`[audio.ts] Failed to get audio URL for ${youtubeVideoId}:`, error);
    return null;
  }
}

/**
 * Clear expired URLs from in-memory cache.
 * Should be called periodically to prevent memory leaks.
 */
export function clearExpiredAudioUrls(): void {
  const now = Date.now();
  let clearedCount = 0;
  
  for (const [videoId, data] of audioUrlCache.entries()) {
    if (data.expiresAt <= now) {
      audioUrlCache.delete(videoId);
      clearedCount++;
    }
  }
  
  if (clearedCount > 0) {
    console.log(`[audio.ts] Cleared ${clearedCount} expired audio URLs from cache`);
  }
}

/**
 * Clear all cached audio URLs (useful for logout or memory management)
 */
export function clearAllAudioUrls(): void {
  const count = audioUrlCache.size;
  audioUrlCache.clear();
  console.log(`[audio.ts] Cleared ${count} audio URLs from cache`);
}
