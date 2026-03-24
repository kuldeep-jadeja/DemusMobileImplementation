import React, { useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Keyboard, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { SearchBar } from '@/components/search/SearchBar';
import { RecentSearches } from '@/components/search/RecentSearches';
import { SearchResults } from '@/components/search/SearchResults';
import { useSearch } from '@/hooks/useSearch';
import { usePlayback } from '@/contexts/PlaybackContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { searchService } from '@/services/searchService';
import { playTrack } from '@/services/audio/QueueService';
import { Track, Playlist } from '@/types/audio';
import { LibraryStackParamList } from '@/navigation/AppNavigator';
import { colors } from '@/constants/colors';

type NavigationProp = NativeStackNavigationProp<LibraryStackParamList>;

export function SearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { favoriteTracks } = useFavorites();
  const {
    query,
    setQuery,
    results,
    isSearching,
    recentSearches,
    clearRecentSearches,
    selectRecentSearch,
    clearQuery,
  } = useSearch();

  const { currentTrack, setCurrentTrack } = usePlayback();

  // Load all tracks from playlists and favorites for search
  useEffect(() => {
    const loadAllTracks = async () => {
      const allTracks: Track[] = [];
      const tracksMap = new Map<string, Track>(); // To avoid duplicates

      // Add favorites first
      if (favoriteTracks && favoriteTracks.length > 0) {
        favoriteTracks.forEach(fav => {
          const track: Track = {
            id: fav.id,
            title: fav.title,
            artist: fav.artist,
            albumArt: fav.albumArt || '',
            duration: fav.duration || 0,
            spotifyId: fav.spotifyId,
            youtubeVideoId: fav.youtubeVideoId,
            album: fav.album,
          };
          tracksMap.set(track.id, track);
        });
      }

      // Add tracks from all playlists
      if (playlists && playlists.length > 0) {
        playlists.forEach(playlist => {
          if (playlist.tracks && Array.isArray(playlist.tracks)) {
            playlist.tracks.forEach(track => {
              // Only add if not already in map (favorites take priority)
              if (!tracksMap.has(track.id)) {
                tracksMap.set(track.id, track);
              }
            });
          }
        });
      }

      // Convert map to array
      const tracks = Array.from(tracksMap.values());
      
      console.log('[SearchScreen] Loaded tracks for search:', {
        total: tracks.length,
        fromFavorites: favoriteTracks?.length || 0,
        fromPlaylists: playlists?.length || 0,
      });

      searchService.updateCache(tracks, playlists || []);
    };

    loadAllTracks();
  }, [favoriteTracks, playlists]);

  const handleTrackPress = async (track: Track) => {
    try {
      console.log('[SearchScreen] Playing track:', track.title);
      Keyboard.dismiss();
      await playTrack(track, results.tracks);
      
      // For Expo Go: manually update current track since TrackPlayer events don't fire
      setTimeout(() => {
        if (currentTrack?.id !== track.id) {
          console.log('[SearchScreen] Manually setting current track for Expo Go');
          setCurrentTrack(track);
        }
      }, 100);
      
      console.log('[SearchScreen] Track playback initiated');
    } catch (error) {
      console.error('[SearchScreen] Failed to play track:', error);
    }
  };

  const handlePlaylistPress = (playlist: Playlist) => {
    Keyboard.dismiss();
    navigation.navigate('PlaylistDetail', { playlistId: playlist.id });
  };

  const showResults = query.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onClear={clearQuery}
          autoFocus={true}
        />

        {showResults ? (
          <SearchResults
            results={results}
            isSearching={isSearching}
            query={query}
            onTrackPress={handleTrackPress}
            onPlaylistPress={handlePlaylistPress}
          />
        ) : (
          <RecentSearches
            searches={recentSearches}
            onSelectSearch={selectRecentSearch}
            onClearAll={clearRecentSearches}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
});
