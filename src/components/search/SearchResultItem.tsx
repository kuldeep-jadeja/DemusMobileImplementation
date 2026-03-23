import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Track, Playlist } from '@/types/audio';
import { colors } from '@/constants/colors';
import { FavoriteButton } from '@/components/common/FavoriteButton';

interface SearchResultItemProps {
  type: 'track' | 'playlist';
  item: Track | Playlist;
  onPress: () => void;
}

export function SearchResultItem({ type, item, onPress }: SearchResultItemProps) {
  if (type === 'track') {
    const track = item as Track;
    return (
      <TouchableOpacity style={styles.container} onPress={onPress}>
        <Image
          source={{ uri: track.albumArt }}
          style={styles.albumArt}
          defaultSource={require('../../../assets/icon.png')}
        />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{track.title}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{track.artist}</Text>
        </View>
        <FavoriteButton
          itemId={track.id}
          itemType="track"
          item={track}
          size="small"
        />
        <Ionicons name="play-circle" size={28} color={colors.primary} style={styles.playIcon} />
      </TouchableOpacity>
    );
  }

  // Playlist
  const playlist = item as Playlist;
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.playlistIcon}>
        <Ionicons name="musical-notes" size={24} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{playlist.name}</Text>
        <Text style={styles.subtitle}>
          {playlist.trackCount} {playlist.trackCount === 1 ? 'track' : 'tracks'}
        </Text>
      </View>
      <FavoriteButton
        itemId={playlist.id}
        itemType="playlist"
        item={playlist}
        size="small"
      />
      <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.background,
  },
  albumArt: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  playlistIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  playIcon: {
    marginLeft: 8,
  },
});
