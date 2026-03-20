import * as PlaybackService from '@/services/audio/PlaybackService';
import TrackPlayer from 'react-native-track-player';

// Mock react-native-track-player
jest.mock('react-native-track-player', () => ({
  __esModule: true,
  default: {
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
    skipToNext: jest.fn().mockResolvedValue(undefined),
    skipToPrevious: jest.fn().mockResolvedValue(undefined),
    seekTo: jest.fn().mockResolvedValue(undefined),
    getPosition: jest.fn().mockResolvedValue(0),
    getDuration: jest.fn().mockResolvedValue(0),
    getCurrentTrack: jest.fn().mockResolvedValue(null),
    getTrack: jest.fn().mockResolvedValue(null),
  },
}));

describe('PlaybackService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('play', () => {
    it('calls TrackPlayer.play', async () => {
      await PlaybackService.play();
      expect(TrackPlayer.play).toHaveBeenCalled();
    });

    it('throws on error', async () => {
      (TrackPlayer.play as jest.Mock).mockRejectedValueOnce(new Error('Playback error'));
      await expect(PlaybackService.play()).rejects.toThrow('Playback error');
    });
  });

  describe('pause', () => {
    it('calls TrackPlayer.pause', async () => {
      await PlaybackService.pause();
      expect(TrackPlayer.pause).toHaveBeenCalled();
    });

    it('throws on error', async () => {
      (TrackPlayer.pause as jest.Mock).mockRejectedValueOnce(new Error('Pause error'));
      await expect(PlaybackService.pause()).rejects.toThrow('Pause error');
    });
  });

  describe('skipToNext', () => {
    it('calls TrackPlayer.skipToNext', async () => {
      await PlaybackService.skipToNext();
      expect(TrackPlayer.skipToNext).toHaveBeenCalled();
    });

    it('handles end of queue gracefully', async () => {
      (TrackPlayer.skipToNext as jest.Mock).mockRejectedValueOnce(new Error('End of queue'));
      await expect(PlaybackService.skipToNext()).resolves.not.toThrow();
    });
  });

  describe('skipToPrevious', () => {
    it('seeks to 0 if >3 seconds into track', async () => {
      (TrackPlayer.getPosition as jest.Mock).mockResolvedValueOnce(5);
      await PlaybackService.skipToPrevious();
      expect(TrackPlayer.seekTo).toHaveBeenCalledWith(0);
    });

    it('skips to previous if <3 seconds into track', async () => {
      (TrackPlayer.getPosition as jest.Mock).mockResolvedValueOnce(2);
      await PlaybackService.skipToPrevious();
      expect(TrackPlayer.skipToPrevious).toHaveBeenCalled();
    });

    it('handles error gracefully', async () => {
      (TrackPlayer.getPosition as jest.Mock).mockRejectedValueOnce(new Error('Position error'));
      await expect(PlaybackService.skipToPrevious()).resolves.not.toThrow();
    });
  });

  describe('seekTo', () => {
    it('calls TrackPlayer.seekTo with position', async () => {
      await PlaybackService.seekTo(30);
      expect(TrackPlayer.seekTo).toHaveBeenCalledWith(30);
    });

    it('throws on error', async () => {
      (TrackPlayer.seekTo as jest.Mock).mockRejectedValueOnce(new Error('Seek error'));
      await expect(PlaybackService.seekTo(30)).rejects.toThrow('Seek error');
    });
  });

  describe('getCurrentTrack', () => {
    it('returns track if one is loaded', async () => {
      const mockTrack = { id: '1', title: 'Test', artist: 'Artist', url: 'http://test.mp3', duration: 180 };
      (TrackPlayer.getCurrentTrack as jest.Mock).mockResolvedValueOnce(0);
      (TrackPlayer.getTrack as jest.Mock).mockResolvedValueOnce(mockTrack);

      const track = await PlaybackService.getCurrentTrack();
      expect(track).toEqual(mockTrack);
    });

    it('returns null if no track loaded', async () => {
      (TrackPlayer.getCurrentTrack as jest.Mock).mockResolvedValueOnce(null);
      const track = await PlaybackService.getCurrentTrack();
      expect(track).toBeNull();
    });

    it('returns null on error', async () => {
      (TrackPlayer.getCurrentTrack as jest.Mock).mockRejectedValueOnce(new Error('Error'));
      const track = await PlaybackService.getCurrentTrack();
      expect(track).toBeNull();
    });
  });

  describe('getPosition', () => {
    it('returns current position', async () => {
      (TrackPlayer.getPosition as jest.Mock).mockResolvedValueOnce(45.5);
      const position = await PlaybackService.getPosition();
      expect(position).toBe(45.5);
    });

    it('returns 0 on error', async () => {
      (TrackPlayer.getPosition as jest.Mock).mockRejectedValueOnce(new Error('Error'));
      const position = await PlaybackService.getPosition();
      expect(position).toBe(0);
    });
  });

  describe('getDuration', () => {
    it('returns current duration', async () => {
      (TrackPlayer.getDuration as jest.Mock).mockResolvedValueOnce(180);
      const duration = await PlaybackService.getDuration();
      expect(duration).toBe(180);
    });

    it('returns 0 on error', async () => {
      (TrackPlayer.getDuration as jest.Mock).mockRejectedValueOnce(new Error('Error'));
      const duration = await PlaybackService.getDuration();
      expect(duration).toBe(0);
    });
  });
});
