import React, { useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { SearchBar } from '@/components/search/SearchBar';
import { RecentSearches } from '@/components/search/RecentSearches';
import { SearchResults } from '@/components/search/SearchResults';
import { useSearch } from '@/hooks/useSearch';
import { usePlayback } from '@/contexts/PlaybackContext';
import { useLibrary } from '@/contexts/LibraryContext';
import { searchService } from '@/services/searchService';
import * as playlistService from '@/services/playlistService';
import { playTrack } from '@/services/audio/QueueService';
import { Track, Playlist } from '@/types/audio';
import { LibraryStackParamList } from '@/navigation/AppNavigator';
import { colors } from '@/constants/colors';

type NavigationProp = NativeStackNavigationProp<LibraryStackParamList>;

export function SearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { playlists } = useLibrary();
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

  const { currentTrack } = usePlayback();

  // Update search cache when playlists change
  useEffect(() => {
    const loadTracksForSearch = async () => {
      if (!playlists || playlists.length === 0) {
        searchService.updateCache([], []);
        return;
      }

      // Wait a bit for playlists to be fully loaded
      await new Promise(resolve => setTimeout(resolve, 500));

      const allTracks: Track[] = [];
      const seenTrackIds = new Set<string>();

      // Load full playlist details to get tracks
      for (const playlist of playlists) {
        try {
          const fullPlaylist = await playlistService.getPlaylistById(playlist.id);
          
          if (fullPlaylist?.tracks && Array.isArray(fullPlaylist.tracks)) {
            for (const track of fullPlaylist.tracks) {
              if (track && track.id && track.title && !seenTrackIds.has(track.id)) {
                seenTrackIds.add(track.id);
                allTracks.push(track);
              }
            }
          }
        } catch (err) {
          // Continue to next playlist
        }
      }

      searchService.updateCache(allTracks, playlists);
    };

    loadTracksForSearch();
  }, [playlists]);

  const handleTrackPress = async (track: Track) => {
    try {
      Keyboard.dismiss();
      await playTrack(track, results.tracks);
    } catch (error) {
      console.error('Failed to play track:', error);
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
