import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track, Playlist, ApiTrack } from '@/types/audio';
import { favoritesApi, FavoriteTrackPayload } from '@/api/favorites';

const FAVORITE_TRACKS_KEY = '@demus:favoriteTracks';
const FAVORITE_PLAYLISTS_KEY = '@demus:favoritePlaylists';
const SYNC_QUEUE_KEY = '@demus:favoritesSyncQueue';

export interface FavoriteTrack extends Track {
  favoritedAt: string;
}

export interface FavoritePlaylist extends Playlist {
  favoritedAt: string;
}

export interface SyncQueueItem {
  id: string;
  action: 'like' | 'unlike';
  track: Track;
  timestamp: string;
  retries: number;
  lastAttempt?: string;
}

class FavoritesService {
  /**
   * Get all favorite tracks
   */
  async getFavoriteTracks(): Promise<FavoriteTrack[]> {
    try {
      const stored = await AsyncStorage.getItem(FAVORITE_TRACKS_KEY);
      if (!stored) {
        return [];
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to get favorite tracks:', error);
      return [];
    }
  }

  /**
   * Get all favorite playlists
   */
  async getFavoritePlaylists(): Promise<FavoritePlaylist[]> {
    try {
      const stored = await AsyncStorage.getItem(FAVORITE_PLAYLISTS_KEY);
      if (!stored) {
        return [];
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to get favorite playlists:', error);
      return [];
    }
  }

  /**
   * Check if a track is favorited
   */
  async isFavoriteTrack(trackId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavoriteTracks();
      return favorites.some(track => track.id === trackId);
    } catch (error) {
      console.error('Failed to check favorite track:', error);
      return false;
    }
  }

  /**
   * Check if a playlist is favorited
   */
  async isFavoritePlaylist(playlistId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavoritePlaylists();
      return favorites.some(playlist => playlist.id === playlistId);
    } catch (error) {
      console.error('Failed to check favorite playlist:', error);
      return false;
    }
  }

  /**
   * Add or remove a track from favorites
   */
  async toggleFavoriteTrack(track: Track): Promise<boolean> {
    try {
      const favorites = await this.getFavoriteTracks();
      const index = favorites.findIndex(t => t.id === track.id);

      let newFavorites: FavoriteTrack[];
      let isFavorited: boolean;

      if (index >= 0) {
        // Remove from favorites
        newFavorites = favorites.filter(t => t.id !== track.id);
        isFavorited = false;
      } else {
        // Add to favorites
        const favoriteTrack: FavoriteTrack = {
          ...track,
          favoritedAt: new Date().toISOString(),
        };
        newFavorites = [favoriteTrack, ...favorites]; // Add to front
        isFavorited = true;
      }

      await AsyncStorage.setItem(FAVORITE_TRACKS_KEY, JSON.stringify(newFavorites));
      return isFavorited;
    } catch (error) {
      console.error('Failed to toggle favorite track:', error);
      throw error;
    }
  }

  /**
   * Add or remove a playlist from favorites
   */
  async toggleFavoritePlaylist(playlist: Playlist): Promise<boolean> {
    try {
      const favorites = await this.getFavoritePlaylists();
      const index = favorites.findIndex(p => p.id === playlist.id);

      let newFavorites: FavoritePlaylist[];
      let isFavorited: boolean;

      if (index >= 0) {
        // Remove from favorites
        newFavorites = favorites.filter(p => p.id !== playlist.id);
        isFavorited = false;
      } else {
        // Add to favorites
        const favoritePlaylist: FavoritePlaylist = {
          ...playlist,
          favoritedAt: new Date().toISOString(),
        };
        newFavorites = [favoritePlaylist, ...favorites]; // Add to front
        isFavorited = true;
      }

      await AsyncStorage.setItem(FAVORITE_PLAYLISTS_KEY, JSON.stringify(newFavorites));
      return isFavorited;
    } catch (error) {
      console.error('Failed to toggle favorite playlist:', error);
      throw error;
    }
  }

  /**
   * Add a track to favorites
   */
  async addFavoriteTrack(track: Track): Promise<void> {
    const isFavorited = await this.isFavoriteTrack(track.id);
    if (!isFavorited) {
      await this.toggleFavoriteTrack(track);
    }
  }

