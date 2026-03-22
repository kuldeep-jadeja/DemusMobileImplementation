import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RecentlyPlayedItem, Track } from '@/types';

// Mock mode for Expo Go testing (set to false when backend is ready)
const MOCK_MODE = true;

type HomeContextType = {
  recentlyPlayed: RecentlyPlayedItem[];
  isLoading: boolean;
  refreshHistory: () => Promise<void>;
};

const HomeContext = createContext<HomeContextType | undefined>(undefined);

type HomeProviderProps = {
  children: ReactNode;
};

const STORAGE_KEY = '@demus:recentlyPlayed';
const MAX_HISTORY_ITEMS = 20;

/**
 * Generate mock recently played data for testing
 */
function generateMockHistory(): RecentlyPlayedItem[] {
  const now = Date.now();
  const mockTracks: Track[] = [
    {
      id: 't1-shape',
      url: 'https://www.youtube.com/watch?v=JGwWNGJdvx8',
      title: 'Shape of You',
      artist: 'Ed Sheeran',
      album: '÷ (Divide)',
      artwork: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
      duration: 233000,
    },
    {
      id: 't1-perfect',
      url: 'https://www.youtube.com/watch?v=2Vv-BfVoq4g',
      title: 'Perfect',
      artist: 'Ed Sheeran',
      album: '÷ (Divide)',
      artwork: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
      duration: 263000,
    },
    {
      id: 't1-thinking',
      url: 'https://www.youtube.com/watch?v=lp-EO5I60KA',
      title: 'Thinking Out Loud',
      artist: 'Ed Sheeran',
      album: 'x (Multiply)',
      artwork: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
      duration: 281000,
    },
    {
      id: 't2-castle',
      url: 'https://www.youtube.com/watch?v=K0ibBPhiaG0',
      title: 'Castle on the Hill',
      artist: 'Ed Sheeran',
      album: '÷ (Divide)',
      artwork: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
      duration: 261000,
    },
    {
      id: 't3-photograph',
      url: 'https://www.youtube.com/watch?v=nSDgHBxUbVQ',
      title: 'Photograph',
      artist: 'Ed Sheeran',
      album: 'x (Multiply)',
      artwork: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
      duration: 258000,
    },
  ];

  return mockTracks.map((track, index) => ({
    track,
    playedAt: new Date(now - index * 30 * 60 * 1000).toISOString(), // 30 min intervals
    playlistId: 'p1',
    playlistName: 'Top Hits 2024',
  }));
}

export function HomeProvider({ children }: HomeProviderProps) {
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load recently played tracks from AsyncStorage
   */
  const loadRecentlyPlayed = async () => {
    try {
      setIsLoading(true);

      if (MOCK_MODE) {
        // Generate mock data for Expo Go testing
        const mockData = generateMockHistory();
        setRecentlyPlayed(mockData);
        console.log('✅ [HomeContext] Loaded mock history:', mockData.length, 'items');
        return;
      }

      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate structure
        if (Array.isArray(parsed)) {
          setRecentlyPlayed(parsed);
          console.log('✅ [HomeContext] Loaded history:', parsed.length, 'items');
        } else {
          console.warn('⚠️ [HomeContext] Invalid history format, resetting');
          setRecentlyPlayed([]);
        }
      } else {
        console.log('ℹ️ [HomeContext] No history found');
        setRecentlyPlayed([]);
      }
    } catch (error) {
      console.error('❌ [HomeContext] Failed to load history:', error);
      setRecentlyPlayed([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh history from storage (can be called after new tracks are played)
   */
  const refreshHistory = async () => {
    await loadRecentlyPlayed();
  };

  // Load history on mount
  useEffect(() => {
    loadRecentlyPlayed();
  }, []);

  const value: HomeContextType = {
    recentlyPlayed,
    isLoading,
    refreshHistory,
  };

  return <HomeContext.Provider value={value}>{children}</HomeContext.Provider>;
}

/**
 * Hook to access home context
 */
export function useHome() {
  const context = useContext(HomeContext);
  if (!context) {
    throw new Error('useHome must be used within HomeProvider');
  }
  return context;
}
