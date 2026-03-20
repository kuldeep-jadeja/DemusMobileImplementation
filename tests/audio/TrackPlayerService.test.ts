import { setupTrackPlayer, resetTrackPlayer } from '@/services/audio/TrackPlayerService';
import TrackPlayer, { Capability } from 'react-native-track-player';

// Mock react-native-track-player
jest.mock('react-native-track-player', () => ({
  setupPlayer: jest.fn().mockResolvedValue(undefined),
  updateOptions: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn().mockResolvedValue(undefined),
  Capability: {
    Play: 'play',
    Pause: 'pause',
    SkipToNext: 'next',
    SkipToPrevious: 'previous',
    SeekTo: 'seek',
  },
}));

describe('TrackPlayerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setupTrackPlayer', () => {
    it('initializes TrackPlayer with correct config', async () => {
      await setupTrackPlayer();

      expect(TrackPlayer.setupPlayer).toHaveBeenCalledWith({
        autoHandleInterruptions: true,
      });

      expect(TrackPlayer.updateOptions).toHaveBeenCalledWith({
        capabilities: expect.arrayContaining([
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SeekTo,
        ]),
        compactCapabilities: expect.any(Array),
        notificationCapabilities: expect.any(Array),
      });
    });

    it('handles already initialized error gracefully', async () => {
      (TrackPlayer.setupPlayer as jest.Mock).mockRejectedValueOnce(
        new Error('TrackPlayer is already initialized')
      );

      await expect(setupTrackPlayer()).resolves.not.toThrow();
    });

    it('throws on unexpected errors', async () => {
      (TrackPlayer.setupPlayer as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(setupTrackPlayer()).rejects.toThrow('Network error');
    });
  });

  describe('resetTrackPlayer', () => {
    it('calls TrackPlayer.reset', async () => {
      await resetTrackPlayer();
      expect(TrackPlayer.reset).toHaveBeenCalled();
    });

    it('handles reset errors gracefully', async () => {
      (TrackPlayer.reset as jest.Mock).mockRejectedValueOnce(
        new Error('Reset failed')
      );

      await expect(resetTrackPlayer()).resolves.not.toThrow();
    });
  });
});
