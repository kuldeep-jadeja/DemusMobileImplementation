import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, useColorScheme } from 'react-native';
import { usePlayback } from '@/contexts/PlaybackContext';
import { ProgressBar } from './ProgressBar';
import { PlaybackControls } from './PlaybackControls';
import { ShuffleRepeatControls } from './ShuffleRepeatControls';

export function MusicPlayer() {
  const {
    currentTrack,
    position,
    duration,
    isPlaying,
    isLoading,
    shuffleEnabled,
    repeatMode,
  } = usePlayback();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!currentTrack) {
    return (
      <View style={[styles.container, isDark && styles.containerDark, styles.emptyContainer]}>
        <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
          No track playing
        </Text>
        <Text style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}>
          Select a track to start listening
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      contentContainerStyle={styles.content}
    >
      {/* Album Art */}
      <View style={styles.artworkContainer}>
        {currentTrack.artwork ? (
          <Image
            source={{ uri: currentTrack.artwork }}
            style={styles.artwork}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.artwork, styles.artworkPlaceholder]}>
            <Text style={styles.artworkPlaceholderText}>♪</Text>
          </View>
        )}
      </View>

      {/* Track Info */}
      <View style={styles.infoContainer}>
        <Text
          style={[styles.title, isDark && styles.titleDark]}
          numberOfLines={2}
        >
          {currentTrack.title}
        </Text>
        <Text
          style={[styles.artist, isDark && styles.artistDark]}
          numberOfLines={1}
        >
          {currentTrack.artist}
        </Text>
        {currentTrack.album && (
          <Text
            style={[styles.album, isDark && styles.albumDark]}
            numberOfLines={1}
          >
            {currentTrack.album}
          </Text>
        )}
      </View>

      {/* Progress Bar */}
      <ProgressBar position={position} duration={duration} />

      {/* Playback Controls */}
      <PlaybackControls isPlaying={isPlaying} isLoading={isLoading} />

      {/* Shuffle & Repeat */}
      <ShuffleRepeatControls
        shuffleEnabled={shuffleEnabled}
        repeatMode={repeatMode}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  content: {
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  emptyTextDark: {
    color: '#FFFFFF',
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
  },
  emptySubtextDark: {
    color: '#ABABAB',
  },
  artworkContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  artwork: {
    width: 300,
    height: 300,
    borderRadius: 8,
  },
  artworkPlaceholder: {
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkPlaceholderText: {
    fontSize: 80,
    color: '#007AFF',
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 4,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  artist: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
    textAlign: 'center',
  },
  artistDark: {
    color: '#ABABAB',
  },
  album: {
    fontSize: 12,
    fontWeight: '400',
    color: '#999999',
    textAlign: 'center',
    marginTop: 4,
  },
  albumDark: {
    color: '#888888',
  },
});
