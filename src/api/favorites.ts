import { apiClient } from './client';
import type { ApiTrack } from '../types/audio';

export interface FavoriteTrackPayload {
  spotifyId?: string;
  name: string;
  artists: string[];
  albumImage?: string;
  youtubeVideoId?: string;
  duration?: number;
  album?: string;
}

export interface FavoritesResponse {
  favorites: ApiTrack[];
  playlistId?: string;
}

export interface LikeUnlikeResponse {
  success: boolean;
  playlistId: string;
  trackId: string;
}

export const favoritesApi = {
  /**
   * Get all favorited tracks from backend
   */
  getFavorites: () =>
    apiClient.get<FavoritesResponse>('/api/favorites'),

  /**
   * Like a track (add to "Liked Songs" playlist)
   */
  likeTrack: (track: FavoriteTrackPayload) =>
    apiClient.post<LikeUnlikeResponse>('/api/favorites/like', { track }),

  /**
   * Unlike a track (remove from "Liked Songs" playlist)
   * @param trackId Can be: spotifyId, youtubeVideoId, or MongoDB _id
   */
  unlikeTrack: (trackId: string) =>
    apiClient.delete<LikeUnlikeResponse>(`/api/favorites/unlike/${trackId}`),
};
