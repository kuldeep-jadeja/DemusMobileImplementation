# Architecture Patterns

**Domain:** React Native media player mobile app with Expo
**Researched:** 2024-2025
**Status:** PRD v1.2 locked PlaybackProvider interface and dual-auth contracts

## Recommended Architecture

### High-Level System Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     Demus Mobile App (Expo RN)                   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Navigation Layer                         │ │
│  │  (React Navigation: Auth Stack / Main Tabs / Modals)        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              ↓                                   │
│  ┌──────────────────────┬────────────────────┬──────────────────┐│
│  │ Playlist Screen      │ Now Playing Screen │ Profile Screen   ││
│  │ ├─ Library           │ ├─ Large Player    │ ├─ Logout        ││
│  │ ├─ Import URL input  │ ├─ Controls        │ └─ Session       ││
│  │ └─ Progress badge    │ ├─ Queue preview   │                  ││
│  │                      │ └─ Seek bar        │                  ││
│  └──────────────────────┴────────────────────┴──────────────────┘│
│                              ↓                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              State Management Layer (Zustand)              │  │
│  │  ├─ AuthStore (user, tokens, session state)               │   │
│  │  ├─ PlaybackStore (queue, position, current track)        │   │
│  │  ├─ ImportStore (importing, progress, error)              │   │
│  │  └─ UIStore (tab active, modals open, notifications)      │   │
│  └────────────────────────────────────────────────────────────┘   │
│                              ↓                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │         Server State Layer (TanStack Query)                │   │
│  │  ├─ Playlists cache (invalidates on import)               │   │
│  │  ├─ Playlist detail + track readiness cache                │   │
│  │  ├─ Import status polling (2-8s adaptive)                  │   │
│  │  └─ Stream lookup cache (tracks → YouTube URLs)           │   │
│  └────────────────────────────────────────────────────────────┘   │
│                              ↓                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │            Playback Engine Layer                           │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  PlaybackProvider Interface (abstract)              │  │   │
│  │  │  - play(track): Promise<void>                       │  │   │
│  │  │  - pause(): void                                    │  │   │
│  │  │  - seek(position): void                             │  │   │
│  │  │  - next(): void                                     │  │   │
│  │  │  - previous(): void                                 │  │   │
│  │  │  - setVolume(level): void                           │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  │                      ↓                                      │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  YouTubeProvider (Phase 1 decision point)            │  │   │
│  │  │  ├─ react-native-youtube-iframe (iframe path)       │  │   │
│  │  │  │  └─ Simpler, limited controls                    │  │   │
│  │  │  └─ WebView + custom YouTube player (WebView path)  │  │   │
│  │  │     └─ Complex, better UX control                   │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  │                      ↓                                      │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  Audio Core (expo-av)                               │  │   │
│  │  │  ├─ AVAudioEngine (iOS)                             │  │   │
│  │  │  └─ Android Audio Focus                            │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  │                      ↓                                      │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  Remote Controls (react-native-track-player)        │  │   │
│  │  │  ├─ iOS: MPRemoteCommandCenter + lock screen       │  │   │
│  │  │  ├─ Android: MediaSession + lock screen buttons    │  │   │
│  │  │  └─ Bluetooth: Standard media transport buttons    │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                              ↓                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │              API Client Layer (axios)                      │   │
│  │  ├─ Request interceptor (bearer token injection)          │   │
│  │  ├─ Response interceptor (401 → refresh flow)             │   │
│  │  └─ Error handler (map to named error codes)              │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
    ┌──────────────────────────────────────────────────────────┐
    │     Next.js Backend (existing, not modified)              │
    │  ├─ /api/auth/* (signup, login, refresh, logout)         │
    │  ├─ /api/import-playlist (async queue + webhooks)        │
    │  ├─ /api/playlists (list + detail)                       │
    │  ├─ /api/playlist/[id]/status (import progress)          │
    │  ├─ /api/stream/[trackId] (YouTube URL lookup)           │
    │  └─ MongoDB + Redis (match worker)                       │
    └──────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With | Rationale |
|-----------|---------------|-------------------|-----------|
| **Navigation Stack** | Authenticate user, route to auth/main screens | Auth Context, Main Tabs | Entry point; determines what user sees based on session. |
| **Auth Context (Zustand)** | User identity, access/refresh tokens, session TTL | Secure Store, API Client | Singleton auth state; all screens subscribe. |
| **Playlist Screen** | Display library, trigger import, show progress | TanStack Query, Zustand (import state), API client | Core feature; calls /api/playlists on mount, listens to import polling. |
| **Import Modal** | URL input, validation, trigger /api/import-playlist | API Client, TanStack Query | Separate modal to avoid cluttering playlist list. |
| **Now Playing Screen** | Display current track, controls, progress | Playback Engine, Remote Controls adapter, Zustand | Hub for playback interaction; reflects audio engine state. |
| **Playback Engine** | Abstract playback operations, queue management | PlaybackProvider, Audio Core (expo-av), Remote Controls | Core abstraction; allows YouTube provider swap later. |
| **PlaybackProvider Interface** | Concrete YouTube playback implementation | Audio Core, React Navigation (for modal presentation) | Pluggable; enables multi-provider in Phase 4+. |
| **Remote Controls Adapter** | Bridge between lock screen controls and playback engine | PlaybackProvider, react-native-track-player | Translates OS remote events to app actions. |
| **TanStack Query** | API request caching, retry, polling | API Client, Zustand (invalidation) | Server state: playlists, import status, track streams. |
| **API Client (axios)** | HTTP requests, bearer token injection, error mapping | Auth Context, Named error codes | Centralized API layer; handles dual-auth contract. |
| **Secure Store** | Refresh token persistence (encrypted) | Expo Secure Store native module | Only non-volatile storage; access token stays in memory. |

## Data Flow Patterns

### Auth Bootstrap on App Launch

```
App.tsx
  ├─ Check SecureStore for refresh token
  │  ├─ Found → Call /api/auth/refresh
  │  │   ├─ Success → Update AuthStore (access token, user)
  │  │   └─ Failure → Show login screen, clear store
  │  └─ Not found → Show login screen
  └─ Render Main Tabs or Auth Stack based on AuthStore.user
```

### Playlist Import with Progress Polling

```
ImportModal.tsx
  ├─ User enters Spotify URL
  │  └─ POST /api/import-playlist → returns playlistId, initializes worker
  ├─ TanStack Query (useQuery) subscribes to /api/playlist/[playlistId]/status
  │  ├─ Poll interval: 2s initially
  │  ├─ Backoff on failure: 2s, 4s, 8s (jitter ±20%)
  │  ├─ Stop on terminal state: ready, paused, error
  │  └─ Update UI with {totalTracks, matchedTracks, percentComplete}
  ├─ User can pause import (manual pause flag in backend)
  │  └─ Resume shows cooldown banner (MATCH_RESUME_COOLDOWN) if <5min since pause
  └─ Close modal on success or manual close
```

### Playback Initiation & Lock Screen Control

```
Now Playing Screen
  ├─ User taps track in playlist detail
  │  └─ PlaybackEngine.play(track)
  │     ├─ Fetch track URL from /api/stream/[trackId]
  │     ├─ Pass to YouTubeProvider (iframe or WebView)
  │     ├─ Notify react-native-track-player of now-playing (title, artist, artwork)
  │     ├─ Update Zustand PlaybackStore (queue, position, duration)
  │     └─ Render lock screen metadata (title, artwork)
  │
  └─ User locks device / background app
     └─ Audio continues via expo-av background mode
        ├─ Lock screen buttons (play, pause, next, prev) remain active
        ├─ Bluetooth speaker / headphones / car can control
        ├─ App resumption without re-login (token valid for 15 min)
        └─ On background resume, check if track still READY; if not, show unavailable
```

### Error Recovery with Named Codes

```
API call fails
  └─ Response: { ok: false, error: { code, message, retryable, correlationId } }
     ├─ AUTH_TOKEN_EXPIRED
     │  └─ Interceptor → Call refresh endpoint
     │     ├─ Success → Retry original request
     │     └─ Failure → Force relogin (controlled, not silent crash)
     ├─ IMPORT_INVALID_SPOTIFY_URL
     │  └─ Show error modal: "Invalid Spotify URL. Check and try again."
     │     └─ User can edit URL and retry
     ├─ PLAYBACK_SOURCE_UNAVAILABLE
     │  └─ Show inline banner: "Track not available. Skipping to next."
     │     └─ Trigger next() automatically
     └─ NETWORK_OFFLINE_RETRYABLE
        └─ Show offline banner; manual retry button
           └─ TanStack Query retry queue handles exponential backoff
```

## Patterns to Follow

### Pattern 1: State Colocation with Zustand

**What:** Use separate Zustand stores for auth, playback, import, UI rather than monolithic Redux.

**When:** Each domain (auth, playback, import, UI) has independent lifecycle and subscription patterns.

**Why:** Reduces boilerplate; teams can work on auth and playback stores independently.

**Example:**

```typescript
// stores/authStore.ts
export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  setUser: (user) => set({ user }),
  setTokens: (access, refresh) => set({ accessToken: access, refreshToken: refresh }),
  logout: () => set({ user: null, accessToken: null, refreshToken: null }),
}));

// stores/playbackStore.ts
export const usePlaybackStore = create((set) => ({
  queue: [],
  currentTrackIndex: 0,
  isPlaying: false,
  duration: 0,
  position: 0,
  setQueue: (queue) => set({ queue }),
  setPosition: (pos) => set({ position: pos }),
  // ... etc
}));
```

### Pattern 2: TanStack Query Polling with Manual Pause

**What:** Use `useQuery` with polling for import status; pause on user action.

**When:** Status needs real-time updates but can be paused by user.

**Why:** TQ handles retry, backoff, and cache invalidation; avoid manual setInterval/setTimeout.

**Example:**

```typescript
// hooks/useImportStatus.ts
export const useImportStatus = (playlistId) => {
  const [paused, setPaused] = useState(false);
  
  const query = useQuery({
    queryKey: ['importStatus', playlistId],
    queryFn: () => api.get(`/api/playlist/${playlistId}/status`),
    refetchInterval: paused ? false : 2000,
    refetchIntervalInBackground: true,
  });
  
  return { ...query, paused, setPaused };
};
```

### Pattern 3: Axios Interceptors for Token Refresh

**What:** Intercept 401 responses; silently refresh and retry request.

**When:** Access token expires during app use; avoid forcing user to relogin.

**Why:** Seamless UX; token refresh is transparent.

**Example:**

```typescript
// api/client.ts
const apiClient = axios.create({ baseURL: API_BASE });

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const { accessToken } = await refreshTokenFn();
        useAuthStore.setState({ accessToken });
        return apiClient.request(error.config); // Retry original request
      } catch {
        // Refresh failed; force relogin
        useAuthStore.setState({ user: null });
        // Navigate to auth stack
      }
    }
    return Promise.reject(error);
  }
);
```

### Pattern 4: PlaybackProvider Interface for Provider Flexibility

**What:** Abstract playback operations behind interface; concrete YouTube impl.

**When:** MVP uses YouTube; future phases support other providers (Spotify, SoundCloud).

**Why:** Decouples playback UI from provider implementation; enables future swaps.

**Example:**

```typescript
// types/playback.ts
export interface PlaybackProvider {
  play(track: Track): Promise<void>;
  pause(): void;
  seek(position: number): void;
  next(): void;
  previous(): void;
  setVolume(level: number): void;
  dispose(): void;
}

// providers/YouTubeProvider.ts
export class YouTubeProvider implements PlaybackProvider {
  constructor(private iframeRef: WebView) {}
  
  async play(track: Track) {
    // Fetch YouTube URL from /api/stream/[trackId]
    const url = await api.get(`/api/stream/${track.id}`);
    // Load in iframe or WebView
    this.iframeRef.injectJavaScript(`loadVideo("${url}")`);
  }
  
  // ... implement other methods
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Global Redux Store for All State

**What:** Single Redux root reducer with auth, playback, import, UI all at top level.

**Why bad:** Huge boilerplate (actions, reducers, selectors); teams stepping on each other's toes; hard to test.

**Instead:** Use Zustand stores per domain. Redux adds complexity without benefit here.

**When Redux is better:** Enterprise team (50+ devs) needing time-travel debugging, complex undo/redo. Not applicable to Demus MVP.

### Anti-Pattern 2: Manual setInterval for Polling

**What:** `useEffect(() => { setInterval(...) })` for import status.

**Why bad:** Hard to pause, clean up, handle backoff; memory leaks if cleanup forgotten.

**Instead:** TanStack Query `useQuery` with `refetchInterval` option.

### Anti-Pattern 3: Storing Access Token in AsyncStorage

**What:** Save access token to disk for persistence.

**Why bad:** Access token is short-lived (15 min TTL). Storage on disk is slower; unencrypted risk.

**Instead:** Keep access token in memory (Zustand store). Persist refresh token in expo-secure-store (encrypted). On app launch, use refresh token to get new access token.

### Anti-Pattern 4: Calling API Directly from Components

**What:** `PlaylistScreen.tsx` does `axios.get('/api/playlists')` in useEffect.

**Why bad:** No caching, retry, or deduplication. Multiple components trigger duplicate requests.

**Instead:** Wrap in `useQuery(...)` hook. TQ dedupes in-flight requests, caches results.

### Anti-Pattern 5: Mixing React Navigation and Custom Nav

**What:** Both React Navigation stack AND custom tab switching with useState.

**Why bad:** Inconsistent back button behavior, state not preserved during stack pops, hard to test.

**Instead:** Use React Navigation exclusively. Its stack and bottom-tabs are composable and handle all routing.

### Anti-Pattern 6: Catching Errors Silently

**What:** `try { ... } catch (e) { console.log(e); }` without user feedback.

**Why bad:** Users don't know what went wrong; can't take action (retry, relogin, etc.).

**Instead:** Map errors to named codes; show modal or toast with recovery action.

### Anti-Pattern 7: No Connection State Management

**What:** Assume network is always available; no offline detection.

**Why bad:** Playback fails silently during network loss; user confused.

**Instead:** Use React Native `NetInfo` library to detect connectivity. Show offline banner. Queue requests for retry.

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| **Auth token refresh load** | Backend: <1 req/sec on /api/auth/refresh | Backend: ~10 req/sec | Backend: ~100 req/sec; consider token server or cache layer |
| **Import status polling** | Backend: ~1 poll/sec (100 users, avg 1 import each) | Backend: ~10 polls/sec (adaptive backoff in MVP reduces this) | Backend: Consider webhook instead of polling; poll only during active import window |
| **Playlist caching** | Client: 100 playlists × ~100 tracks = 10K items (fits in memory) | Client: TanStack Query with LRU cache; paginate if >1000 tracks | Client: Implement incremental pagination for very large playlists |
| **Lock screen control latency** | Minimal; local device | Minimal; local device | Minimal; local device (not backend-dependent) |
| **Video streaming bandwidth** | YouTube handles CDN scaling | YouTube handles CDN scaling | YouTube handles CDN scaling (Demus is proxy, not media host) |
| **Database query load** | Minimal; mostly cache hits | Minimal; TQ dedupes in-flight requests | Consider read replica for status queries if bottleneck |
| **Error telemetry** | Local logging OK | Ship logs to Sentry for aggregation | Sentry dashboard essential for SLO tracking |

**Phase 3 scalability checkpoint:** After MVP launch, monitor TanStack Query cache hit rate, backend polling load, and token refresh spike during peak hours. Adjust polling intervals or implement server-side hints if needed.

## Sources

- **PRD v1.2:** Architecture lock, dual-auth contract, error envelope, PlaybackProvider interface
- **Expo documentation:** Navigation, Audio, Secure Store modules
- **React Navigation:** Stack + Tab composition patterns
- **TanStack Query:** Polling, retry, cache invalidation docs
- **Zustand:** Store composition and subscriptions patterns
- **react-native-track-player:** Integration with iOS MPRemoteCommandCenter, Android MediaSession
- **Community examples:** GitHub repos with Expo + TQ + Zustand setups (Notchmeister's react-native-audio-player, etc.)
