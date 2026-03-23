import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track, Playlist } from '@/types/audio';

const RECENT_SEARCHES_KEY = '@demus:recentSearches';
const MAX_RECENT_SEARCHES = 10;

export interface SearchResults {
  tracks: Track[];
  playlists: Playlist[];
  totalCount: number;
}

class SearchService {
  // Cache for all tracks and playlists from LibraryContext
  private tracksCache: Track[] = [];
  private playlistsCache: Playlist[] = [];

  /**
   * Update the search cache with data from LibraryContext
   */
  updateCache(tracks: Track[], playlists: Playlist[]): void {
    this.tracksCache = tracks;
    this.playlistsCache = playlists;
  }

  /**
   * Search across all tracks and playlists
   */
  searchAll(query: string): SearchResults {
    if (!query.trim()) {
      return { tracks: [], playlists: [], totalCount: 0 };
    }

    const normalizedQuery = query.toLowerCase().trim();

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
  searchTracks(query: string): Track[] {
    if (!query.trim()) {
      return [];
    }

    const normalizedQuery = query.toLowerCase().trim();
    return this.searchTracksInCache(normalizedQuery);
  }

  /**
   * Search only playlists
   */
  searchPlaylists(query: string): Playlist[] {
    if (!query.trim()) {
      return [];
    }

    const normalizedQuery = query.toLowerCase().trim();
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

  // Private helper methods

  private searchTracksInCache(query: string): Track[] {
    return this.tracksCache
      .filter(track => {
        const titleMatch = (track.title || '').toLowerCase().includes(query);
        const artistMatch = (track.artist || '').toLowerCase().includes(query);
        return titleMatch || artistMatch;
      })
      .slice(0, 50); // Limit to 50 results
  }

  private searchPlaylistsInCache(query: string): Playlist[] {
    return this.playlistsCache
      .filter(playlist => {
        const nameMatch = (playlist.name || '').toLowerCase().includes(query);
        return nameMatch;
      })
      .slice(0, 20); // Limit to 20 results
  }
}

export const searchService = new SearchService();
