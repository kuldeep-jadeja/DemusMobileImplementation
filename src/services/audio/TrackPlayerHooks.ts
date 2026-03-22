/**
 * Wrapper for react-native-track-player hooks that provides mock implementations in Expo Go.
 */
import { useState, useEffect } from 'react';
import { isExpoGo } from './TrackPlayerWrapper';

// Mock progress hook
const useMockProgress = () => ({
  position: 0,
  duration: 0,
  buffered: 0,
});

// Mock playback state hook  
const useMockPlaybackState = () => ({
  state: 'idle',
});

// Mock event listener hook
const useMockTrackPlayerEvents = () => {
  // No-op
};

let useProgress: any;
let usePlaybackState: any;
let useTrackPlayerEvents: any;
let Event: any;
let State: any;

if (isExpoGo) {
  // Use mock hooks in Expo Go
  useProgress = useMockProgress;
  usePlaybackState = useMockPlaybackState;
  useTrackPlayerEvents = useMockTrackPlayerEvents;
  Event = {
    PlaybackState: 'playback-state',
    PlaybackError: 'playback-error',
    PlaybackTrackChanged: 'playback-track-changed',
    PlaybackQueueEnded: 'playback-queue-ended',
  };
  State = {
    None: 'none',
    Playing: 'playing',
    Paused: 'paused',
    Stopped: 'stopped',
    Buffering: 'buffering',
  };
} else {
  try {
    // Load real hooks in development/production builds
    const TrackPlayerModule = require('react-native-track-player');
    useProgress = TrackPlayerModule.useProgress;
    usePlaybackState = TrackPlayerModule.usePlaybackState;
    useTrackPlayerEvents = TrackPlayerModule.useTrackPlayerEvents;
    Event = TrackPlayerModule.Event;
    State = TrackPlayerModule.State;
  } catch (error) {
    console.warn('⚠️ react-native-track-player hooks not available, using mocks');
    useProgress = useMockProgress;
    usePlaybackState = useMockPlaybackState;
    useTrackPlayerEvents = useMockTrackPlayerEvents;
    Event = {
      PlaybackState: 'playback-state',
      PlaybackError: 'playback-error',
      PlaybackTrackChanged: 'playback-track-changed',
      PlaybackQueueEnded: 'playback-queue-ended',
    };
    State = {
      None: 'none',
      Playing: 'playing',
      Paused: 'paused',
      Stopped: 'stopped',
      Buffering: 'buffering',
    };
  }
}

export { useProgress, usePlaybackState, useTrackPlayerEvents, Event, State };
