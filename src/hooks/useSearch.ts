import { useState, useEffect, useCallback, useRef } from 'react';
import { searchService, SearchResults } from '@/services/searchService';

export type SearchFilter = 'all' | 'tracks' | 'playlists';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ tracks: [], playlists: [], totalCount: 0 });
  const [isSearching, setIsSearching] = useState(false);
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!query.trim()) {
      setResults({ tracks: [], playlists: [], totalCount: 0 });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    debounceTimer.current = setTimeout(async () => {
      await performSearch(query, filter);
      setIsSearching(false);
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, filter]);

  const performSearch = async (searchQuery: string, searchFilter: SearchFilter) => {
    try {
      let searchResults: SearchResults;

      switch (searchFilter) {
        case 'tracks':
          const tracks = await searchService.searchTracks(searchQuery);
          searchResults = { tracks, playlists: [], totalCount: tracks.length };
          break;
        case 'playlists':
          const playlists = await searchService.searchPlaylists(searchQuery);
          searchResults = { tracks: [], playlists, totalCount: playlists.length };
          break;
        default:
          searchResults = await searchService.searchAll(searchQuery);
      }

      setResults(searchResults);

      // Save to recent searches
      if (searchQuery.trim()) {
        await searchService.saveSearch(searchQuery);
        await loadRecentSearches();
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults({ tracks: [], playlists: [], totalCount: 0 });
    }
  };

  const loadRecentSearches = async () => {
    try {
      const recent = await searchService.getRecentSearches();
      setRecentSearches(recent);
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  };

  const clearRecentSearches = useCallback(async () => {
    try {
      await searchService.clearRecentSearches();
      setRecentSearches([]);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }, []);

  const selectRecentSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
  }, []);

  const clearQuery = useCallback(() => {
    setQuery('');
    setResults({ tracks: [], playlists: [], totalCount: 0 });
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    filter,
    setFilter,
    recentSearches,
    clearRecentSearches,
    selectRecentSearch,
    clearQuery,
  };
}
