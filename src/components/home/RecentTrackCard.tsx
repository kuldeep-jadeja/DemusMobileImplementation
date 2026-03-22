import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RecentlyPlayedItem } from '@/types';

type RecentTrackCardProps = {
  item: RecentlyPlayedItem;
  onPress: () => void;
};

/**
 * Horizontal track card for recently played section
 * Compact design with album art, title, artist, and play button overlay
 */
export default function RecentTrackCard({ item, onPress }: RecentTrackCardProps) {
  const { track, playlistName } = item;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Album Art with Play Button Overlay */}
      <View style={styles.artworkContainer}>
        {track.artwork ? (
          <Image
            source={{ uri: track.artwork }}
            style={styles.artwork}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.artwork, styles.placeholderArt]}>
            <Ionicons name="musical-notes" size={40} color="#999" />
          </View>
        )}
        
        {/* Play Button Overlay */}
        <View style={styles.playOverlay}>
          <View style={styles.playButton}>
            <Ionicons name="play" size={18} color="#fff" />
          </View>
        </View>
      </View>

      {/* Track Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.artist}
        </Text>
        {playlistName && (
          <Text style={styles.playlist} numberOfLines={1}>
            {playlistName}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 140,
    marginRight: 12,
  },
  artworkContainer: {
    width: 140,
    height: 140,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
    position: 'relative',
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  placeholderArt: {
    backgroundColor: '#e8e8e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 2, // Optical centering for play icon
  },
  info: {
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  artist: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  playlist: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
});
