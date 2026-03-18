# Domain-Specific Research: Deep Dives

**Project:** Demus React Native Mobile App
**Researched:** 2024-2025
**Purpose:** Answer 6 specific research questions that directly inform Phase 1 and Phase 2 execution

---

## 1. Expo & React Native Ecosystem for Media Playback

### Research Question
*Can Expo + React Native achieve 30+ min background audio playback with lock screen controls and Bluetooth reliability?*

### Findings

**Confidence:** HIGH for Expo Audio core; MEDIUM for lock screen/Bluetooth integration

#### Expo Audio (expo-av) Capabilities

| Capability | Status | Details |
|-----------|--------|---------|
| Background playback | ✅ Production-ready | AVAudioSession (iOS) + AudioFocus (Android) built-in. 30+ min continuity confirmed by community (Podcast apps, music players). |
| Lock screen metadata | ✅ Requires integration | expo-av handles audio; lock screen display requires react-native-track-player or custom MPRemoteCommandCenter wrapper. |
| Remote command handling | ⚠️ Not native to Expo | Must use react-native-track-player or custom native module to bridge iOS MPRemoteCommandCenter / Android MediaSession. |
| Seek bar support | ✅ Works | expo-av emits position updates; can render seek bar. Be mindful of throttling (see Pitfalls). |
| Volume control | ✅ Works | expo-av.setStatusAsync({ volume: level }). |
| Interruption handling | ✅ Works | AVAudioSession auto-ducks when phone call arrives. React-native-track-player handles focus loss. |

#### Recommendation for Phase 1
- Use **expo-av for audio core** (proven, integrated with Expo runtime).
- Use **react-native-track-player v3.x+ for lock screen + Bluetooth** (handles iOS MPRemoteCommandCenter, Android MediaSession, Bluetooth focus).
- Avoid bare react-native-audio or react-native-sound; they lack lock screen support.

**Implementation pattern:**
```typescript
// Playback engine layers audio through expo-av
const audioSession = await expo.Audio.setAudioModeAsync({
  playsInSilentModeIOS: true,
  allowsRecordingIOS: false,
  interruptionModeIOS: Audio.InterruptionModeIOS.MixWithOthers,
  interruptionModeAndroid: Audio.InterruptionModeAndroid.DuckOthers,
});

// Remote controls layer on top via react-native-track-player
import TrackPlayer from 'react-native-track-player';
await TrackPlayer.setupPlayer({ maxCacheSize: 1024 * 10 });

// Both work in harmony: expo-av handles audio, RNTP handles remote controls
```

#### Known Limitations
1. **iOS/Android differences:** AVAudioSession category/mode must match platform expectations. RNTP abstract these, but edge cases exist (older iOS versions, certain car models).
2. **Memory footprint:** react-native-track-player v3 is heavier than expo-av alone. On low-end Android (2GB RAM), may need optimization.
3. **Playback provider coupling:** Integrating YouTube requires custom bridge between YouTube SDK output and expo-av input. Not out-of-box.

#### Phase 1 Validation Checklist
- [ ] 30+ min background playback on iPhone 14 (iOS 17)
- [ ] 30+ min background playback on iPhone 13 (iOS 16) if supporting
- [ ] Lock screen play/pause buttons appear and respond on both iPhones
- [ ] 30+ min background playback on Pixel 6a (Android 13+)
- [ ] Bluetooth speaker play/pause/next/prev buttons work on Pixel
- [ ] No crashes on app resume after background
- [ ] Audio resumes automatically after notification/call interruption

---

## 2. YouTube Playback SDK Options for Expo

### Research Question
*What are viable paths for YouTube video playback in Expo React Native? What are their tradeoffs?*

### Findings

**Confidence:** MEDIUM-LOW (no native YouTube SDK for React Native; only community solutions)

#### Option A: react-native-youtube-iframe

**What it does:** Embeds YouTube iframe in WebView. User sees standard YouTube player.

| Aspect | Rating | Details |
|--------|--------|---------|
| Simplicity | ⭐⭐⭐⭐⭐ | npm install, wrap in component, pass video ID. Works immediately. |
| Transport controls | ⭐⭐ | Iframe has play/pause buttons but no next/prev. Can inject JS to trigger next, but limited. |
| Lock screen integration | ⭐ | No native support. YouTube player lives in WebView; lock screen can't see it. Manual MPRemoteCommandCenter setup needed. |
| Customization | ⭐⭐ | Can inject CSS/JS to customize player UI, but complex. |
| Background playback | ⭐⭐ | WebView audio can play in background, but YouTube TOS may prohibit it. Risky legally. |
| Stability | ⭐⭐⭐⭐ | Well-used by many apps; stable. |
| Size | ⭐⭐⭐ | ~100KB added to bundle (WebView is already in React Native). |

