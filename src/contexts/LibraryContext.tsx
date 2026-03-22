import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Playlist } from '../types';
import * as playlistService from '../services/playlistService';

type LibraryContextType = {
  playlists: Playlist[];
  isLoading: boolean;
  error: string | null;
  selectedPlaylist: Playlist | null;
  fetchPlaylists: () => Promise<void>;
  importPlaylist: (url: string) => Promise<Playlist>;
  selectPlaylist: (id: string) => Promise<void>;
  refreshPlaylist: (id: string) => Promise<void>;
  clearError: () => void;
};

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

type LibraryProviderProps = {
  children: ReactNode;
};

export function LibraryProvider({ children }: LibraryProviderProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches all playlists from the API
   */
  const fetchPlaylists = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedPlaylists = await playlistService.getPlaylists();
      setPlaylists(fetchedPlaylists);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch playlists';
      setError(errorMessage);
      console.error('Error fetching playlists:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Imports a playlist from Spotify URL
   */
  const importPlaylist = useCallback(async (url: string): Promise<Playlist> => {
    try {
      setIsLoading(true);
      setError(null);
      const newPlaylist = await playlistService.importPlaylist(url);
      
      // Add to the beginning of the list
      setPlaylists(prev => [newPlaylist, ...prev]);
      
      return newPlaylist;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import playlist';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Selects a playlist and fetches its full details (including tracks)
   */
  const selectPlaylist = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const playlist = await playlistService.getPlaylistById(id);
      setSelectedPlaylist(playlist);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch playlist details';
      setError(errorMessage);
      console.error('Error selecting playlist:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refreshes a specific playlist's data
   */
  const refreshPlaylist = useCallback(async (id: string) => {
    try {
      const playlist = await playlistService.getPlaylistById(id);
      
      // Update in playlists array
      setPlaylists(prev => 
        prev.map(p => p.id === id ? { ...playlist, tracks: p.tracks } : p)
      );
      
      // Update selected playlist if it's the current one
      if (selectedPlaylist?.id === id) {
        setSelectedPlaylist(playlist);
      }
    } catch (err) {
      console.error('Error refreshing playlist:', err);
      // Don't set error state for background refreshes
    }
  }, [selectedPlaylist]);

  /**
   * Clears error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load playlists on mount
  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const value: LibraryContextType = {
    playlists,
    isLoading,
    error,
    selectedPlaylist,
    fetchPlaylists,
    importPlaylist,
    selectPlaylist,
    refreshPlaylist,
    clearError,
  };

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  );
}

/**
 * Hook to access Library context
 */
export function useLibrary(): LibraryContextType {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within LibraryProvider');
  }
  return context;
}
