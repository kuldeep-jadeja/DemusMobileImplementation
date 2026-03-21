/**
 * Integration tests for end-to-end playback flow.
 * Tests services + context working together.
 */
import TrackPlayer from 'react-native-track-player';
import * as PlaybackService from '@/services/audio/PlaybackService';
import * as QueueService from '@/services/audio/QueueService';
import { setupTrackPlayer } from '@/services/audio/TrackPlayerService';

const mockTrack1 = {
  id: '1',
  title: 'Track 1',
  artist: 'Artist 1',
  url: 'http://track1.mp3',
  duration: 180,
};

const mockTrack2 = {
  id: '2',
  title: 'Track 2',
  artist: 'Artist 2',
  url: 'http://track2.mp3',
  duration: 200,
};

const mockTrack3 = {
  id: '3',
  title: 'Track 3',
  artist: 'Artist 3',
  url: 'http://track3.mp3',
  duration: 220,
};

describe('Playback Flow Integration', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Setup TrackPlayer
    (TrackPlayer.setupPlayer as jest.Mock).mockResolvedValue(undefined);
    (TrackPlayer.updateOptions as jest.Mock).mockResolvedValue(undefined);
    await setupTrackPlayer();
  });

  describe('Basic Playback', () => {
    it('plays track after setting queue', async () => {
      (TrackPlayer.reset as jest.Mock).mockResolvedValue(undefined);
      (TrackPlayer.add as jest.Mock).mockResolvedValue(undefined);
      (TrackPlayer.skip as jest.Mock).mockResolvedValue(undefined);
      (TrackPlayer.play as jest.Mock).mockResolvedValue(undefined);

      // Set queue with tracks
      await QueueService.setQueue([mockTrack1, mockTrack2, mockTrack3]);

      // Verify queue operations
      expect(TrackPlayer.reset).toHaveBeenCalled();
      expect(TrackPlayer.add).toHaveBeenCalledWith([mockTrack1, mockTrack2, mockTrack3]);
      expect(TrackPlayer.skip).toHaveBeenCalledWith(0);
      expect(TrackPlayer.play).toHaveBeenCalled();
    });

    it('skips to next track', async () => {
      (TrackPlayer.skipToNext as jest.Mock).mockResolvedValue(undefined);

      await PlaybackService.skipToNext();

      expect(TrackPlayer.skipToNext).toHaveBeenCalled();
    });

    it('pauses playback', async () => {
      (TrackPlayer.pause as jest.Mock).mockResolvedValue(undefined);

      await PlaybackService.pause();

      expect(TrackPlayer.pause).toHaveBeenCalled();
    });
  });

  describe('Queue Management', () => {
    it('clears entire queue', async () => {
      (TrackPlayer.reset as jest.Mock).mockResolvedValue(undefined);

      await QueueService.clearQueue();

      expect(TrackPlayer.reset).toHaveBeenCalled();
    });

    it('returns current queue state', async () => {
      (TrackPlayer.reset as jest.Mock).mockResolvedValue(undefined);
      (TrackPlayer.add as jest.Mock).mockResolvedValue(undefined);
      (TrackPlayer.skip as jest.Mock).mockResolvedValue(undefined);
      (TrackPlayer.play as jest.Mock).mockResolvedValue(undefined);
      await QueueService.setQueue([mockTrack1, mockTrack2]);

      const state = QueueService.getQueueState();

      expect(state.tracks).toHaveLength(2);
      expect(state.shuffleEnabled).toBe(false);
      expect(state.repeatMode).toBe('off');
    });
  });
});