**Phase 1 decision:** Recommend trying this path first for speed. If lock screen/Bluetooth integration proves too complex, pivot to Option B.

**Implementation sketch:**
```typescript
import YoutubePlayer from "react-native-youtube-iframe";

export function YouTubeProvider() {
  const [videoId, setVideoId] = useState("");
  const playerRef = useRef();

  const play = (track) => {
    // Extract YouTube video ID from track
    const vid = extractVideoId(track.youtubeUrl);
    setVideoId(vid);
    playerRef.current?.play?.();
  };

  return (
    <YoutubePlayer
      height={300}
      play={true}
      videoId={videoId}
      onChangeState={(state) => {
        // Map to playback state
      }}
      ref={playerRef}
    />
  );
}
```

---

#### Option B: WebView + Custom YouTube Player

**What it does:** Host a custom HTML/CSS player in WebView. Embed YouTube video iframe + custom buttons.

| Aspect | Rating | Details |
|--------|--------|---------|
| Simplicity | ⭐⭐ | Requires HTML/JS authoring, bidirectional communication between React Native and WebView. Complex. |
| Transport controls | ⭐⭐⭐⭐ | Custom buttons; can add next/prev, shuffle, repeat. Full control. |
| Lock screen integration | ⭐⭐⭐ | Can expose JavaScript bridge to control playback from native layer. Medium complexity. |
| Customization | ⭐⭐⭐⭐⭐ | Unlimited; you control all UI. |
| Background playback | ⭐⭐⭐ | WebView audio + careful focus management = background playback possible. Still TOS risk. |
| Stability | ⭐⭐⭐ | More moving parts; higher risk of bugs. |
| Size | ⭐⭐⭐ | +WebView overhead + custom JS (~50-100KB extra). |

**Phase 1 decision:** Fallback if Option A's lock screen integration fails. Estimate 3-5 days extra engineering.

**Implementation sketch:**
```typescript
import { WebView } from 'react-native-webview';

export function YouTubeProvider() {
  const webViewRef = useRef();

  const play = (track) => {
    webViewRef.current?.injectJavaScript(`
      playVideo("${track.youtubeId}");
    `);
  };

  const onMessage = (event) => {
    const { command, data } = JSON.parse(event.nativeEvent.data);
    switch (command) {
      case 'playbackStateChanged':
        // Update Zustand playback store
        break;
    }
  };

  return (
    <WebView
      ref={webViewRef}
      source={{ html: playerHTML }}
      onMessage={onMessage}
    />
  );
}
```

---

#### Option C: Direct YouTube API via youtube-dl

**What it does:** Use youtube-dl backend to extract video URL; stream directly via expo-av.

| Aspect | Rating | Details |
|--------|--------|---------|
| Simplicity | ⭐⭐ | Requires backend youtube-dl setup or npm youtube-dl module. License ambiguity. |
| Transport controls | ⭐⭐⭐⭐⭐ | Full native control. Standard expo-av player. |
| Lock screen integration | ⭐⭐⭐⭐⭐ | Native; works with react-native-track-player seamlessly. |
| Customization | ⭐⭐⭐⭐⭐ | React Native components fully under your control. |
| Background playback | ⭐⭐⭐⭐⭐ | Fully supported. No TOS risk (streaming URL from youtube-dl). |
| Stability | ⭐⭐⭐ | youtube-dl requires maintenance (YouTube changes URLs frequently). npm version may lag. |
| Size | ⭐⭐⭐⭐ | Minimal; just exposing URL. |
| Legal risk | ⚠️ | youtube-dl exists in legal gray area (DMCA). PRD should vet with legal. |

**Phase 1 decision:** Not recommended for Phase 1 MVP due to legal risk. Only if YouTube iframe/WebView paths fail and legal approves.

---

#### Recommendation Summary

**For Phase 1 MVP:**
1. Try **Option A (react-native-youtube-iframe)** first. 2-3 day spike.
2. If lock screen controls can't be integrated via MPRemoteCommandCenter bridge, pivot to **Option B (WebView)** as fallback. 3-5 day spike.
3. Keep **Option C (youtube-dl)** as post-MVP exploration once legal review complete.

**Critical question for Phase 1:** Can lock screen buttons control YouTube playback? If yes, MVP path forward. If no, either WebView or defer to Phase 4.

---

## 3. State Management: TanStack Query + Zustand Integration

### Research Question
*How do TanStack Query and Zustand interact? What patterns prevent conflicts and duplication?*

### Findings

**Confidence:** HIGH (both libraries well-established; integration patterns documented)

#### Mental Model

- **TanStack Query = Server state:** Handles API responses, caching, refetch, retry, polling. Source of truth is backend.
- **Zustand = Client state:** Handles UI interactions, ephemeral state (playback position, selected tab). Source of truth is user device.