  /**
   * Remove a track from favorites
   */
  async removeFavoriteTrack(trackId: string): Promise<void> {
    try {
      const favorites = await this.getFavoriteTracks();
      const newFavorites = favorites.filter(t => t.id !== trackId);
      await AsyncStorage.setItem(FAVORITE_TRACKS_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Failed to remove favorite track:', error);
      throw error;
    }
  }

  /**
   * Add a playlist to favorites
   */
  async addFavoritePlaylist(playlist: Playlist): Promise<void> {
    const isFavorited = await this.isFavoritePlaylist(playlist.id);
    if (!isFavorited) {
      await this.toggleFavoritePlaylist(playlist);
    }
  }

  /**
   * Remove a playlist from favorites
   */
  async removeFavoritePlaylist(playlistId: string): Promise<void> {
    try {
      const favorites = await this.getFavoritePlaylists();
      const newFavorites = favorites.filter(p => p.id !== playlistId);
      await AsyncStorage.setItem(FAVORITE_PLAYLISTS_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Failed to remove favorite playlist:', error);
      throw error;
    }
  }

  /**
   * Clear all favorites (for logout/reset)
   */
  async clearAllFavorites(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(FAVORITE_TRACKS_KEY),
        AsyncStorage.removeItem(FAVORITE_PLAYLISTS_KEY),
        AsyncStorage.removeItem(SYNC_QUEUE_KEY),
      ]);
    } catch (error) {
      console.error('Failed to clear favorites:', error);
      throw error;
    }
  }

  /**
   * BACKEND SYNC METHODS
   */

  /**
   * Convert Track to FavoriteTrackPayload for backend API
   */
  private trackToPayload(track: Track): FavoriteTrackPayload {
    return {
      spotifyId: track.id.includes('spotify') || track.id.startsWith('sp') 
        ? track.id 
        : undefined,
      name: track.title,
      artists: track.artist.split(', '),
      albumImage: track.albumArt,
      youtubeVideoId: track.id.includes('youtube') || track.id.startsWith('yt') 
        ? track.id 
        : undefined,
      duration: track.duration,
      album: track.album,
    };
  }

  /**
   * Convert backend ApiTrack to local Track format
   */
  private apiTrackToTrack(apiTrack: ApiTrack): Track {
    return {
      id: apiTrack.spotifyId || apiTrack.youtubeVideoId || '',
      title: apiTrack.name,
      artist: apiTrack.artists.join(', '),
      albumArt: apiTrack.albumImage || '',
      duration: apiTrack.duration,
      album: apiTrack.album,
    };
  }

  /**
   * Sync favorites from backend
   * Called on app launch and after login
   */
  async syncFromBackend(): Promise<void> {
    try {
      console.log('[FavoritesService] Syncing favorites from backend...');
      const response = await favoritesApi.getFavorites();
      const backendFavorites = response.data.favorites || [];

      // Convert API tracks to local format
      const backendTracks: FavoriteTrack[] = backendFavorites.map(apiTrack => ({
        ...this.apiTrackToTrack(apiTrack),
        favoritedAt: apiTrack.importedAt || new Date().toISOString(),
      }));

      // Get local favorites
      const localFavorites = await this.getFavoriteTracks();

      // Merge strategy: Backend is source of truth, but keep local additions
      const mergedMap = new Map<string, FavoriteTrack>();

      // Add all backend favorites
      backendTracks.forEach(track => {
        mergedMap.set(track.id, track);
      });

      // Add local favorites that aren't in backend (pending sync)
      localFavorites.forEach(track => {
        if (!mergedMap.has(track.id)) {
          mergedMap.set(track.id, track);
        }
      });

      const mergedFavorites = Array.from(mergedMap.values());

      // Save merged result
      await AsyncStorage.setItem(
        FAVORITE_TRACKS_KEY,
        JSON.stringify(mergedFavorites)
      );

      console.log(`[FavoritesService] Synced ${mergedFavorites.length} favorites`);
    } catch (error: any) {
      // Silently fail if backend is unavailable (offline-first)
      if (error?.response?.status === 404) {
        console.log('[FavoritesService] Backend favorites endpoint not available (404)');
      } else {
        console.warn('[FavoritesService] Sync from backend failed:', error?.message);
      }
      // Don't throw - offline support
    }
  }

  /**
   * Sync a single track to backend
   * Called after toggling favorite (optimistic update)
   */
  async syncToBackend(track: Track, action: 'like' | 'unlike'): Promise<void> {
    try {
      if (action === 'like') {
        const payload = this.trackToPayload(track);
        await favoritesApi.likeTrack(payload);
        console.log('[FavoritesService] Synced like to backend:', track.title);
      } else {
        // Use track.id for unlike (can be spotifyId or youtubeVideoId)
        await favoritesApi.unlikeTrack(track.id);
        console.log('[FavoritesService] Synced unlike to backend:', track.title);
      }
    } catch (error) {
      console.error('[FavoritesService] Sync to backend failed:', error);
      // Queue for retry
      await this.queueSync(track, action);
    }
  }

  /**
   * Add failed sync to queue for retry
   */
  private async queueSync(track: Track, action: 'like' | 'unlike'): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue: SyncQueueItem[] = stored ? JSON.parse(stored) : [];

      const item: SyncQueueItem = {
        id: `${action}_${track.id}_${Date.now()}`,
        action,
        track,
        timestamp: new Date().toISOString(),
        retries: 0,
      };

      queue.push(item);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      console.log('[FavoritesService] Queued sync for retry:', item.id);
    } catch (error) {
      console.error('[FavoritesService] Failed to queue sync:', error);
    }
  }

  /**
   * Process pending sync queue
   * Called on app launch and when connection is restored
   */
  async processSyncQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (!stored) return;

      const queue: SyncQueueItem[] = JSON.parse(stored);
      if (queue.length === 0) return;

      console.log(`[FavoritesService] Processing ${queue.length} queued syncs...`);

      const failedItems: SyncQueueItem[] = [];

      for (const item of queue) {
        try {
          if (item.action === 'like') {
            const payload = this.trackToPayload(item.track);
            await favoritesApi.likeTrack(payload);
          } else {
            await favoritesApi.unlikeTrack(item.track.id);
          }
          console.log('[FavoritesService] Synced queued item:', item.id);
        } catch (error) {
          // Retry with exponential backoff
          if (item.retries < 5) {
            failedItems.push({
              ...item,
              retries: item.retries + 1,
              lastAttempt: new Date().toISOString(),
            });
          } else {
            console.error('[FavoritesService] Max retries reached for:', item.id);
          }
        }
      }

      // Save failed items back to queue
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(failedItems));
    } catch (error) {
      console.error('[FavoritesService] Failed to process sync queue:', error);
    }
  }
}

export const favoritesService = new FavoritesService();
