import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { usePlayback } from '@/contexts/PlaybackContext';
import { play, pause, skipToNext, skipToPrevious } from '@/services/audio/PlaybackService';
import * as Haptics from 'expo-haptics';

export function MiniPlayer() {
  const { currentTrack, isPlaying, isLoading } = usePlayback();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  if (!currentTrack) {
    return null; // Don't show mini-player when no track
  }

  async function handlePlayPause() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  }

  async function handleNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await skipToNext();
  }

  async function handlePrevious() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await skipToPrevious();
  }

  function openPlayer() {
    navigation.navigate('Player' as never);
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isDark && styles.containerDark,
        { paddingBottom: insets.bottom + 8, marginBottom: 60 + insets.bottom }
      ]}
      onPress={openPlayer}
      activeOpacity={0.8}
    >
      {/* Album Art */}
      {currentTrack.artwork ? (
        <Image
          source={{ uri: currentTrack.artwork }}
          style={styles.artwork}
        />
      ) : (
        <View style={[styles.artwork, styles.artworkPlaceholder]}>
          <Text style={styles.artworkPlaceholderText}>♪</Text>
        </View>
      )}

      {/* Track Info */}
      <View style={styles.info}>
        <Text
          style={[styles.title, isDark && styles.titleDark]}
          numberOfLines={1}
        >
          {currentTrack.title}
        </Text>
        <Text
          style={[styles.artist, isDark && styles.artistDark]}
          numberOfLines={1}
        >
          {currentTrack.artist}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={handlePrevious}
          style={styles.controlButton}
          accessibilityLabel="Previous track"
        >
          <Ionicons
            name="play-skip-back"
            size={24}
            color={isDark ? '#FFFFFF' : '#000000'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handlePlayPause}
          style={styles.controlButton}
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          disabled={isLoading}
        >
          <Ionicons
            name={isPlaying ? 'pause-circle' : 'play-circle'}
            size={32}
            color="#007AFF"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          style={styles.controlButton}
          accessibilityLabel="Next track"
        >
          <Ionicons
            name="play-skip-forward"
            size={24}
            color={isDark ? '#FFFFFF' : '#000000'}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: 16,
    gap: 12,
  },
  containerDark: {
    backgroundColor: '#1C1C1E',
    borderTopColor: '#2C2C2E',
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: 4,
  },
  artworkPlaceholder: {
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkPlaceholderText: {
    fontSize: 20,
    color: '#007AFF',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  artist: {
    fontSize: 12,
    fontWeight: '400',
    color: '#666666',
  },
  artistDark: {
    color: '#ABABAB',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
