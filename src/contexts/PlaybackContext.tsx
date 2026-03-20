import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useProgress, usePlaybackState, useTrackPlayerEvents } from 'react-native-track-player';
import TrackPlayer, { Event, State } from 'react-native-track-player';
import type { Track, RepeatMode } from '@/types';
import { loadQueueFromStorage, getQueueState } from '@/services/audio/QueueService';
import { play } from '@/services/audio/PlaybackService';

type PlaybackContextType = {
  currentTrack: Track | null;
  position: number;        // Current position in seconds
  duration: number;        // Track duration in seconds
  isPlaying: boolean;
  isLoading: boolean;
  queue: Track[];
  currentIndex: number;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
};

const PlaybackContext = createContext<PlaybackContextType | undefined>(undefined);

type PlaybackProviderProps = {
  children: ReactNode;
};

export function PlaybackProvider({ children }: PlaybackProviderProps) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');

  // Use RNTP hooks - update every 1 second (not default 250ms)
  const { position, duration } = useProgress(1000);
  const playbackState = usePlaybackState();

  const isPlaying = playbackState.state === State.Playing;
  const isLoading = playbackState.state === State.Buffering || playbackState.state === State.Loading;

  // Listen for track changes
  useTrackPlayerEvents([Event.PlaybackTrackChanged], async (event) => {
    if (event.type === Event.PlaybackTrackChanged && event.nextTrack !== undefined) {
      const track = await TrackPlayer.getTrack(event.nextTrack);
      setCurrentTrack(track as Track);
      setCurrentIndex(event.nextTrack);
    }
  });

  // Handle queue end for repeat mode
  useTrackPlayerEvents([Event.PlaybackQueueEnded], async (event) => {
    if (repeatMode === 'all') {
      // Repeat all: go back to first track
      await TrackPlayer.skip(0);
      await play();
    } else if (repeatMode === 'one') {
      // Repeat one: replay current track
      if (currentIndex !== null) {
        await TrackPlayer.skip(currentIndex);
        await play();
      }
    }
    // repeatMode === 'off': do nothing, let playback stop
  });

  // Load queue from storage on mount
  useEffect(() => {
    async function loadQueue() {
      try {
        const savedQueue = await loadQueueFromStorage();
        if (savedQueue) {
          setQueue(savedQueue.tracks);
          setCurrentIndex(savedQueue.currentIndex);
          setShuffleEnabled(savedQueue.shuffleEnabled);
          setRepeatMode(savedQueue.repeatMode);

          // Get current track
          const track = await TrackPlayer.getTrack(savedQueue.currentIndex);
          if (track) {
            setCurrentTrack(track as Track);
          }
        }
      } catch (error) {
        console.error('Failed to load saved queue:', error);
      }
    }

    loadQueue();
  }, []);

  // Sync queue state from QueueService when it changes
  useEffect(() => {
    const interval = setInterval(() => {
      const state = getQueueState();
      setQueue(state.tracks);
      setShuffleEnabled(state.shuffleEnabled);
      setRepeatMode(state.repeatMode);
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const value: PlaybackContextType = {
    currentTrack,
    position,
    duration,
    isPlaying,
    isLoading,
    queue,
    currentIndex,
    shuffleEnabled,
    repeatMode,
  };

  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  );
}

/**
 * Hook to access playback state.
 * Must be used within PlaybackProvider.
 */
export function usePlayback(): PlaybackContextType {
  const context = useContext(PlaybackContext);
  if (context === undefined) {
    throw new Error('usePlayback must be used within PlaybackProvider');
  }
  return context;
}
