import React from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity, useColorScheme, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { QueueList } from '@/components/queue/QueueList';
import { usePlayback } from '@/contexts/PlaybackContext';
import { clearQueue } from '@/services/audio/QueueService';
import * as Haptics from 'expo-haptics';

export function QueueScreen() {
  const { queue } = usePlayback();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  function handleClearQueue() {
    if (queue.length === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Clear entire queue?',
      'This will remove all tracks from the queue.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearQueue();
            navigation.goBack();
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.titleDark]}>
          Queue
        </Text>
        <Text style={[styles.count, isDark && styles.countDark]}>
          {queue.length} {queue.length === 1 ? 'track' : 'tracks'}
        </Text>
        {queue.length > 0 && (
          <TouchableOpacity
            onPress={handleClearQueue}
            style={styles.clearButton}
            accessibilityLabel="Clear queue"
          >
            <Ionicons name="trash-outline" size={24} color="#ff3b30" />
          </TouchableOpacity>
        )}
      </View>
      <QueueList />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  count: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
    marginRight: 12,
  },
  countDark: {
    color: '#ABABAB',
  },
  clearButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