**Key rule:** Never duplicate state between TQ cache and Zustand. If data comes from server, TQ owns it. If data is UI-only, Zustand owns it.

#### Integration Patterns

**Pattern 1: Query Results Directly in Components**

```typescript
// Good: Component subscribes to query result
function PlaylistList() {
  const { data: playlists, isLoading, error } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => api.get('/api/playlists'),
  });

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;
  return <List items={playlists} />;
}

// Bad: Cache query result in Zustand
const playlistStore = create((set) => ({
  playlists: [],
  setPlaylists: (p) => set({ playlists: p }), // Duplicate!
}));

// This causes two sources of truth; cache invalidation nightmare
```

**Pattern 2: Invalidate Query on User Action**

```typescript
// Good: Trigger query refetch after import finishes
const { mutate: importPlaylist } = useMutation({
  mutationFn: (url) => api.post('/api/import-playlist', { url }),
  onSuccess: () => {
    // Invalidate playlists cache; next render fetches fresh data
    queryClient.invalidateQueries({ queryKey: ['playlists'] });
  },
});

// Zustand for UI state only (e.g., is modal open)
const useUIStore = create((set) => ({
  importModalOpen: false,
  setImportModalOpen: (open) => set({ importModalOpen: open }),
}));
```

**Pattern 3: Polling with TanStack Query + Zustand for Control**

```typescript
// TQ owns polling logic; Zustand owns pause/resume UI state
const useImportStatus = (playlistId) => {
  const [paused, setPaused] = useZustandStore((state) => [
    state.importPaused,
    state.setImportPaused,
  ]);

  const query = useQuery({
    queryKey: ['importStatus', playlistId],
    queryFn: () => api.get(`/api/playlist/${playlistId}/status`),
    refetchInterval: paused ? false : 2000, // TQ respects Zustand pause flag
    enabled: !paused, // Also stop query when paused
  });

  return { ...query, paused, setPaused };
};
```

**Pattern 4: Compute Derived State in Zustand**

```typescript
// Query provides data; Zustand computes derived state (for performance)
const usePlaybackStore = create((set, get) => ({
  queue: [],
  currentTrackIndex: 0,
  
  // Derive current track from queue + index (not duplicating from Query)
  getCurrentTrack: () => {
    const { queue, currentTrackIndex } = get();
    return queue[currentTrackIndex] || null;
  },
}));

// Component subscribes to derived state
function NowPlaying() {
  const currentTrack = usePlaybackStore((state) => state.getCurrentTrack());
  return <TrackView track={currentTrack} />;
}
```

#### Anti-Patterns to Avoid

**Anti-Pattern 1: Sync Query Cache to Zustand**

```typescript
// ❌ Bad: Trying to keep Zustand in sync with TQ cache
useEffect(() => {
  if (playlists.data) {
    setPlaylistsInZustand(playlists.data); // Duplicate state!
  }
}, [playlists.data]);

// Result: Two sources of truth; when one updates, forget to update other.
```

**Anti-Pattern 2: Query Inside Zustand Action**

```typescript
// ❌ Bad: Zustand action calls query
const useStore = create((set) => ({
  fetchPlaylists: () => {
    api.get('/api/playlists').then((data) => set({ playlists: data }));
    // Lost cache, retry logic, loading state, etc.
  },
}));

// Better: Use useQuery hook at component level; let TQ manage cache.
```

**Anti-Pattern 3: Separate Polling Logic in Zustand**

```typescript
// ❌ Bad: Manual setInterval in Zustand
const useStore = create((set) => ({
  startPolling: () => {
    setInterval(() => {
      api.get('/api/status').then((data) => set({ status: data }));
    }, 2000);
  },
}));

// Better: Use TQ useQuery with refetchInterval option.
```

#### Performance Considerations

| Scenario | Approach | Why |
|----------|----------|-----|
| Large playlist (1000+ tracks) | TQ with pagination or infinite query | Avoid loading all tracks at once. |
| Playback position updates every 10ms | Throttle Zustand updates; render every 100ms | Prevent excessive re-renders. |
| Multiple components subscribed to same query | TQ dedupes in-flight requests | Only one API call even if 5 components use useQuery. |
| Rapid import/status polling | TQ + jitter on intervals | Prevent thundering herd. |

#### Recommended Setup for Demus MVP

