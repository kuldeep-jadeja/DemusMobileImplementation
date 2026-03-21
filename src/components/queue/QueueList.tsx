import React from 'react';
import { FlatList, StyleSheet, View, Text, useColorScheme } from 'react-native';
import { usePlayback } from '@/contexts/PlaybackContext';
import { removeFromQueue } from '@/services/audio/QueueService';
import TrackPlayer from 'react-native-track-player';
import { QueueItem } from './QueueItem';
import type { Track } from '@/types';

export function QueueList() {
  const { queue, currentIndex } = usePlayback();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  async function handleItemPress(index: number) {
    try {
      await TrackPlayer.skip(index);
      await TrackPlayer.play();
    } catch (error) {
      console.error('Failed to play track:', error);
    }
  }

  async function handleItemRemove(index: number) {
    try {
      await removeFromQueue(index);
    } catch (error) {
      console.error('Failed to remove track:', error);
    }
  }

  function renderItem({ item, index }: { item: Track; index: number }) {
    return (
      <QueueItem
        track={item}
        index={index}
        isCurrent={index === currentIndex}
        onPress={handleItemPress}
        onRemove={handleItemRemove}
      />
    );
  }

  function renderEmpty() {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyHeading, isDark && styles.emptyHeadingDark]}>
          No tracks in queue
        </Text>
        <Text style={[styles.emptyBody, isDark && styles.emptyBodyDark]}>
          Add songs from your library to start listening
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={queue}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={renderEmpty}
      // Performance optimizations for 1000+ tracks
      windowSize={10}              // Only render 10 screens worth
      initialNumToRender={15}      // First render: 15 items
      maxToRenderPerBatch={10}     // Add 10 items per scroll batch
      removeClippedSubviews={true} // Unmount off-screen items
      getItemLayout={(data, index) => ({
        length: 64,
        offset: 64 * index,
        index,
      })}
      style={[styles.list, isDark && styles.listDark]}
      contentContainerStyle={queue.length === 0 ? styles.emptyListContent : undefined}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listDark: {
    backgroundColor: '#121212',
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyHeading: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  emptyHeadingDark: {
    color: '#FFFFFF',
  },
  emptyBody: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
    textAlign: 'center',
  },
  emptyBodyDark: {
    color: '#ABABAB',
  },
});
