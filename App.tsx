import React, { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { PlaybackProvider } from './src/contexts/PlaybackContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { setupTrackPlayer } from './src/services/audio/TrackPlayerService';
import { MiniPlayer } from './src/components/player/MiniPlayer';

export default function App() {
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  useEffect(() => {
    async function initPlayer() {
      try {
        await setupTrackPlayer();
        setIsPlayerReady(true);
      } catch (error) {
        console.error('Failed to initialize audio player:', error);
        // Still set ready to true so app doesn't hang
        setIsPlayerReady(true);
      }
    }

    initPlayer();
  }, []);

  // Show loading screen while initializing audio player
  if (!isPlayerReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={styles.loadingText}>Initializing audio...</Text>
      </View>
    );
  }

  return (
    <PlaybackProvider>
      <AuthProvider>
        <AppNavigator />
        <MiniPlayer />
      </AuthProvider>
    </PlaybackProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
});
