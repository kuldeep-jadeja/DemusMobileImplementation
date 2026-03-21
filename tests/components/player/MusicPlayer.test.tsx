import React from 'react';
import { render } from '@testing-library/react-native';
import { MusicPlayer } from '@/components/player/MusicPlayer';
import { usePlayback } from '@/contexts/PlaybackContext';

jest.mock('@/contexts/PlaybackContext');
jest.mock('@/services/audio/PlaybackService', () => ({
  play: jest.fn(),
  pause: jest.fn(),
  skipToNext: jest.fn(),
  skipToPrevious: jest.fn(),
  seekTo: jest.fn(),
}));
jest.mock('@/services/audio/QueueService', () => ({
  toggleShuffle: jest.fn(),
  setRepeatMode: jest.fn(),
}));

const mockTrack = {
  id: '1',
  title: 'Test Track',
  artist: 'Test Artist',
  album: 'Test Album',
  url: 'http://test.mp3',
  duration: 180,
  artwork: 'http://artwork.jpg',
};

describe('MusicPlayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows empty state when no track', () => {
    (usePlayback as jest.Mock).mockReturnValue({
      currentTrack: null,
      position: 0,
      duration: 0,
      isPlaying: false,
      isLoading: false,
      queue: [],
      currentIndex: -1,
      shuffleEnabled: false,
      repeatMode: 'off',
    });

    const { getByText } = render(<MusicPlayer />);
    expect(getByText('No track playing')).toBeTruthy();
    expect(getByText('Select a track to start listening')).toBeTruthy();
  });

  it('renders track info when track loaded', () => {
    (usePlayback as jest.Mock).mockReturnValue({
      currentTrack: mockTrack,
      position: 30,
      duration: 180,
      isPlaying: true,
      isLoading: false,
      queue: [mockTrack],
      currentIndex: 0,
      shuffleEnabled: false,
      repeatMode: 'off',
    });

    const { getByText } = render(<MusicPlayer />);
    expect(getByText('Test Track')).toBeTruthy();
    expect(getByText('Test Artist')).toBeTruthy();
    expect(getByText('Test Album')).toBeTruthy();
  });

  it('renders track without album', () => {
    const trackNoAlbum = { ...mockTrack, album: undefined };
    (usePlayback as jest.Mock).mockReturnValue({
      currentTrack: trackNoAlbum,
      position: 60,
      duration: 180,
      isPlaying: false,
      isLoading: false,
      queue: [trackNoAlbum],
      currentIndex: 0,
      shuffleEnabled: true,
      repeatMode: 'all',
    });

    const { getByText, queryByText } = render(<MusicPlayer />);
    expect(getByText('Test Track')).toBeTruthy();
    expect(getByText('Test Artist')).toBeTruthy();
    expect(queryByText('Test Album')).toBeNull();
  });
});
