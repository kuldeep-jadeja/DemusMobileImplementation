import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLibrary } from '../../contexts/LibraryContext';
import { usePlayback } from '../../contexts/PlaybackContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { TrackListItem } from '../../components/library/TrackListItem';
import { ImportProgress } from '../../components/library/ImportProgress';
import { FavoriteButton } from '../../components/common/FavoriteButton';
import { convertApiTrackToTrack } from '../../services/playlistService';
import { ApiTrack, Track, Playlist } from '../../types';
import * as QueueService from '../../services/audio/QueueService';

type PlaylistDetailScreenProps = {
  route: {
    params: {
      playlistId: string;
    };
  };
  navigation: any;
};

export default function PlaylistDetailScreen({ route, navigation }: PlaylistDetailScreenProps) {
  const { playlistId } = route.params;
  const { selectPlaylist, selectedPlaylist, isLoading, refreshPlaylist } = useLibrary();
  const { setCurrentTrack } = usePlayback();
  const { isFavoritePlaylist } = useFavorites();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    selectPlaylist(playlistId);
  }, [playlistId]);

  useEffect(() => {
    if (selectedPlaylist) {
      navigation.setOptions({ title: selectedPlaylist.name });
    }
  }, [selectedPlaylist, navigation]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshPlaylist(playlistId);
    setIsRefreshing(false);
  };

  const handlePlayAll = async () => {
    if (!selectedPlaylist?.tracks || selectedPlaylist.tracks.length === 0) {
      Alert.alert('No Tracks', 'This playlist has no tracks to play yet.');
      return;
    }

    try {
      // Convert API tracks to playback tracks (now async)
      const matchedTracks = selectedPlaylist.tracks.filter(t => t.youtubeVideoId);
      
      if (matchedTracks.length === 0) {
        Alert.alert('No Matched Tracks', 'No tracks have been matched with YouTube yet. Wait for import to complete.');
        return;
      }

      // Convert tracks with real audio URLs (parallel fetching)
      const playbackTracks: Track[] = await Promise.all(
        matchedTracks.map(t => convertApiTrackToTrack(t))
      );

      // Filter out tracks that failed to get audio URLs
      const validTracks = playbackTracks.filter(t => t.url);
      
      if (validTracks.length === 0) {
        Alert.alert('Error', 'Failed to get audio URLs for tracks. Please try again.');
        return;
      }

      await QueueService.setQueue(validTracks);
      
      // Manually set current track for MiniPlayer (Expo Go compatibility)
      setCurrentTrack(validTracks[0]);
      
      Alert.alert('Playing', `Started playing ${validTracks.length} ${validTracks.length === 1 ? 'track' : 'tracks'}`);
      console.log('✅ Playing all tracks:', validTracks.length);
    } catch (error) {
      console.error('Failed to play all:', error);
      Alert.alert('Error', 'Failed to start playback');
    }
  };

  const handleAddToQueue = async () => {
    if (!selectedPlaylist?.tracks || selectedPlaylist.tracks.length === 0) {
      Alert.alert('No Tracks', 'This playlist has no tracks to add yet.');
      return;
    }

    try {
      // Convert API tracks to playback tracks (now async)
      const matchedTracks = selectedPlaylist.tracks.filter(t => t.youtubeVideoId);
      
      if (matchedTracks.length === 0) {
        Alert.alert('No Matched Tracks', 'No tracks have been matched with YouTube yet. Wait for import to complete.');
        return;
      }

      const playbackTracks: Track[] = await Promise.all(
        matchedTracks.map(t => convertApiTrackToTrack(t))
      );
      
      const validTracks = playbackTracks.filter(t => t.url);

      await QueueService.addTracks(validTracks);
      Alert.alert('Added to Queue', `${validTracks.length} ${validTracks.length === 1 ? 'track' : 'tracks'} added to queue`);
      console.log('✅ Added to queue:', validTracks.length, 'tracks');
    } catch (error) {
      console.error('Failed to add to queue:', error);
      Alert.alert('Error', 'Failed to add to queue');
    }
  };

  const handleTrackPress = async (track: ApiTrack, index: number) => {
    if (!track.youtubeVideoId) {
      Alert.alert('Track Not Ready', `"${track.name}" hasn't been matched with YouTube yet.`);
      return;
    }

    if (!selectedPlaylist?.tracks) {
      return;
    }

    try {
      // Convert all matched tracks to playback format (with real audio URLs)
      const matchedTracks = selectedPlaylist.tracks.filter(t => t.youtubeVideoId);
      const allPlaybackTracks: Track[] = await Promise.all(
        matchedTracks.map(t => convertApiTrackToTrack(t))
      );
      
      const validTracks = allPlaybackTracks.filter(t => t.url);
      const currentTrack = await convertApiTrackToTrack(track);
      
      if (!currentTrack.url) {
        Alert.alert('Error', 'Failed to get audio URL for this track');
        return;
      }

      // Play this track with the playlist as context
      await QueueService.playTrack(currentTrack, validTracks);
      
      // Manually set current track for MiniPlayer (Expo Go compatibility)
      setCurrentTrack(currentTrack);
      
      Alert.alert('Now Playing', track.name);
      console.log('✅ Playing track:', track.name);
    } catch (error) {
      console.error('Failed to play track:', error);
      Alert.alert('Error', 'Failed to play track');
    }
  };

  const handleTrackMenu = (track: ApiTrack) => {
    console.log('Track menu:', track.name);
    // TODO: Show action sheet with options
  };

  const handleImportComplete = () => {
    // Refresh the playlist when import completes
    refreshPlaylist(playlistId);
  };

  if (isLoading && !selectedPlaylist) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  if (!selectedPlaylist) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <Text style={styles.errorText}>Playlist not found</Text>
      </View>
    );
  }

  const isReady = selectedPlaylist.status === 'ready';
  const hasTracksAvailable = selectedPlaylist.tracks && selectedPlaylist.tracks.length > 0;

  return (
    <View style={styles.container}>
      <FlatList
        data={selectedPlaylist.tracks || []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            {/* Playlist Header */}
            <View style={styles.header}>
              {/* Cover Image */}
              {selectedPlaylist.coverImage ? (
                <Image
                  source={{ uri: selectedPlaylist.coverImage }}
                  style={styles.coverImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.coverImage, styles.placeholderImage]}>
                  <Ionicons name="musical-notes" size={64} color="#666" />
                </View>
              )}

              {/* Playlist Info */}
              <View style={styles.playlistInfo}>
                <View style={styles.playlistTitleRow}>
                  <Text style={styles.playlistName} numberOfLines={2}>
                    {selectedPlaylist.name}
                  </Text>
                  {/* Favorite Button for Playlist */}
                  <FavoriteButton
                    itemId={selectedPlaylist.id}
                    itemType="playlist"
                    item={selectedPlaylist as Playlist}
                    size="large"
                    color="#1DB954"
                  />
                </View>
                {selectedPlaylist.description && (
                  <Text style={styles.playlistDescription} numberOfLines={3}>
                    {selectedPlaylist.description}
                  </Text>
                )}
                <Text style={styles.playlistMeta}>
                  {selectedPlaylist.owner && `${selectedPlaylist.owner} • `}
                  {selectedPlaylist.trackCount} {selectedPlaylist.trackCount === 1 ? 'track' : 'tracks'}
                </Text>
              </View>

              {/* Import Progress */}
              {!isReady && (
                <ImportProgress
                  playlistId={playlistId}
                  initialStatus={selectedPlaylist.status}
                  initialProgress={selectedPlaylist.importProgress}
                  onComplete={handleImportComplete}
                />
              )}

              {/* Action Buttons */}
              {isReady && hasTracksAvailable && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.playButton]}
                    onPress={handlePlayAll}
                  >
                    <Ionicons name="play" size={24} color="#fff" />
                    <Text style={styles.actionButtonText}>Play All</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.addButton]}
                    onPress={handleAddToQueue}
                  >
                    <Ionicons name="add" size={24} color="#fff" />
                    <Text style={styles.actionButtonText}>Add to Queue</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Track List Header */}
            {hasTracksAvailable && (
              <View style={styles.trackListHeader}>
                <Text style={styles.trackListTitle}>Tracks</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item, index }) => (
          <TrackListItem
            track={item}
            index={index}
            onPress={() => handleTrackPress(item, index)}
            onMenuPress={() => handleTrackMenu(item)}
          />
        )}
        ListEmptyComponent={
          isReady ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="musical-notes-outline" size={64} color="#666" />
              <Text style={styles.emptyText}>No tracks available</Text>
            </View>
          ) : null
        }
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginTop: 16,
  },
  listContent: {
    flexGrow: 1,
  },
  header: {
    padding: 20,
  },
  coverImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 20,
  },
  placeholderImage: {
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistInfo: {
    marginBottom: 16,
  },
  playlistTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  playlistName: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  playlistDescription: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
    marginBottom: 8,
  },
  playlistMeta: {
    fontSize: 14,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
  },
  playButton: {
    backgroundColor: '#1DB954',
  },
  addButton: {
    backgroundColor: '#333',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  trackListHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
  },
  trackListTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});
