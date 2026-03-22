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

/**
 * Playlist status during import process
 */
export type PlaylistStatus = 'imported' | 'matching' | 'ready' | 'paused' | 'error';

/**
 * Playlist model (user's library)
 */
export type Playlist = {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  owner?: string;
  trackCount: number;
  status: PlaylistStatus;
  importProgress: number;  // 0-100
  spotifyPlaylistId?: string;
  tracks?: ApiTrack[];     // Populated only in detail view
  retryAfter?: string;     // ISO date string
  errorMessage?: string;
  createdAt?: string;      // ISO date string
};

/**
 * Track model from API (before conversion to playback Track)
 */
export type ApiTrack = {
  id: string;
  spotifyId: string;
  name: string;
  artists: string[];
  album: string;
  duration: number;        // Milliseconds
  youtubeVideoId: string | null;
  albumImage?: string;
  importedAt?: string;     // ISO date string
};

/**
 * Recently played track with metadata
 */
export type RecentlyPlayedItem = {
  track: Track;
  playedAt: string;        // ISO timestamp
  playlistId?: string;     // Optional playlist context
  playlistName?: string;   // Optional playlist name for display
};
