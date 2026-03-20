import '@testing-library/jest-native/extend-expect';

// Mock expo-secure-store with plain implementation
jest.mock('expo-secure-store', () => ({
  setItemAsync: () => Promise.resolve(),
  getItemAsync: () => Promise.resolve(null),
  deleteItemAsync: () => Promise.resolve(),
}));

// Mock expo-auth-session
jest.mock('expo-auth-session', () => ({}));

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({}));

// Mock react-native-track-player
jest.mock('react-native-track-player', () => ({
  default: {
    setupPlayer: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
    updateOptions: jest.fn().mockResolvedValue(undefined),
    add: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn().mockResolvedValue(undefined),
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
    skip: jest.fn().mockResolvedValue(undefined),
    skipToNext: jest.fn().mockResolvedValue(undefined),
    skipToPrevious: jest.fn().mockResolvedValue(undefined),
    seekTo: jest.fn().mockResolvedValue(undefined),
    getPosition: jest.fn().mockResolvedValue(0),
    getDuration: jest.fn().mockResolvedValue(0),
    getCurrentTrack: jest.fn().mockResolvedValue(null),
    getTrack: jest.fn().mockResolvedValue(null),
    getQueue: jest.fn().mockResolvedValue([]),
    setRepeatMode: jest.fn().mockResolvedValue(undefined),
  },
  useProgress: jest.fn(() => ({ position: 0, duration: 0 })),
  usePlaybackState: jest.fn(() => ({ state: 'idle' })),
  useTrackPlayerEvents: jest.fn(),
  Event: {
    PlaybackTrackChanged: 'playback-track-changed',
    PlaybackQueueEnded: 'playback-queue-ended',
  },
  State: {
    Playing: 'playing',
    Paused: 'paused',
    Buffering: 'buffering',
    Loading: 'loading',
    Idle: 'idle',
  },
}));

// Silence console errors in tests
global.console = {
  ...console,
  error: () => {},
  warn: () => {},
};
