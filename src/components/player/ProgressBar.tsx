import React, { useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions, useColorScheme } from 'react-native';
import { seekTo } from '@/services/audio/PlaybackService';
import * as Haptics from 'expo-haptics';

type ProgressBarProps = {
  position: number;    // Current position in seconds
  duration: number;    // Track duration in seconds
};

/**
 * Format seconds as M:SS or MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ProgressBar({ position, duration }: ProgressBarProps) {
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const screenWidth = Dimensions.get('window').width;
  const barWidth = screenWidth - 64; // 32px padding on each side

  // Use local seek position while dragging, actual position otherwise
  const displayPosition = isSeeking ? seekPosition : position;
  const progress = duration > 0 ? displayPosition / duration : 0;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      setIsSeeking(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Calculate initial seek position from touch
      const x = evt.nativeEvent.locationX;
      const newPosition = (x / barWidth) * duration;
      setSeekPosition(Math.max(0, Math.min(duration, newPosition)));
    },
    onPanResponderMove: (evt) => {
      const x = evt.nativeEvent.locationX;
      const newPosition = (x / barWidth) * duration;
      setSeekPosition(Math.max(0, Math.min(duration, newPosition)));
    },
    onPanResponderRelease: () => {
      setIsSeeking(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      seekTo(seekPosition);
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.timeRow}>
        <Text style={[styles.timeText, isDark && styles.timeTextDark]}>
          {formatTime(displayPosition)}
        </Text>
        <Text style={[styles.timeText, isDark && styles.timeTextDark]}>
          {formatTime(duration)}
        </Text>
      </View>

      <View style={styles.barContainer} {...panResponder.panHandlers}>
        <View style={[styles.track, isDark && styles.trackDark]}>
          <View
            testID="progress-fill"
            style={[
              styles.fill,
              { width: `${progress * 100}%` },
            ]}
          />
          <View
            style={[
              styles.thumb,
              { left: `${progress * 100}%` },
              isSeeking && styles.thumbActive,
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#666666',
  },
  timeTextDark: {
    color: '#ABABAB',
  },
  barContainer: {
    height: 48, // 48px touch target for accessibility
    justifyContent: 'center',
  },
  track: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  trackDark: {
    backgroundColor: '#2C2C2E',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: '#007AFF',
  },
  thumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    marginLeft: -8, // Center the thumb on the position
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  thumbActive: {
    transform: [{ scale: 1.2 }],
  },
});
