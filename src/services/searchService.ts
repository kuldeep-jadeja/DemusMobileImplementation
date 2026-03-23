import AsyncStorage from '@react-native-async-storage/async-storage';
import { playlistService } from './playlistService';
import { Track, Playlist } from '@/types/audio';

const RECENT_SEARCHES_KEY = '@demus:recentSearches';
const MAX_RECENT_SEARCHES = 10;

export interface SearchResults {
  tracks: Track[];
  playlists: Playlist[];
  totalCount: number;
}

class SearchService {
  // Cache for all tracks to avoid repeated API calls
  private tracksCache: Track[] | null = null;
  private playlistsCache: Playlist[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Search across all tracks and playlists
   */
  async searchAll(query: string): Promise<SearchResults> {
    if (!query.trim()) {
      return { tracks: [], playlists: [], totalCount: 0 };
    }

    const normalizedQuery = query.toLowerCase().trim();

    // Get or refresh cache
    await this.ensureCache();

    // Search tracks
    const tracks = this.searchTracksInCache(normalizedQuery);

    // Search playlists
    const playlists = this.searchPlaylistsInCache(normalizedQuery);

    return {
      tracks,
      playlists,
      totalCount: tracks.length + playlists.length,
    };
  }

  /**
   * Search only tracks
   */
  async searchTracks(query: string): Promise<Track[]> {
    if (!query.trim()) {
      return [];
    }

    const normalizedQuery = query.toLowerCase().trim();
    await this.ensureCache();
    return this.searchTracksInCache(normalizedQuery);
  }

  /**
   * Search only playlists
   */
  async searchPlaylists(query: string): Promise<Playlist[]> {
    if (!query.trim()) {
      return [];
    }

    const normalizedQuery = query.toLowerCase().trim();
    await this.ensureCache();
    return this.searchPlaylistsInCache(normalizedQuery);
  }

  /**
   * Get recent search queries
   */
  async getRecentSearches(): Promise<string[]> {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (!stored) {
        return [];
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to get recent searches:', error);
      return [];
    }
  }

  /**
   * Save a search query to recent searches
   */
  async saveSearch(query: string): Promise<void> {
    if (!query.trim()) {
      return;
    }

    try {
      const trimmedQuery = query.trim();
      const recent = await this.getRecentSearches();

      // Remove duplicate if exists
      const filtered = recent.filter(q => q.toLowerCase() !== trimmedQuery.toLowerCase());

      // Add to front
      const updated = [trimmedQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);

      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save search:', error);
    }
  }

  /**
   * Clear all recent searches
   */
  async clearRecentSearches(): Promise<void> {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }

  /**
   * Invalidate the search cache (call after playlist import)
   */
  invalidateCache(): void {
    this.tracksCache = null;
    this.playlistsCache = null;
    this.cacheTimestamp = 0;
  }

  // Private helper methods

  private async ensureCache(): Promise<void> {
    const now = Date.now();
    const cacheExpired = now - this.cacheTimestamp > this.CACHE_DURATION;

    if (!this.tracksCache || !this.playlistsCache || cacheExpired) {
      await this.buildCache();
    }
  }

  private async buildCache(): Promise<void> {
    try {
      // Get all playlists
      const playlists = await playlistService.getPlaylists();
      this.playlistsCache = playlists;

      // Get all tracks from all playlists
      const allTracks: Track[] = [];
      const seenTrackIds = new Set<string>();

      for (const playlist of playlists) {
        try {
          const details = await playlistService.getPlaylistById(playlist.id);
          
          // Deduplicate tracks
          for (const track of details.tracks) {
            if (!seenTrackIds.has(track.id)) {
              seenTrackIds.add(track.id);
              allTracks.push(track);
            }
          }
        } catch (error) {
          console.error(`Failed to load playlist ${playlist.id}:`, error);
          // Continue with other playlists
        }
      }

      this.tracksCache = allTracks;
      this.cacheTimestamp = Date.now();

      console.log(`Search cache built: ${allTracks.length} tracks, ${playlists.length} playlists`);
    } catch (error) {
      console.error('Failed to build search cache:', error);
      this.tracksCache = [];
      this.playlistsCache = [];
    }
  }

  private searchTracksInCache(query: string): Track[] {
    if (!this.tracksCache) {
      return [];
    }

    return this.tracksCache
      .filter(track => {
        const titleMatch = track.title.toLowerCase().includes(query);
        const artistMatch = track.artist.toLowerCase().includes(query);
        return titleMatch || artistMatch;
      })
      .slice(0, 50); // Limit to 50 results
  }

  private searchPlaylistsInCache(query: string): Playlist[] {
    if (!this.playlistsCache) {
      return [];
    }

    return this.playlistsCache
      .filter(playlist => {
        const nameMatch = playlist.name.toLowerCase().includes(query);
        return nameMatch;
      })
      .slice(0, 20); // Limit to 20 results
  }
}

export const searchService = new SearchService();
