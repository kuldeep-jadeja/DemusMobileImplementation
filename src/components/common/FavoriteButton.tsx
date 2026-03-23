import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Track, Playlist } from '@/types/audio';
import { colors } from '@/constants/colors';

interface FavoriteButtonProps {
  itemId: string;
  itemType: 'track' | 'playlist';
  item: Track | Playlist;
  size?: 'small' | 'large';
  color?: string;
}

export function FavoriteButton({
  itemId,
  itemType,
  item,
  size = 'small',
  color = colors.error,
}: FavoriteButtonProps) {
  const { isFavoriteTrack, isFavoritePlaylist, toggleFavoriteTrack, toggleFavoritePlaylist } = useFavorites();
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const isFavorited = itemType === 'track' 
    ? isFavoriteTrack(itemId)
    : isFavoritePlaylist(itemId);

  const iconSize = size === 'large' ? 32 : 24;

  const handlePress = async () => {
    // Animate
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Toggle favorite
    try {
      if (itemType === 'track') {
        await toggleFavoriteTrack(item as Track);
      } else {
        await toggleFavoritePlaylist(item as Playlist);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.container}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={isFavorited ? 'heart' : 'heart-outline'}
          size={iconSize}
          color={isFavorited ? color : colors.textSecondary}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
});
