import { apiClient } from './client';

export interface AudioUrlResponse {
  audioUrl: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

/**
 * Fetch the actual audio stream URL for a YouTube video ID.
 * This calls the backend which uses youtubei.js to extract the CDN URL.
 * URLs are cached in Redis with ~2 hour TTL.
 */
export async function getAudioUrl(youtubeVideoId: string): Promise<AudioUrlResponse> {
  const response = await apiClient.get<AudioUrlResponse>(`/audio-url/${youtubeVideoId}`);
  return response.data;
}

/**
 * Get audio URL from cache or extract it.
 * Returns null if extraction fails (fallback to YouTube IFrame).
 */
export async function getAudioUrlSafe(youtubeVideoId: string): Promise<string | null> {
  try {
    const result = await getAudioUrl(youtubeVideoId);
    return result.audioUrl;
  } catch (error) {
    console.error(`[audio.ts] Failed to get audio URL for ${youtubeVideoId}:`, error);
    return null;
  }
}