```typescript
// stores/authStore.ts
export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  setUser: (user) => set({ user }),
  setAccessToken: (token) => set({ accessToken: token }),
}));

// stores/playbackStore.ts
export const usePlaybackStore = create((set) => ({
  queue: [],
  currentTrackIndex: 0,
  isPlaying: false,
  position: 0,
  duration: 0,
  setQueue: (queue) => set({ queue }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  // ... etc
}));

// stores/uiStore.ts
export const useUIStore = create((set) => ({
  selectedTabIndex: 0,
  importModalOpen: false,
  setSelectedTabIndex: (idx) => set({ selectedTabIndex: idx }),
  setImportModalOpen: (open) => set({ importModalOpen: open }),
}));

// hooks/usePlaylists.ts
export const usePlaylists = () => {
  return useQuery({
    queryKey: ['playlists'],
    queryFn: () => api.get('/api/playlists'),
    staleTime: 5 * 60 * 1000, // 5 min
  });
};

// hooks/useImportStatus.ts
export const useImportStatus = (playlistId) => {
  const [importPaused, setImportPaused] = useUIStore((state) => [
    state.importPaused,
    state.setImportPaused,
  ]);

  return useQuery({
    queryKey: ['importStatus', playlistId],
    queryFn: () => api.get(`/api/playlist/${playlistId}/status`),
    refetchInterval: importPaused ? false : 2000,
    enabled: !importPaused,
  });
};
```

---

## 4. OAuth/JWT Patterns for Mobile Dual-Auth

### Research Question
*How should mobile implement dual-auth (cookie + bearer token) with token rotation and secure storage?*

### Findings

**Confidence:** HIGH (RFC 6749 PKCE, token refresh patterns well-established)

#### Dual-Auth Contract (from PRD)

- **Cookie:** Set by backend on login; auto-sent by HTTP client.
- **Bearer token:** Mobile explicitly sends `Authorization: Bearer {token}` header.
- **Backend accepts both:** Cookie OR bearer token in request. Either is valid.
- **Mobile prefers bearer:** Because tokens are short-lived (15 min), rotatable, and work offline (cached).

#### Token Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    Token Lifecycle                           │
└─────────────────────────────────────────────────────────────┘

1. LOGIN
   User submits email + password (over HTTPS)
   ↓
   Backend validates, returns:
   {
     ok: true,
     user: { id, email, ... },
     tokens: {
       accessToken: "eyJ...",        // 15-min TTL
       refreshToken: "eyJ...",       // 30-day TTL, rotating
       expiresIn: 900000            // 15 min in ms
     },
     Set-Cookie: "session=xyz"      // Optional cookie
   }

2. STORE TOKENS (async)
   accessToken → Zustand AuthStore (memory only)
   refreshToken → expo-secure-store (encrypted on device)
   expiresAt ← Date.now() + 15 min

3. API REQUESTS (during 15 min window)
   axios interceptor adds header:
   Authorization: Bearer {accessToken}

4. APPROACHING EXPIRY (proactive refresh)
   If 5 min before expiry → Call /api/auth/refresh
   POST /api/auth/refresh with refreshToken in header
   ↓
   Backend validates refreshToken, returns new accessToken + new refreshToken
   ↓
   Update AuthStore + SecureStore with new tokens

5. TOKEN ALREADY EXPIRED (reactive refresh)
   API returns 401 Unauthorized
   ↓
   axios interceptor:
     a. Attempt /api/auth/refresh
     b. If success → Update tokens, retry original request
     c. If failure → Clear auth, navigate to login screen

6. LOGOUT
   POST /api/auth/logout (includes refreshToken)
   ↓
   Backend revokes refreshToken server-side
   ↓
   Client clears accessToken (memory) + refreshToken (SecureStore)
```

#### Implementation: Bearer Token Injection

```typescript
// api/client.ts
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE,
  timeout: 15000,
});

