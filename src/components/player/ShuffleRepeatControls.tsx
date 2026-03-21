import React from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toggleShuffle, setRepeatMode } from '@/services/audio/QueueService';
import type { RepeatMode } from '@/types';
import * as Haptics from 'expo-haptics';

type ShuffleRepeatControlsProps = {
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
};

export function ShuffleRepeatControls({ shuffleEnabled, repeatMode }: ShuffleRepeatControlsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const inactiveColor = isDark ? '#666666' : '#ABABAB';
  const activeColor = '#007AFF';

  async function handleShufflePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleShuffle();
  }

  async function handleRepeatPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Cycle through repeat modes
    const nextMode: RepeatMode = 
      repeatMode === 'off' ? 'all' :
      repeatMode === 'all' ? 'one' :
      'off';
    
    await setRepeatMode(nextMode);
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleShufflePress}
        style={styles.button}
        accessibilityLabel={`Shuffle: ${shuffleEnabled ? 'on' : 'off'}`}
        accessibilityRole="button"
      >
        <Ionicons
          name="shuffle"
          size={24}
          color={shuffleEnabled ? activeColor : inactiveColor}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleRepeatPress}
        style={styles.button}
        accessibilityLabel={`Repeat: ${repeatMode}`}
        accessibilityRole="button"
      >
        <Ionicons
          name={repeatMode === 'one' ? 'repeat-outline' : 'repeat'}
          size={24}
          color={repeatMode !== 'off' ? activeColor : inactiveColor}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  button: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
