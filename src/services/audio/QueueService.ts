import TrackPlayer from 'react-native-track-player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Track, RepeatMode, QueueState } from '@/types';

const QUEUE_STORAGE_KEY = 'playback_queue';

// In-memory state
let originalQueue: Track[] = [];
let currentQueue: Track[] = [];
let shuffleEnabled = false;
let repeatMode: RepeatMode = 'off';

/**
 * Set entire queue and start playing first track.
 * Clears any existing queue.
 */
export async function setQueue(tracks: Track[]): Promise<void> {
  try {
    originalQueue = [...tracks];
    currentQueue = shuffleEnabled ? shuffleArray([...tracks]) : [...tracks];

    await TrackPlayer.reset();
    await TrackPlayer.add(currentQueue);
    
    if (currentQueue.length > 0) {
      await TrackPlayer.skip(0);
      await TrackPlayer.play();
    }

    await saveQueueToStorage();
  } catch (error) {
    console.error('Set queue failed:', error);
    throw error;
  }
}

/**
 * Add track to end of queue.
 */
export async function addToQueue(track: Track): Promise<void> {
  try {
    originalQueue.push(track);
    currentQueue.push(track);
    await TrackPlayer.add(track);
    await saveQueueToStorage();
  } catch (error) {
    console.error('Add to queue failed:', error);
    throw error;
  }
}

/**
 * Remove track from queue by index.
 * If removing current track, skips to next.
 */
export async function removeFromQueue(index: number): Promise<void> {
  try {
    const currentIndex = await TrackPlayer.getCurrentTrack();
    
    // Remove from both queues
    const removedTrack = currentQueue[index];
    currentQueue.splice(index, 1);
    
    const originalIndex = originalQueue.findIndex(t => t.id === removedTrack.id);
    if (originalIndex !== -1) {
      originalQueue.splice(originalIndex, 1);
    }

    await TrackPlayer.remove(index);

    // If we removed current track, TrackPlayer auto-advances
    // No need to manually skip

    await saveQueueToStorage();
  } catch (error) {
    console.error('Remove from queue failed:', error);
    throw error;
  }
}

/**
 * Reorder queue by moving track from one index to another.
 * Used for drag-to-reorder in queue UI.
 */
export async function reorderQueue(fromIndex: number, toIndex: number): Promise<void> {
  try {
    // Move in current queue
    const [movedTrack] = currentQueue.splice(fromIndex, 1);
    currentQueue.splice(toIndex, 0, movedTrack);

    // Rebuild TrackPlayer queue
    await TrackPlayer.reset();
    await TrackPlayer.add(currentQueue);

    // Restore playback position if was playing
    const currentTrackIndex = await TrackPlayer.getCurrentTrack();
    if (currentTrackIndex !== null) {
      await TrackPlayer.skip(currentTrackIndex);
    }

    await saveQueueToStorage();
  } catch (error) {
    console.error('Reorder queue failed:', error);
    throw error;
  }
}

/**
 * Toggle shuffle mode.
 * When enabling: keeps current track at front, shuffles rest.
 * When disabling: restores original order.
 */
export async function toggleShuffle(): Promise<void> {
  try {
    shuffleEnabled = !shuffleEnabled;

    const currentIndex = await TrackPlayer.getCurrentTrack();
    const currentTrack = currentIndex !== null ? currentQueue[currentIndex] : null;

    if (shuffleEnabled) {
      // Shuffle: current track first, shuffle rest
      if (currentTrack) {
        const remaining = originalQueue.filter(t => t.id !== currentTrack.id);
        currentQueue = [currentTrack, ...shuffleArray(remaining)];
      } else {
        currentQueue = shuffleArray([...originalQueue]);
      }
    } else {
      // Restore original order
      currentQueue = [...originalQueue];
    }

    await TrackPlayer.reset();
    await TrackPlayer.add(currentQueue);

    // Skip to current track (now at index 0 if shuffling)
    if (currentTrack) {
      const newIndex = currentQueue.findIndex(t => t.id === currentTrack.id);
      if (newIndex !== -1) {
        await TrackPlayer.skip(newIndex);
      }
    }

    await saveQueueToStorage();
  } catch (error) {
    console.error('Toggle shuffle failed:', error);
    throw error;
  }
}

/**
 * Set repeat mode: 'off', 'all', or 'one'.
 * Repeat logic is handled by PlaybackContext listening to queue end events.
 */
export async function setRepeatMode(mode: RepeatMode): Promise<void> {
  try {
    repeatMode = mode;
    await saveQueueToStorage();
  } catch (error) {
    console.error('Set repeat mode failed:', error);
    throw error;
  }
}

/**
 * Get current queue state (for UI).
 */
export function getQueueState(): QueueState {
  return {
    tracks: currentQueue,
    currentIndex: 0, // Will be updated by TrackPlayer events
    shuffleEnabled,
    repeatMode,
  };
}

/**
 * Load queue from AsyncStorage (call on app mount).
 */
export async function loadQueueFromStorage(): Promise<QueueState | null> {
  try {
    const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    if (!stored) return null;

    const state: QueueState = JSON.parse(stored);
    
    // Restore in-memory state
    originalQueue = state.tracks;
    currentQueue = state.tracks;
    shuffleEnabled = state.shuffleEnabled;
    repeatMode = state.repeatMode;

    // Restore TrackPlayer queue
    if (currentQueue.length > 0) {
      await TrackPlayer.add(currentQueue);
      if (state.currentIndex !== null && state.currentIndex >= 0) {
        await TrackPlayer.skip(state.currentIndex);
      }
    }

    return state;
  } catch (error) {
    console.error('Load queue from storage failed:', error);
    return null;
  }
}

/**
 * Save queue to AsyncStorage.
 */
async function saveQueueToStorage(): Promise<void> {
  try {
    const currentIndex = await TrackPlayer.getCurrentTrack();
    const state: QueueState = {
      tracks: originalQueue, // Save original, not shuffled
      currentIndex: currentIndex ?? 0,
      shuffleEnabled,
      repeatMode,
    };
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Save queue to storage failed:', error);
  }
}

/**
 * Fisher-Yates shuffle algorithm.
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Clear all queue state (useful for testing/logout).
 */
export async function clearQueue(): Promise<void> {
  try {
    originalQueue = [];
    currentQueue = [];
    shuffleEnabled = false;
    repeatMode = 'off';
    await TrackPlayer.reset();
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
  } catch (error) {
    console.error('Clear queue failed:', error);
  }
}
