import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProgress, usePlaybackState, useTrackPlayerEvents, Event, State } from '@/services/audio/TrackPlayerHooks';
import TrackPlayer from '@/services/audio/TrackPlayerWrapper';
import type { Track, RepeatMode, RecentlyPlayedItem } from '@/types';
import { loadQueueFromStorage, getQueueState } from '@/services/audio/QueueService';
import { play } from '@/services/audio/PlaybackService';

const HISTORY_STORAGE_KEY = '@demus:recentlyPlayed';
const MAX_HISTORY_ITEMS = 20;

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
  setCurrentTrack: (track: Track | null) => void; // NEW: Manual track setter for Expo Go
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

  /**
   * Save track to recently played history
   */
  const saveToHistory = async (track: Track) => {
    try {
      // Load existing history
      const stored = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      let history: RecentlyPlayedItem[] = stored ? JSON.parse(stored) : [];

      // Create new history item
      const newItem: RecentlyPlayedItem = {
        track,
        playedAt: new Date().toISOString(),
        // Optional: add playlist context if available (can be enhanced later)
      };

      // Prepend to history (most recent first)
      history = [newItem, ...history];

      // Keep only last MAX_HISTORY_ITEMS
      history = history.slice(0, MAX_HISTORY_ITEMS);

      // Save back to storage
      await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
      console.log('✅ [PlaybackContext] Saved to history:', track.title);
    } catch (error) {
      console.error('❌ [PlaybackContext] Failed to save history:', error);
    }
  };

  /**
   * Wrapper for setCurrentTrack that also saves to history
   * Used for manual track setting in Expo Go
   */
  const setCurrentTrackWithHistory = async (track: Track | null) => {
    setCurrentTrack(track);
    if (track) {
      await saveToHistory(track);
    }
  };

  // Use RNTP hooks - update every 1 second (not default 250ms)
  const { position, duration } = useProgress(1000);
  const playbackState = usePlaybackState();

  const isPlaying = playbackState.state === State.Playing;
  const isLoading = playbackState.state === State.Buffering || playbackState.state === State.Loading;

  // Listen for track changes
  useTrackPlayerEvents([Event.PlaybackTrackChanged], async (event) => {
    if (event.type === Event.PlaybackTrackChanged && event.nextTrack !== undefined) {
      const track = await TrackPlayer.getTrack(event.nextTrack);
      const trackData = track as Track;
      setCurrentTrack(trackData);
      setCurrentIndex(event.nextTrack);
      
      // Save to history
      if (trackData) {
        await saveToHistory(trackData);
      }
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
    setCurrentTrack: setCurrentTrackWithHistory, // Use wrapper that saves to history
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