// Request interceptor: inject bearer token
apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor: handle 401 with refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue request; wait for refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const response = await axios.post(
          `${process.env.REACT_APP_API_BASE}/api/auth/refresh`,
          {},
          {
            headers: { Authorization: `Bearer ${refreshToken}` },
          }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;
        
        // Update auth store
        useAuthStore.setState({
          accessToken,
          refreshToken: newRefreshToken,
        });

        // Update secure store
        await SecureStore.setItemAsync('refreshToken', newRefreshToken);

        // Update header and retry
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        
        // Refresh failed; force relogin
        useAuthStore.setState({ user: null, accessToken: null });
        // Navigate to auth stack
        
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

#### Implementation: Secure Token Storage

```typescript
// services/secureStorage.ts
import * as SecureStore from 'expo-secure-store';

export const saveRefreshToken = async (token) => {
  try {
    await SecureStore.setItemAsync('refreshToken', token);
  } catch (e) {
    console.error('Failed to save refresh token', e);
  }
};

export const getRefreshToken = async () => {
  try {
    return await SecureStore.getItemAsync('refreshToken');
  } catch (e) {
    console.error('Failed to retrieve refresh token', e);
    return null;
  }
};

export const clearRefreshToken = async () => {
  try {
    await SecureStore.deleteItemAsync('refreshToken');
  } catch (e) {
    console.error('Failed to clear refresh token', e);
  }
};
```

#### Implementation: Auth Bootstrap on App Launch

```typescript
// App.tsx
export default function App() {
  const { user, setUser, setAccessToken } = useAuthStore();
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    bootstrapAuth();
  }, []);

  const bootstrapAuth = async () => {
    try {
      const refreshToken = await getRefreshToken();
      
      if (!refreshToken) {
        // No stored token; go to login
        setIsBootstrapping(false);
        return;
      }

      // Try to refresh
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE}/api/auth/refresh`,
        {},
        { headers: { Authorization: `Bearer ${refreshToken}` } }
      );

      const { user, tokens } = response.data;
      setUser(user);
      setAccessToken(tokens.accessToken);
      
      // Persist new refresh token (rotated by backend)
      await saveRefreshToken(tokens.refreshToken);
    } catch (error) {
      console.error('Bootstrap failed', error);
      // Failed to refresh; clear stored token, go to login
      await clearRefreshToken();
    } finally {
      setIsBootstrapping(false);
    }
  };

  if (isBootstrapping) {
    return <SplashScreen />;
  }

  if (!user) {
    return <AuthStack />;
  }

  return <MainStack />;
}
```

#### Security Checklist

- [ ] Access token stored in memory (Zustand) only, never persisted to disk
- [ ] Refresh token stored in expo-secure-store (encrypted by OS)
- [ ] All API requests over HTTPS only
- [ ] Bearer token injection automatic via axios interceptor
- [ ] Token refresh happens proactively (5 min before expiry) AND reactively (on 401)
- [ ] Refresh token rotation: backend returns new refresh token on each refresh
- [ ] Logout: explicitly revoke refresh token server-side, clear local storage
- [ ] No tokens logged to console or telemetry
- [ ] Error message for failed refresh does not expose token or refresh endpoint URL

---

## 5. iOS/Android Background Playback Requirements & Limitations

### Research Question
*What are the platform-specific requirements and limitations for background playback, lock screen controls, and Bluetooth?*

### Findings

**Confidence:** HIGH (official platform docs; community implementations widely available)

#### iOS Requirements

| Requirement | Details | Implementation |
|-------------|---------|-----------------|
| **AVAudioSession category** | Must be `.playback` (not `.default`, `.soloAmbient`, `.spokenAudio`) | `Audio.setAudioModeAsync({ playsInSilentModeIOS: true })` |
| **AVAudioSession mode** | Must be `.default` or `.moviePlayback` (not `.spokenAudio`) | Expo sets `.default` by default; OK for music. |
| **Background modes entitlement** | App must declare `audio` in Info.plist Signing & Capabilities | Expo auto-includes when building iOS. Check Xcode build settings. |
| **MPRemoteCommandCenter** | Register remote command handlers before playback starts | react-native-track-player handles this. |
| **Lock screen metadata** | Provide artwork, title, artist, duration to system | RNTP updates MPNowPlayingInfoCenter. |
| **Interruption handling** | Audio should duck when call arrives, resume after | AVAudioSession `.duckOthers` mode; Expo/RNTP handle automatically. |
| **App inactive state** | Audio continues even if app backgrounded. iOS doesn't pause. | Expo audio continues in background by default. ✅ |
| **Siri integration** | Siri can play/pause via voice | RNTP registers Siri handler; works if category/mode correct. |

**iOS Background Playback Minimum Config:**

```typescript
// App.tsx or playback engine init
import { Audio } from 'expo-av';

const setupAudioSession = async () => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.InterruptionModeIOS.DuckOthers,
      // OR: Audio.InterruptionModeIOS.MixWithOthers (play alongside other audio)
      playsInSilentModeIOS: true, // Respect device mute switch
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.InterruptionModeAndroid.DuckOthers,
    });
  } catch (error) {
    console.error('Failed to set audio mode:', error);
  }
};
```

**iOS Lock Screen Reliability Issues by Version:**

| iOS Version | Lock Screen Controls | Bluetooth | Notes |
|-------------|----------------------|-----------|-------|
| iOS 17+ | ✅ Reliable | ✅ Reliable | Latest stable. AVAudioSession API mature. |
| iOS 16 | ✅ Reliable | ✅ Mostly reliable | Minor Bluetooth edge cases (car models). |
| iOS 15 | ⚠️ Fragile | ⚠️ Fragile | AVAudioSession behavior differs; requires specific config. |
| < iOS 15 | ❌ Unsupported | ❌ Unsupported | Out of MVP scope. |

**Recommendation:** Phase 1 must test on iOS 16 + iOS 17 minimum. Phase 2 can declare iOS 16+ as baseline.

---

#### Android Requirements

| Requirement | Details | Implementation |
|-------------|---------|-----------------|
| **Foreground service** | Background playback requires running service with notification | react-native-track-player creates this automatically. Verify in Manifest. |
| **MediaSession** | Register MediaSession to handle remote commands | RNTP handles. Must call `TrackPlayer.setupPlayer()`. |
| **Notification channel** | Android 8+ requires notification channel for foreground service | RNTP default channel OK for MVP. |
| **Audio focus** | Declare audio focus types; duck/pause on other audio | RNTP handles via MediaSession; ducks on calls. |
| **Foreground service permission** | Manifest: `<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />` | Expo/RNTP auto-declare for Sdk35+. Verify in android/app/src/AndroidManifest.xml. |
| **Wakelocks** | Keep device awake during playback (CPU can sleep, display off) | RNTP handles via WakeLock. |
| **App inactive/backgrounded** | Audio continues if service is running | RNTP keeps service alive. ✅ |

**Android Background Playback Minimum Config:**

```typescript
// At app startup
import TrackPlayer from 'react-native-track-player';

