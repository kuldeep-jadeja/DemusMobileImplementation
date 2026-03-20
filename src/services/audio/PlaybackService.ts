import TrackPlayer from 'react-native-track-player';
import type { Track } from '@/types';

/**
 * Start or resume playback.
 */
export async function play(): Promise<void> {
  try {
    await TrackPlayer.play();
  } catch (error) {
    console.error('Play failed:', error);
    throw error;
  }
}

/**
 * Pause playback.
 */
export async function pause(): Promise<void> {
  try {
    await TrackPlayer.pause();
  } catch (error) {
    console.error('Pause failed:', error);
    throw error;
  }
}

/**
 * Skip to next track in queue.
 * If at end of queue, behavior depends on repeat mode (handled by context).
 */
export async function skipToNext(): Promise<void> {
  try {
    await TrackPlayer.skipToNext();
  } catch (error) {
    console.error('Skip to next failed:', error);
    // Don't throw — might be at end of queue
  }
}

/**
 * Skip to previous track in queue.
 * If within first 3 seconds of current track, skips to previous.
 * Otherwise, restarts current track.
 */
export async function skipToPrevious(): Promise<void> {
  try {
    const position = await TrackPlayer.getPosition();
    
    if (position > 3) {
      // More than 3 seconds in — restart current track
      await TrackPlayer.seekTo(0);
    } else {
      // Within first 3 seconds — go to previous track
      await TrackPlayer.skipToPrevious();
    }
  } catch (error) {
    console.error('Skip to previous failed:', error);
    // Don't throw — might be at start of queue
  }
}

/**
 * Seek to specific position in current track.
 * @param position - Position in seconds (TrackPlayer uses seconds, not ms)
 */
export async function seekTo(position: number): Promise<void> {
  try {
    await TrackPlayer.seekTo(position);
  } catch (error) {
    console.error('Seek failed:', error);
    throw error;
  }
}

/**
 * Get current track from TrackPlayer queue.
 * Returns null if no track is loaded.
 */
export async function getCurrentTrack(): Promise<Track | null> {
  try {
    const currentTrackIndex = await TrackPlayer.getCurrentTrack();
    if (currentTrackIndex === null) return null;

    const track = await TrackPlayer.getTrack(currentTrackIndex);
    return track as Track;
  } catch (error) {
    console.error('Get current track failed:', error);
    return null;
  }
}

/**
 * Get current playback position in seconds.
 */
export async function getPosition(): Promise<number> {
  try {
    return await TrackPlayer.getPosition();
  } catch (error) {
    console.error('Get position failed:', error);
    return 0;
  }
}

/**
 * Get current track duration in seconds.
 */
export async function getDuration(): Promise<number> {
  try {
    return await TrackPlayer.getDuration();
  } catch (error) {
    console.error('Get duration failed:', error);
    return 0;
  }
}
