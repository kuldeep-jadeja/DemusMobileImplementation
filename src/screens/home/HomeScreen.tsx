import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHome } from '@/contexts/HomeContext';
import { useLibrary } from '@/contexts/LibraryContext';
import { usePlayback } from '@/contexts/PlaybackContext';
import { useNavigation } from '@react-navigation/native';
import SectionHeader from '@/components/home/SectionHeader';
import RecentTrackCard from '@/components/home/RecentTrackCard';
import { PlaylistCard } from '@/components/library/PlaylistCard';
import { playTrack } from '@/services/audio/QueueService';
import type { Playlist } from '@/types';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { recentlyPlayed, isLoading, refreshHistory } = useHome();
  const { playlists, isLoading: libraryLoading, fetchPlaylists } = useLibrary();
  const { setCurrentTrack } = usePlayback();

  const [refreshing, setRefreshing] = React.useState(false);

  // Load data on mount
  useEffect(() => {
    fetchPlaylists();
  }, []);

  // Get recent playlists (last 3)
  const recentPlaylists = React.useMemo(() => {
    if (!playlists) return [];
    return playlists
      .filter((p) => p.status === 'ready') // Only show ready playlists
      .slice(0, 3);
  }, [playlists]);

  // Handle pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshHistory(), fetchPlaylists()]);
    setRefreshing(false);
  };

  // Play track immediately
  const handleTrackPress = async (trackId: string) => {
    const item = recentlyPlayed.find((rp) => rp.track.id === trackId);
    if (!item) return;

    try {
      console.log('✅ [HomeScreen] Playing track:', item.track.title);
      
      // Play this track
      await playTrack(item.track);
      
      // Manually set current track for MiniPlayer (Expo Go compatibility)
      setCurrentTrack(item.track);
      
      console.log('✅ [HomeScreen] Playback started');
    } catch (error) {
      console.error('❌ [HomeScreen] Playback failed:', error);
    }
  };

  // Navigate to playlist detail
  const handlePlaylistPress = (playlist: Playlist) => {
    navigation.navigate('PlaylistDetail', { playlistId: playlist.id });
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="musical-notes-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>Welcome to Demus!</Text>
      <Text style={styles.emptyMessage}>
        Start by importing your first playlist
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('Library')}
      >
        <Text style={styles.emptyButtonText}>Go to Library</Text>
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  // Show empty state if no data
  const hasData = recentlyPlayed.length > 0 || recentPlaylists.length > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={!hasData ? styles.emptyContentContainer : undefined}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {!hasData && !isLoading && !libraryLoading ? (
        renderEmptyState()
      ) : (
        <>
          {/* Recently Played Section */}
          {recentlyPlayed.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Recently Played" />
              <FlatList
                horizontal
                data={recentlyPlayed.slice(0, 5)} // Show max 5 items
                keyExtractor={(item) => item.track.id + item.playedAt}
                renderItem={({ item }) => (
                  <RecentTrackCard
                    item={item}
                    onPress={() => handleTrackPress(item.track.id)}
                  />
                )}
                contentContainerStyle={styles.horizontalList}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}

          {/* Recent Playlists Section */}
          {recentPlaylists.length > 0 && (
            <View style={styles.section}>
              <SectionHeader
                title="Recent Playlists"
                onViewAll={() => navigation.navigate('Library')}
              />
              <FlatList
                horizontal
                data={recentPlaylists}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.playlistCardWrapper}>
                    <PlaylistCard
                      playlist={item}
                      onPress={() => handlePlaylistPress(item)}
                    />
                  </View>
                )}
                contentContainerStyle={styles.horizontalList}
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}

          {/* Guide for new users */}
          {hasData && (
            <View style={styles.guideSection}>
              <Text style={styles.guideTitle}>What's Next?</Text>
              <View style={styles.guideItem}>
                <Ionicons name="library-outline" size={24} color="#007AFF" />
                <View style={styles.guideText}>
                  <Text style={styles.guideItemTitle}>Browse Library</Text>
                  <Text style={styles.guideItemDesc}>
                    View all your imported playlists
                  </Text>
                </View>
              </View>
              <View style={styles.guideItem}>
                <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
                <View style={styles.guideText}>
                  <Text style={styles.guideItemTitle}>Import More</Text>
                  <Text style={styles.guideItemDesc}>
                    Add playlists from Spotify URLs
                  </Text>
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  section: {
    marginBottom: 24,
  },
  horizontalList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  playlistCardWrapper: {
    width: 160,
    marginRight: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  guideSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  guideText: {
    flex: 1,
    marginLeft: 12,
  },
  guideItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  guideItemDesc: {
    fontSize: 13,
    color: '#666',
  },
});

