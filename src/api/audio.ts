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
export async function getAudioUrl(youtubeVideoId: string, forceRefresh = false, retries = 3): Promise<AudioUrlResponse> {
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

  // Fetch from backend with retry logic
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[audio.ts] Fetching audio URL from backend for ${youtubeVideoId} (attempt ${attempt}/${retries})`);
      const response = await apiClient.get<AudioUrlResponse>(`/api/audio-url/${youtubeVideoId}`, {
        timeout: 15000, // 15 second timeout per attempt
      });
      
      // Validate response
      if (!response.data || !response.data.audioUrl) {
        throw new Error('Invalid audio URL response from backend');
      }
      
      // Cache in memory
      audioUrlCache.set(youtubeVideoId, response.data);
      console.log(`[audio.ts] ✅ Successfully fetched audio URL for ${youtubeVideoId}`);
      
      return response.data;
    } catch (error: any) {
      lastError = error;
      const isLastAttempt = attempt === retries;
      
      if (isLastAttempt) {
        console.error(`[audio.ts] ❌ Failed to fetch audio URL after ${retries} attempts:`, error);
      } else {
        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5 seconds
        console.warn(`[audio.ts] ⚠️ Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed
  throw new Error(`Failed to fetch audio URL for ${youtubeVideoId} after ${retries} attempts: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Get audio URL from cache or extract it.
 * Automatically refetches if URL has expired.
 * Returns null if extraction fails (safe for error handling).
 */
export async function getAudioUrlSafe(youtubeVideoId: string, maxRetries = 3): Promise<string | null> {
  try {
    // Check cache first and validate expiry
    const cached = audioUrlCache.get(youtubeVideoId);
    if (cached) {
      // CRITICAL: Check if URL has expired
      if (Date.now() > cached.expiresAt) {
        console.log(`[audio.ts] ⚠️ Cached URL expired for ${youtubeVideoId}, refetching...`);
        audioUrlCache.delete(youtubeVideoId);
        const result = await getAudioUrl(youtubeVideoId, true, maxRetries);
        return result.audioUrl;
      }
      return cached.audioUrl;
    }

    // Not in cache, fetch fresh
    const result = await getAudioUrl(youtubeVideoId, false, maxRetries);
    return result.audioUrl;
  } catch (error: any) {
    console.error(`[audio.ts] ❌ Failed to get audio URL for ${youtubeVideoId}:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
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
