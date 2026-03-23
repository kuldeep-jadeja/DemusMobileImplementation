import React from 'react';
import { View, StyleSheet, SafeAreaView, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { SearchBar } from '@/components/search/SearchBar';
import { RecentSearches } from '@/components/search/RecentSearches';
import { SearchResults } from '@/components/search/SearchResults';
import { useSearch } from '@/hooks/useSearch';
import { usePlayback } from '@/contexts/PlaybackContext';
import { playTrack } from '@/services/audio/QueueService';
import { Track, Playlist } from '@/types/audio';
import { LibraryStackParamList } from '@/navigation/AppNavigator';
import { colors } from '@/constants/colors';

type NavigationProp = NativeStackNavigationProp<LibraryStackParamList>;

export function SearchScreen() {
  const navigation = useNavigation<NavigationProp>();
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
