import React from 'react';
import { View, Text, StyleSheet, SectionList, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useFavorites } from '@/contexts/FavoritesContext';
import { usePlayback } from '@/contexts/PlaybackContext';
import { SearchResultItem } from '@/components/search/SearchResultItem';
import { playTrack } from '@/services/audio/QueueService';
import { Track, Playlist } from '@/types/audio';
import { LibraryStackParamList } from '@/navigation/AppNavigator';
import { colors } from '@/constants/colors';

type NavigationProp = NativeStackNavigationProp<LibraryStackParamList>;

export function FavoritesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { favoriteTracks, favoritePlaylists } = useFavorites();
  const { currentTrack } = usePlayback();

  const handleTrackPress = async (track: Track) => {
    console.log('🔵 FavoritesScreen: Track tapped:', track.title);
    try {
      // Create proper Track objects from FavoriteTracks
      const tracks: Track[] = favoriteTracks.map(fav => {
        const trackObj: Track = {
          id: fav.id,
          title: fav.title,
          artist: fav.artist,
          albumArt: fav.albumArt || '',
          duration: fav.duration || 0,
        };
        if (fav.spotifyId) trackObj.spotifyId = fav.spotifyId;
        if (fav.youtubeVideoId) trackObj.youtubeVideoId = fav.youtubeVideoId;
        if (fav.album) trackObj.album = fav.album;
        return trackObj;
      });
      
      console.log(`🎵 Playing from favorites: ${track.title}, queue: ${tracks.length} tracks`);
      console.log('Track object:', JSON.stringify(track, null, 2));
      await playTrack(track, tracks);
      console.log('✅ playTrack completed');
    } catch (error) {
      console.error('❌ Failed to play track:', error);
    }
  };

  const handlePlaylistPress = (playlist: Playlist) => {
    navigation.navigate('PlaylistDetail', { playlistId: playlist.id });
  };

  // Build sections
  const sections = [];
  
  if (favoriteTracks.length > 0) {
    sections.push({
      title: `Tracks (${favoriteTracks.length})`,
      data: favoriteTracks.map(track => ({ type: 'track' as const, item: track })),
    });
  }

  if (favoritePlaylists.length > 0) {
    sections.push({
      title: `Playlists (${favoritePlaylists.length})`,
      data: favoritePlaylists.map(playlist => ({ type: 'playlist' as const, item: playlist })),
    });
  }

  // Empty state
  if (sections.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={80} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No favorites yet</Text>
          <Text style={styles.emptySubtext}>
            Tap the ♥ icon to add your favorite tracks and playlists
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => `${item.type}-${item.item.id}`}
        renderItem={({ item }) => (
          <SearchResultItem
            type={item.type}
            item={item.item}
            onPress={() => {
              if (item.type === 'track') {
                handleTrackPress(item.item as Track);
              } else {
                handlePlaylistPress(item.item as Playlist);
              }
            }}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  emptySubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  sectionHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 78,
  },
  listContent: {
    flexGrow: 1,
  },
});
