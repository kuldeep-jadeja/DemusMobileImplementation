/**
 * Wrapper for react-native-track-player that provides mock implementations in Expo Go.
 * This allows the app to run in Expo Go (UI only) without crashing.
 */
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

// Mock Capability enum for Expo Go
const MockCapability = {
  Play: 'play',
  Pause: 'pause',
  SkipToNext: 'skip-next',
  SkipToPrevious: 'skip-previous',
  SeekTo: 'seek-to',
};

// Mock TrackPlayer for Expo Go
const MockTrackPlayer = {
  setupPlayer: async () => {
    console.log('[Mock] TrackPlayer.setupPlayer called');
  },
  updateOptions: async () => {
    console.log('[Mock] TrackPlayer.updateOptions called');
  },
  reset: async () => {
    console.log('[Mock] TrackPlayer.reset called');
  },
  add: async () => {
    console.log('[Mock] TrackPlayer.add called');
  },
  remove: async () => {
    console.log('[Mock] TrackPlayer.remove called');
  },
  skip: async () => {
    console.log('[Mock] TrackPlayer.skip called');
  },
  skipToNext: async () => {
    console.log('[Mock] TrackPlayer.skipToNext called');
  },
  skipToPrevious: async () => {
    console.log('[Mock] TrackPlayer.skipToPrevious called');
  },
  play: async () => {
    console.log('[Mock] TrackPlayer.play called');
  },
  pause: async () => {
    console.log('[Mock] TrackPlayer.pause called');
  },
  seekTo: async () => {
    console.log('[Mock] TrackPlayer.seekTo called');
  },
  getCurrentTrack: async () => {
    console.log('[Mock] TrackPlayer.getCurrentTrack called');
    return null;
  },
  getTrack: async () => {
    console.log('[Mock] TrackPlayer.getTrack called');
    return null;
  },
  getPosition: async () => 0,
  getDuration: async () => 0,
  getQueue: async () => [],
  addEventListener: () => ({ remove: () => {} }),
  removeEventListener: () => {},
};

let TrackPlayer: any = MockTrackPlayer;
let Capability: any = MockCapability;

// Only try to load real module if not in Expo Go
if (!isExpoGo) {
  try {
    console.log('Attempting to load react-native-track-player...');
    // Dynamically require the module only in non-Expo Go environments
    const TrackPlayerModule = require('react-native-track-player');
    
    if (TrackPlayerModule) {
      TrackPlayer = TrackPlayerModule.default || TrackPlayerModule;
      Capability = TrackPlayerModule.Capability || MockCapability;
      console.log('✅ react-native-track-player loaded successfully');
    } else {
      console.warn('⚠️ react-native-track-player module is null, using mocks');
    }
  } catch (error) {
    console.warn('⚠️ react-native-track-player not available, using mocks:', error);
    // Keep using mocks
  }
} else {
  console.warn('⚠️ Running in Expo Go - Using mock TrackPlayer (UI only mode)');
}

export { TrackPlayer as default, Capability, isExpoGo };