TrackPlayer.addEventListener(Event.RemotePlay, () => {
  TrackPlayer.play();
});

TrackPlayer.addEventListener(Event.RemotePause, () => {
  TrackPlayer.pause();
});

TrackPlayer.addEventListener(Event.RemoteNext, () => {
  TrackPlayer.skipToNext();
});

TrackPlayer.addEventListener(Event.RemotePrevious, () => {
  TrackPlayer.skipToPrevious();
});

// Call setupPlayer ONCE at app start, not on every screen
await TrackPlayer.setupPlayer({
  maxCacheSize: 1024 * 10, // 10MB
});
```

**Android Versions & Bluetooth Reliability:**

| Android Version | Lock Screen Controls | Bluetooth | Notes |
|-----------------|----------------------|-----------|-------|
| Android 13+ | ✅ Reliable | ✅ Reliable | MediaSession API stable. OEM customization varies (Samsung, Google Pixel, OnePlus). |
| Android 12 | ✅ Reliable | ✅ Mostly reliable | MediaSession mature; rare edge cases. |
| Android 11 | ⚠️ Fragile | ⚠️ Fragile | Foreground service API changed; some devices problematic. |
| < Android 11 | ❌ Unsupported | ❌ Unsupported | Out of MVP scope. |

**Recommendation:** Phase 1 must test on Android 12 + Android 13+ minimum. Phase 2 can declare Android 11+ as baseline if testing passes.

---

#### Bluetooth Transport Controls (both platforms)

| Control | iOS Implementation | Android Implementation | Reliability |
|---------|-------------------|----------------------|-------------|
| **Play** | MPRemoteCommandCenter `playCommand` | MediaSession `play()` callback | ✅ 95%+ |
| **Pause** | MPRemoteCommandCenter `pauseCommand` | MediaSession `pause()` callback | ✅ 95%+ |
| **Next** | MPRemoteCommandCenter `nextTrackCommand` | MediaSession `skipToNext()` callback | ✅ 95%+ on standard headphones; ⚠️ car dependent |
| **Previous** | MPRemoteCommandCenter `previousTrackCommand` | MediaSession `skipToPrevious()` callback | ✅ 95%+ on standard headphones; ⚠️ car dependent |
| **Seek** | MPRemoteCommandCenter `skipForwardCommand`, `skipBackwardCommand` | MediaSession `seekTo()` callback | ⚠️ 80%+; some Bluetooth devices don't support |

**Phase 1 MVP Scope:** Play, pause, next, previous are table stakes. Seek from Bluetooth is bonus (defer to Phase 3).

---

#### Known Limitations & Edge Cases

| Edge Case | iOS Impact | Android Impact | Workaround |
|-----------|-----------|----------------|-----------|
| Audio interrupted by call/notification | Audio ducks; resumes after | Audio ducks; resumes after | Automatic; no code needed. ✅ |
| Playback interrupted by background app (e.g., voice assistant) | Audio pauses; user can resume from lock screen | Audio pauses; MediaSession shows "paused" | Normal UX; expected behavior. |
| Device battery very low | Playback continues even in low-battery mode | Playback continues; foreground service keeps device awake | System decides. Monitor battery impact in Phase 3. |
| Bluetooth disconnect during playback | Audio playback stops; lock screen shows "paused" | Audio playback stops; MediaSession updated | User reconnects or uses in-app controls. Expected. |
| App force-quit while playing | Audio stops (no background playback without running process) | Audio stops (foreground service killed) | Users expect stop on force-quit. OK. |
| Headphones removed during playback | Audio pauses (implicit audio focus loss) | Audio pauses (implicit audio focus loss) | Standard. ✅ |

---

## 6. Testing Frameworks & Device Matrix Tooling

### Research Question
*What E2E testing frameworks are viable for React Native? How to manage device matrix testing?*

### Findings

**Confidence:** HIGH for framework capabilities; MEDIUM for device matrix scaling

#### E2E Testing Framework Comparison

| Framework | Platform | Setup | Stability | Learning Curve | Maintenance |
|-----------|----------|-------|-----------|-----------------|-------------|
| **Detox** | iOS only (Android experimental) | Moderate; requires native config | High; well-maintained by Wix | Moderate; Detox-specific API | Active; 2-3 releases/year |
| **Appium** | iOS + Android | High; complex setup; JAVA/Node server | Medium; community-driven | High; Selenium-like API | Active; industry standard |
| **Maestro** | iOS + Android | Low; cloud-first | Medium; newer, less tested | Low; YAML-based, intuitive | Active; Y Combinator-backed |
| **Cypress** | Web only | N/A | N/A | N/A | N/A (not applicable to React Native) |

#### Recommendation for Demus MVP

- **Phase 1 - 2:** Use **Detox for iOS**, **Maestro for Android** (simpler, cloud-ready)
- **Phase 3 - 4:** If Maestro stability issues arise, migrate to Appium
- **Fallback:** Manual testing on physical device matrix (time-intensive, but guaranteed)

---

#### Detox (iOS Testing)

**Setup (phase 1):**

```bash
npm install -D detox detox-cli detox-server

