import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Playlist } from '../../types';

type PlaylistCardProps = {
  playlist: Playlist;
  onPress: () => void;
};

export function PlaylistCard({ playlist, onPress }: PlaylistCardProps) {
  const getStatusBadgeColor = () => {
    switch (playlist.status) {
      case 'ready':
        return '#10b981'; // green
      case 'matching':
        return '#f59e0b'; // amber
      case 'error':
        return '#ef4444'; // red
      case 'paused':
        return '#6b7280'; // gray
      default:
        return '#3b82f6'; // blue
    }
  };

  const getStatusText = () => {
    switch (playlist.status) {
      case 'ready':
        return 'Ready';
      case 'matching':
        return `Matching ${playlist.importProgress}%`;
      case 'error':
        return 'Error';
      case 'paused':
        return 'Paused';
      case 'imported':
        return 'Imported';
      default:
        return '';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        {playlist.coverImage ? (
          <Image
            source={{ uri: playlist.coverImage }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.coverImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>♪</Text>
          </View>
        )}
        
        {playlist.status !== 'ready' && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusBadgeColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        )}
      </View>

      {playlist.status === 'matching' && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${playlist.importProgress}%` },
              ]}
            />
          </View>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {playlist.name}
        </Text>
        <Text style={styles.trackCount} numberOfLines={1}>
          {playlist.trackCount} {playlist.trackCount === 1 ? 'track' : 'tracks'}
          {playlist.owner && ` • ${playlist.owner}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#1f1f1f',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    color: '#666',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 2,
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  trackCount: {
    fontSize: 14,
    color: '#999',
  },
});
