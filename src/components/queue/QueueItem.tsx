import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Track } from '@/types';
import * as Haptics from 'expo-haptics';

type QueueItemProps = {
  track: Track;
  index: number;
  isCurrent: boolean;
  onPress: (index: number) => void;
  onRemove: (index: number) => void;
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function QueueItem({ track, index, isCurrent, onPress, onRemove }: QueueItemProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(index);
  }

  function handleRemove() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRemove(index);
  }

  return (
    <TouchableOpacity
      testID="queue-item-container"
      style={[
        styles.container,
        isDark && styles.containerDark,
        isCurrent && styles.containerCurrent,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Drag Handle */}
      <View style={styles.dragHandle}>
        <Ionicons
          name="reorder-three"
          size={20}
          color={isDark ? '#666666' : '#999999'}
        />
      </View>

      {/* Album Art */}
      {track.artwork ? (
        <Image
          source={{ uri: track.artwork }}
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
          style={[styles.title, isDark && styles.titleDark, isCurrent && styles.titleCurrent]}
          numberOfLines={1}
        >
          {track.title}
        </Text>
        <Text
          style={[styles.subtitle, isDark && styles.subtitleDark]}
          numberOfLines={1}
        >
          {track.artist} • {formatDuration(track.duration)}
        </Text>
      </View>

      {/* Remove Button */}
      <TouchableOpacity
        onPress={handleRemove}
        style={styles.removeButton}
        accessibilityLabel="Remove from queue"
        accessibilityRole="button"
      >
        <Ionicons
          name="close-circle"
          size={24}
          color="#ff3b30"
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingHorizontal: 8,
    gap: 8,
  },
  containerDark: {
    backgroundColor: '#1C1C1E',
    borderBottomColor: '#2C2C2E',
  },
  containerCurrent: {
    backgroundColor: '#E5F3FF',
  },
  dragHandle: {
    width: 24,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 16,
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
  titleCurrent: {
    color: '#007AFF',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#666666',
  },
  subtitleDark: {
    color: '#ABABAB',
  },
  removeButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