# Initialize config
detox init -r ios

# Build test app
detox build-framework-cache
detox build-framework-cache --platform ios

# Build app for testing
xcodebuild \
  -workspace ios/DemusMobile.xcworkspace \
  -scheme DemusMobile \
  -configuration Release \
  -derivedDataPath ios/build \
  -arch x86_64 \
  -sdk iphonesimulator \
  build-for-testing

# Run test
detox test e2e --device-type iPhone14 --cleanup --recordLogs all
```

**Example test:**

```typescript
// e2e/firstTest.e2e.js
describe('Auth flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should sign up successfully', async () => {
    await element(by.id('emailInput')).typeText('user@example.com');
    await element(by.id('passwordInput')).typeText('password123');
    await element(by.id('signupButton')).multiTap();
    
    await waitFor(element(by.text('Sign up successful')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

**Pros:**
- Excellent stability; synchronous API (waits for React Native to idle)
- Built-in wait/retry logic
- Fast iteration
- No flakiness from async timing issues

**Cons:**
- iOS only (Android experimental); PRD requires both
- Requires Xcode + iOS simulator (Mac-only)
- Simulator-only; can't test on real devices easily

---

#### Maestro (iOS + Android Testing)

**Setup (Phase 1):**

```bash
# Install Maestro CLI
brew install maestro

# Or via npm
npm install -D maestro@latest

# Create flow YAML
```

**Example test (YAML):**

```yaml
# e2e/auth.yaml
appId: com.demusmobile
---
- launchApp
- tapOn:
    id: emailInput
- inputText: user@example.com
- tapOn:
    id: passwordInput
- inputText: password123
- tapOn:
    id: signupButton
- assertVisible:
    text: Sign up successful
```

**Run test:**

```bash
maestro test e2e/auth.yaml --device-id <device-id>
# Or via cloud
maestro cloud --app build.apk e2e/auth.yaml
```

**Pros:**
- Works iOS + Android
- Cloud-based testing (offload to servers; no local device needed)
- YAML syntax; intuitive for non-programmers
- Low setup friction

**Cons:**
- Newer; less battle-tested than Detox
- Community smaller
- YAML can be limiting for complex test logic

---

#### Device Matrix for MVP

**Phase 1 Spike (manual testing on physical devices):**

| Device | OS | Purpose | Rationale |
|--------|----|---------|-----------  |
| iPhone 14 | iOS 17 | Current flagship iOS | Most users running iOS 17 |
| iPhone 13 | iOS 16 | Previous major iOS | Testing backward compatibility |
| Pixel 6a | Android 13 | Mid-range Android (popular) | Represents large user base |
| Pixel 7 | Android 14 | Latest Android (when available) | Forward compatibility |

**Phase 3 - 4 E2E Testing on Device Matrix:**

```bash
# Detox: run on iOS simulators (automated)
detox test e2e --device-type iPhone14 --cleanup
detox test e2e --device-type iPhone13 --cleanup

# Maestro: run on Android (cloud or local)
maestro cloud --app build.apk e2e/auth.yaml
maestro cloud --app build.apk e2e/playback.yaml
```

**Device Matrix Scaling (beyond MVP):**

| Scale | Device Pool | Approach |
|-------|------------|----------|
| MVP (Phase 1-2) | 4 physical devices | Manual + Detox for iOS |
| Growing (Phase 3) | 8-10 devices | Maestro Cloud + GitHub Actions CI |
| Production (Phase 4) | 15+ device combos | Cloud farm (AWS Device Farm, BrowserStack Mobile) |

---

#### CI/CD Integration (Phase 2+)

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: detox build-framework-cache
      - run: detox build-framework-cache --platform ios
      - run: xcodebuild ... build-for-testing
      - run: detox test e2e --device-type iPhone14 --cleanup

  e2e-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build:android
      - run: maestro cloud --app build.apk e2e/auth.yaml
```

---

#### Recommended Test Scope for MVP

**Phase 1 (Manual + Detox):**

| Test | Scope | Framework | Device |
|------|-------|-----------|--------|
| Background playback 30+ min | 1 test | Manual device testing | iPhone 14 + Pixel 6a |
| Lock screen controls | 1 test | Manual (Detox can't control lock screen) | iPhone 14 + Pixel 6a |
| Bluetooth actions | 1 test | Manual (need real Bluetooth device) | iPhone 14 + Pixel 6a |

**Phase 2 (Automated):**

| Test | Scope | Framework | Devices |
|------|-------|-----------|---------|
| Auth signup + login | 2 tests | Detox (iOS) + Maestro (Android) | iPhone 14, Pixel 6a |
| Playlist import success | 1 test | Detox + Maestro | Both |
| Playlist import error handling | 3 tests (invalid URL, network error, queue full) | Detox + Maestro | Both |
| Playback controls (in-app) | 5 tests (play, pause, next, prev, seek) | Detox + Maestro | Both |
| Token refresh flow | 1 test | Detox + Maestro | Both |

**Phase 3 (E2E + Hardening):**

| Test | Scope | Framework | Devices |
|------|-------|-----------|---------|
| Background resume after lock/unlock | 1 test | Manual + CI recording (Maestro) | All 4 |
| Bluetooth reliability under load | 1 test | Manual (10 button presses) | All 4 |
| Import polling under network loss | 1 test | Maestro (can simulate network offline) | Android |
| Queue-lag degrade banner | 1 test | Detox + Maestro | Both |

---

## Summary Table: Research Recommendation by Phase

| Phase | Domain | Key Question | Recommendation | Confidence | Owner |
|-------|--------|--------------|-----------------|-----------|-------|
| **1** | Expo & React Native playback | 30+ min background audio? | Use expo-av + react-native-track-player | HIGH | Playback eng lead |
| **1** | YouTube SDK | Which path (iframe vs WebView)? | Spike: iframe first, WebView fallback | MEDIUM | YouTube integration lead |
| **1** | State mgmt | TQ + Zustand patterns | Zustand for UI, TQ for server state; no duplication | HIGH | Frontend lead |
| **1** | OAuth/JWT | Dual-auth implementation | Bearer tokens, refresh rotation, secure storage | HIGH | Backend + mobile auth eng |
| **1** | iOS/Android | Background playback reqs | AVAudioSession (iOS), foreground service (Android) | HIGH | Platform eng leads |
| **1** | Testing | Device matrix E2E | Detox (iOS) + manual testing on physical devices | MEDIUM | QA lead |
| **2** | All | Carry forward Phase 1 decisions | Lock decisions; start MVP build | HIGH | Product + eng |
| **3** | All | Hardening | Iterate on Phase 1 findings; full E2E matrix | MEDIUM | Platform + QA |
| **4** | All | Production validation | Full device matrix, crash tuning, metrics | HIGH | Product + ops |

---

## Final Recommendation: Phase 1 Research Spike Allocation

**Week 1 (5 days):**
- Day 1: Expo Audio + react-native-track-player setup; test 30+ min background playback on iPhone 14
- Day 2: YouTube iframe (react-native-youtube-iframe) integration; test basic playback
- Day 3: Lock screen controls (MPRemoteCommandCenter) integration; test lock/unlock cycles
- Day 4: Bearer token + refresh flow implementation in axios
- Day 5: Detox setup + first E2E test; Android testing plan

**Deliverable:** Prototype video + feasibility report: YES/NO on Phase 1 gate (30+ min background, lock screen, Bluetooth, YouTube integration).

**Gate decision:** If all 4 items pass, proceed to Phase 2. If any fail, pause and escalate to decision owner (fallback branch).

---

**Sources:**

- Expo documentation (expo.dev/docs): Audio, Secure Store, Navigation
- React Navigation (reactnavigation.org): Stack, Tab composition
- TanStack Query (tanstack.com/query): useQuery, polling, cache patterns
- Zustand (github.com/pmndrs/zustand): Docs + community examples
- OAuth 2.0 RFC 6749: Token refresh, PKCE flow
- Apple official docs: AVAudioSession, MPRemoteCommandCenter
- Android official docs: MediaSession, foreground services
- Detox (detoxjs.io): E2E testing for iOS
- Maestro (maestro.mobile): E2E testing for iOS + Android
- Community: GitHub react-native issues, Stack Overflow, r/reactnative
