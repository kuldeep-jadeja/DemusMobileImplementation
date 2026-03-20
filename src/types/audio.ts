/**
 * Audio type definitions for Demus music playback
 */

/**
 * Represents a music track in the queue
 */
export type Track = {
  id: string;
  url: string;           // Stream URL
  title: string;
  artist: string;
  album?: string;
  artwork?: string;      // Album art URL (300x300 for player, 48x48 for mini)
  duration: number;      // Milliseconds
  genre?: string;
};

/**
 * Repeat mode for queue playback
 */
export type RepeatMode = 'off' | 'all' | 'one';

/**
 * Current queue state
 */
export type QueueState = {
  tracks: Track[];
  currentIndex: number;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
};

/**
 * Current playback state
 */
export type PlaybackState = {
  position: number;      // Current position in ms
  duration: number;      // Track duration in ms
  isPlaying: boolean;
  isLoading: boolean;
};
