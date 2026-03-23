import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FavoriteButton } from '@/components/common/FavoriteButton';
import { ApiTrack } from '../../types';

type TrackListItemProps = {
  track: ApiTrack;
  index: number;
  onPress: () => void;
  onMenuPress?: () => void;
};

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function TrackListItem({ track, index, onPress, onMenuPress }: TrackListItemProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Track Number or Album Art */}
      <View style={styles.leading}>
        {track.albumImage ? (
          <Image
            source={{ uri: track.albumImage }}
            style={styles.albumArt}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.indexContainer}>
            <Text style={styles.indexText}>{index + 1}</Text>
          </View>
        )}
      </View>

      {/* Track Info */}
      <View style={styles.info}>
        <Text style={styles.trackName} numberOfLines={1}>
          {track.name}
        </Text>
        <Text style={styles.artistName} numberOfLines={1}>
          {track.artists.join(', ')}
        </Text>
      </View>

      {/* Favorite Button */}
      {track.youtubeVideoId && (
        <FavoriteButton
          itemId={track.spotifyId || track.youtubeVideoId}
          itemType="track"
          item={{
            id: track.spotifyId || track.youtubeVideoId,
            title: track.name,
            artist: track.artists.join(', '),
            albumArt: track.albumImage || '',
            duration: track.duration,
            videoId: track.youtubeVideoId,
          }}
          size="small"
        />
      )}

      {/* Duration */}
      <Text style={styles.duration}>{formatDuration(track.duration)}</Text>

      {/* Menu Button */}
      {onMenuPress && (
        <TouchableOpacity
          style={styles.menuButton}
          onPress={onMenuPress}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#999" />
        </TouchableOpacity>
      )}

      {/* YouTube Status Indicator */}
      {!track.youtubeVideoId && (
        <View style={styles.statusIndicator}>
          <Ionicons name="alert-circle" size={16} color="#ef4444" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#1a1a1a',
  },
  leading: {
    marginRight: 12,
  },
  albumArt: {
    width: 48,
    height: 48,
    borderRadius: 4,
  },
  indexContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
  },
  indexText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  trackName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 14,
    color: '#999',
  },
  duration: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  menuButton: {
    padding: 4,
  },
  statusIndicator: {
    marginLeft: 8,
  },
});
