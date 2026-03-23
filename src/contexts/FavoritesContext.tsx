import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { favoritesService, FavoriteTrack, FavoritePlaylist } from '@/services/favoritesService';
import { Track, Playlist } from '@/types/audio';
import * as Haptics from 'expo-haptics';

interface FavoritesContextType {
  favoriteTracks: FavoriteTrack[];
  favoritePlaylists: FavoritePlaylist[];
  isFavoriteTrack: (trackId: string) => boolean;
  isFavoritePlaylist: (playlistId: string) => boolean;
  toggleFavoriteTrack: (track: Track) => Promise<void>;
  toggleFavoritePlaylist: (playlist: Playlist) => Promise<void>;
  refreshFavorites: () => Promise<void>;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteTracks, setFavoriteTracks] = useState<FavoriteTrack[]>([]);
  const [favoritePlaylists, setFavoritePlaylists] = useState<FavoritePlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites on mount and sync with backend
  useEffect(() => {
    loadFavorites();
    syncWithBackend();
  }, []);

  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      const [tracks, playlists] = await Promise.all([
        favoritesService.getFavoriteTracks(),
        favoritesService.getFavoritePlaylists(),
      ]);
      setFavoriteTracks(tracks);
      setFavoritePlaylists(playlists);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sync favorites with backend
   * Called on app launch
   */
  const syncWithBackend = async () => {
    try {
      console.log('[FavoritesContext] Syncing with backend...');
      
      // Process any pending sync queue first
      await favoritesService.processSyncQueue();
      
      // Sync from backend (merge with local)
      await favoritesService.syncFromBackend();
      
      // Reload local favorites after sync
      const tracks = await favoritesService.getFavoriteTracks();
      setFavoriteTracks(tracks);
      
      console.log('[FavoritesContext] Sync complete');
    } catch (error) {
      console.error('[FavoritesContext] Backend sync failed:', error);
      // Don't throw - app should work offline
    }
  };

  const isFavoriteTrack = useCallback((trackId: string): boolean => {
    return favoriteTracks.some(track => track.id === trackId);
  }, [favoriteTracks]);

  const isFavoritePlaylist = useCallback((playlistId: string): boolean => {
    return favoritePlaylists.some(playlist => playlist.id === playlistId);
  }, [favoritePlaylists]);

  const toggleFavoriteTrack = useCallback(async (track: Track) => {
    try {
      // Optimistic update
      const wasFavorited = isFavoriteTrack(track.id);
      const action = wasFavorited ? 'unlike' : 'like';
      
      if (wasFavorited) {
        setFavoriteTracks(prev => prev.filter(t => t.id !== track.id));
      } else {
        const favoriteTrack: FavoriteTrack = {
          ...track,
          favoritedAt: new Date().toISOString(),
        };
        setFavoriteTracks(prev => [favoriteTrack, ...prev]);
      }

      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Update local storage
      await favoritesService.toggleFavoriteTrack(track);

      // Sync to backend (non-blocking)
      favoritesService.syncToBackend(track, action).catch(err => {
        console.error('[FavoritesContext] Backend sync failed, will retry:', err);
      });
    } catch (error) {
      console.error('Failed to toggle favorite track:', error);
      // Revert optimistic update on error
      await loadFavorites();
      throw error;
    }
  }, [isFavoriteTrack]);

  const toggleFavoritePlaylist = useCallback(async (playlist: Playlist) => {
    try {
      // Optimistic update
      const wasFavorited = isFavoritePlaylist(playlist.id);
      
      if (wasFavorited) {
        setFavoritePlaylists(prev => prev.filter(p => p.id !== playlist.id));
      } else {
        const favoritePlaylist: FavoritePlaylist = {
          ...playlist,
          favoritedAt: new Date().toISOString(),
        };
        setFavoritePlaylists(prev => [favoritePlaylist, ...prev]);
      }

      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Update storage
      await favoritesService.toggleFavoritePlaylist(playlist);
    } catch (error) {
      console.error('Failed to toggle favorite playlist:', error);
      // Revert optimistic update on error
      await loadFavorites();
      throw error;
    }
  }, [isFavoritePlaylist]);

  const refreshFavorites = useCallback(async () => {
    await loadFavorites();
  }, []);

  const value: FavoritesContextType = {
    favoriteTracks,
    favoritePlaylists,
    isFavoriteTrack,
    isFavoritePlaylist,
    toggleFavoriteTrack,
    toggleFavoritePlaylist,
    refreshFavorites,
    isLoading,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextType {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
}
