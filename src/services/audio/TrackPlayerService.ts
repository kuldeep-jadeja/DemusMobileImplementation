import TrackPlayer, { Capability } from 'react-native-track-player';

/**
 * Initialize react-native-track-player with required capabilities.
 * Safe to call multiple times (subsequent calls are no-ops).
 * 
 * Must be called before any other TrackPlayer methods.
 * Call in App.tsx root useEffect.
 */
export async function setupTrackPlayer(): Promise<void> {
  try {
    await TrackPlayer.setupPlayer({
      autoHandleInterruptions: true,  // Handle phone calls, alarms
    });

    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
      ],
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
    });

    console.log('TrackPlayer initialized successfully');
  } catch (error) {
    // setupPlayer() can only be called once
    // Subsequent calls throw — this is expected and safe to ignore
    if ((error as Error).message?.includes('already initialized')) {
      console.log('TrackPlayer already initialized');
    } else {
      console.error('TrackPlayer setup failed:', error);
      throw error;
    }
  }
}

/**
 * Reset TrackPlayer state (useful for testing).
 * Clears queue and stops playback.
 */
export async function resetTrackPlayer(): Promise<void> {
  try {
    await TrackPlayer.reset();
  } catch (error) {
    console.error('TrackPlayer reset failed:', error);
  }
}
