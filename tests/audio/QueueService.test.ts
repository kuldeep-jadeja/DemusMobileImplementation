import * as QueueService from '@/services/audio/QueueService';
import TrackPlayer from 'react-native-track-player';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock react-native-track-player
jest.mock('react-native-track-player', () => ({
  __esModule: true,
  default: {
    reset: jest.fn().mockResolvedValue(undefined),
    add: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
    skip: jest.fn().mockResolvedValue(undefined),
    play: jest.fn().mockResolvedValue(undefined),
    getCurrentTrack: jest.fn().mockResolvedValue(0),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn().mockResolvedValue(undefined),
    getItem: jest.fn().mockResolvedValue(null),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockTrack1 = { id: '1', title: 'Track 1', artist: 'Artist', url: 'http://1.mp3', duration: 180000 };
const mockTrack2 = { id: '2', title: 'Track 2', artist: 'Artist', url: 'http://2.mp3', duration: 200000 };
const mockTrack3 = { id: '3', title: 'Track 3', artist: 'Artist', url: 'http://3.mp3', duration: 220000 };

describe('QueueService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setQueue', () => {
    it('replaces queue and starts playing', async () => {
      await QueueService.setQueue([mockTrack1, mockTrack2]);

      expect(TrackPlayer.reset).toHaveBeenCalled();
      expect(TrackPlayer.add).toHaveBeenCalledWith([mockTrack1, mockTrack2]);
      expect(TrackPlayer.skip).toHaveBeenCalledWith(0);
      expect(TrackPlayer.play).toHaveBeenCalled();
    });

    it('saves queue to storage', async () => {
      await QueueService.setQueue([mockTrack1, mockTrack2]);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'playback_queue',
        expect.stringContaining('"tracks"')
      );
    });

    it('handles empty queue', async () => {
      await QueueService.setQueue([]);
      expect(TrackPlayer.reset).toHaveBeenCalled();
      expect(TrackPlayer.skip).not.toHaveBeenCalled();
      expect(TrackPlayer.play).not.toHaveBeenCalled();
    });
  });

  describe('addToQueue', () => {
    it('appends track to queue', async () => {
      await QueueService.setQueue([mockTrack1, mockTrack2]);
      jest.clearAllMocks();
      
      await QueueService.addToQueue(mockTrack3);
      expect(TrackPlayer.add).toHaveBeenCalledWith(mockTrack3);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('removeFromQueue', () => {
    it('removes track by index', async () => {
      await QueueService.setQueue([mockTrack1, mockTrack2, mockTrack3]);
      jest.clearAllMocks();

      await QueueService.removeFromQueue(1);
      expect(TrackPlayer.remove).toHaveBeenCalledWith(1);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('toggleShuffle', () => {
    it('shuffles queue on enable', async () => {
      (TrackPlayer.getCurrentTrack as jest.Mock).mockResolvedValue(0);
      
      await QueueService.setQueue([mockTrack1, mockTrack2, mockTrack3]);
      jest.clearAllMocks();
      
      await QueueService.toggleShuffle();

      const state = QueueService.getQueueState();
      expect(state.shuffleEnabled).toBe(true);
      expect(TrackPlayer.reset).toHaveBeenCalled();
      expect(TrackPlayer.add).toHaveBeenCalled();
    });

    it('restores original order on disable', async () => {
      (TrackPlayer.getCurrentTrack as jest.Mock).mockResolvedValue(0);

      await QueueService.setQueue([mockTrack1, mockTrack2, mockTrack3]);
      await QueueService.toggleShuffle(); // Enable
      jest.clearAllMocks();
      
      await QueueService.toggleShuffle(); // Disable

      const state = QueueService.getQueueState();
      expect(state.shuffleEnabled).toBe(false);
      expect(TrackPlayer.reset).toHaveBeenCalled();
    });
  });

  describe('setRepeatMode', () => {
    it('sets repeat mode and saves to storage', async () => {
      await QueueService.setRepeatMode('all');
      
      const state = QueueService.getQueueState();
      expect(state.repeatMode).toBe('all');
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('supports all repeat modes', async () => {
      await QueueService.setRepeatMode('off');
      expect(QueueService.getQueueState().repeatMode).toBe('off');

      await QueueService.setRepeatMode('all');
      expect(QueueService.getQueueState().repeatMode).toBe('all');

      await QueueService.setRepeatMode('one');
      expect(QueueService.getQueueState().repeatMode).toBe('one');
    });
  });

  describe('persistence', () => {
    it('saves queue to AsyncStorage', async () => {
      await QueueService.setQueue([mockTrack1, mockTrack2]);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'playback_queue',
        expect.stringContaining('"tracks"')
      );
    });

    it('loads queue from AsyncStorage', async () => {
      const storedState = {
        tracks: [mockTrack1, mockTrack2],
        currentIndex: 1,
        shuffleEnabled: false,
        repeatMode: 'off',
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(storedState));

      const loaded = await QueueService.loadQueueFromStorage();
      
      expect(loaded).toEqual(storedState);
      expect(TrackPlayer.add).toHaveBeenCalledWith([mockTrack1, mockTrack2]);
      expect(TrackPlayer.skip).toHaveBeenCalledWith(1);
    });

    it('returns null if no saved queue', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      const loaded = await QueueService.loadQueueFromStorage();
      expect(loaded).toBeNull();
    });

    it('handles corrupted storage gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('invalid json');
      const loaded = await QueueService.loadQueueFromStorage();
      expect(loaded).toBeNull();
    });
  });

  describe('clearQueue', () => {
    it('clears all queue state', async () => {
      await QueueService.setQueue([mockTrack1, mockTrack2]);
      jest.clearAllMocks();

      await QueueService.clearQueue();

      expect(TrackPlayer.reset).toHaveBeenCalled();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('playback_queue');
      
      const state = QueueService.getQueueState();
      expect(state.tracks).toEqual([]);
      expect(state.shuffleEnabled).toBe(false);
      expect(state.repeatMode).toBe('off');
    });
  });

  describe('getQueueState', () => {
    it('returns current queue state', () => {
      const state = QueueService.getQueueState();
      expect(state).toHaveProperty('tracks');
      expect(state).toHaveProperty('currentIndex');
      expect(state).toHaveProperty('shuffleEnabled');
      expect(state).toHaveProperty('repeatMode');
    });
  });
});
