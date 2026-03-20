import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { PlaybackProvider, usePlayback } from '@/contexts/PlaybackContext';

// Mock react-native-track-player hooks
jest.mock('react-native-track-player', () => ({
  useProgress: jest.fn(() => ({ position: 0, duration: 0 })),
  usePlaybackState: jest.fn(() => ({ state: 'idle' })),
  useTrackPlayerEvents: jest.fn(),
  Event: { PlaybackTrackChanged: 'playback-track-changed', PlaybackQueueEnded: 'playback-queue-ended' },
  State: { Playing: 'playing', Paused: 'paused', Buffering: 'buffering', Loading: 'loading' },
  getTrack: jest.fn(),
  skip: jest.fn(),
}));

jest.mock('@/services/audio/QueueService', () => ({
  loadQueueFromStorage: jest.fn().mockResolvedValue(null),
  getQueueState: jest.fn(() => ({ tracks: [], currentIndex: 0, shuffleEnabled: false, repeatMode: 'off' })),
}));

jest.mock('@/services/audio/PlaybackService', () => ({
  play: jest.fn(),
}));

function TestComponent() {
  const { currentTrack, position, isPlaying } = usePlayback();
  return (
    <Text>
      {currentTrack?.title || 'No track'} - {position}s - {isPlaying ? 'Playing' : 'Paused'}
    </Text>
  );
}

describe('PlaybackContext', () => {
  it('provides playback state to children', () => {
    const { getByText } = render(
      <PlaybackProvider>
        <TestComponent />
      </PlaybackProvider>
    );

    expect(getByText(/No track/)).toBeTruthy();
  });

  it('throws error when usePlayback used outside provider', () => {
    // Suppress console.error for this test
    const consoleError = console.error;
    console.error = jest.fn();

    expect(() => render(<TestComponent />)).toThrow(
      'usePlayback must be used within PlaybackProvider'
    );

    console.error = consoleError;
  });
});
