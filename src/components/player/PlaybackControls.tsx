import React from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { play, pause, skipToNext, skipToPrevious } from '@/services/audio/PlaybackService';
import * as Haptics from 'expo-haptics';

type PlaybackControlsProps = {
  isPlaying: boolean;
  isLoading?: boolean;
};

export function PlaybackControls({ isPlaying, isLoading = false }: PlaybackControlsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColor = isDark ? '#FFFFFF' : '#000000';

  async function handlePlayPause() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  }

  async function handlePrevious() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await skipToPrevious();
  }

  async function handleNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await skipToNext();
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handlePrevious}
        style={styles.button}
        accessibilityLabel="Previous track"
        accessibilityRole="button"
      >
        <Ionicons name="play-skip-back" size={32} color={iconColor} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handlePlayPause}
        style={[styles.button, styles.playButton]}
        accessibilityLabel={isPlaying ? 'Pause playback' : 'Play track'}
        accessibilityRole="button"
        disabled={isLoading}
      >
        {isLoading ? (
          <Ionicons name="hourglass" size={48} color="#007AFF" />
        ) : (
          <Ionicons
            name={isPlaying ? 'pause-circle' : 'play-circle'}
            size={48}
            color="#007AFF"
          />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleNext}
        style={styles.button}
        accessibilityLabel="Next track"
        accessibilityRole="button"
      >
        <Ionicons name="play-skip-forward" size={32} color={iconColor} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 16,
  },
  button: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
  },
});
