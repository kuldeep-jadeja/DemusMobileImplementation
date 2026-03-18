# Domain Pitfalls

**Domain:** React Native media playback mobile app with Expo
**Researched:** 2024-2025
**Critical Risk:** Background playback fragility is #1 pitfall; Phase 1 feasibility gate must validate.

## Critical Pitfalls

Mistakes that cause rewrites, shipping delays, or major reliability issues. Demus MVP cannot afford these.

### Pitfall 1: Background Playback Suspension on Lock / Background Transition

**What goes wrong:**
- Audio plays normally in foreground.
- User locks device or backgrounded app.
- Playback pauses unexpectedly.
- Resume to foreground doesn't auto-resume playback.
- User hears silence; assumes app is broken.

**Why it happens:**
- iOS: AVAudioSession category not set correctly (must be `.playback`), or mode set to `.spokenAudio` (wrong mode for music). Lock screen transition can downgrade session priority.
- Android: Foreground service not started or killed by system. MediaSession not properly advertised to system. Bluetooth audio focus lost.
- Both: App-level bugs in expo-av resume handling; background task doesn't restore playback state.

**Consequences:**
- Users abandon app (uninstall) due to perceived unreliability.
- Negative app store reviews: "Audio cuts out when I lock my phone."
- Engagement metric crashes; retention suffers in Phase 2+.
- Roadmap delays due to emergency hardening in Phase 3+.

**Prevention:**
1. **Phase 1 feasibility gate:** Dedicate 3-5 days to playback prototype on real devices (iPhone 14+, Pixel 6+). Test lock/unlock cycles, background/foreground, 30+ min continuous playback.
2. **AVAudioSession tuning (iOS):** Lock `.playback` category + `.default` mode + `duckOthers` option. DO NOT use `.spokenAudio`.
3. **Foreground service (Android):** Use `react-native-track-player` which handles MediaSession + foreground service automatically. Do NOT rely on Expo Audio alone for lock screen.
4. **Background task registration:** If using expo-background-fetch or expo-task-manager, ensure playback is resumed on wakeup.
5. **Comprehensive E2E test:** Detox + Appium test suite that runs lock/unlock cycles in Phase 3+ CI/CD.

**Detection:**
- Telemetry: Track background playback session duration; if median <5 min, investigate.
- Bug reports: "Audio stopped when I locked phone" in Sentry.
- Phase 1 test results: If any device shows <30 min continuous playback, investigate before Phase 2 starts.

**Mitigation timeline:**
- Phase 1: Prototype and validate (go/no-go gate).
- Phase 2: If gate passes, lock AVAudioSession + react-native-track-player config into code.
- Phase 3: Hardening phase; only this phase should iterate on edge cases.
- Phase 4: Full device matrix testing; validate no regressions.

---

### Pitfall 2: Lock Screen Controls Non-Deterministic Across iOS Versions

**What goes wrong:**
- Lock screen buttons (play, pause, next, prev) work on iPhone 14 / iOS 17.
- Same app on iPhone 14 / iOS 16 shows no buttons.
- User can't control playback from lock screen; must unlock to interact.
- Or: buttons appear but don't trigger actions reliably (race condition between OS event and app state).

**Why it happens:**
- iOS AVAudioSession priority and interruption handling changed between iOS 15, 16, 17.
- MPRemoteCommandCenter registration timing: must register BEFORE playback starts, not after.
- react-native-track-player version mismatch with iOS SDK in Expo.
- Remote event handlers not registered at module init time; get lost in background suspend/resume.

**Consequences:**
- Fragmented user experience; works for some, broken for others.
- Must-pass device matrix can't certify as "reliably shipping."
- Support burden: iOS version-specific bug reports.
- Deferred Phase 3 hardening work gets blocked.

**Prevention:**
1. **Pre-test on target OS versions:** iPhone 14 (iOS 17), iPhone 13 (iOS 16 if still in use), previous major version.
2. **Lock screen command registration in app root:** Register MPRemoteCommandCenter in App.tsx or playback engine init, not lazily on first play.
3. **Use react-native-track-player v3.x+:** Handles platform version differences; don't use v2 for Phase 1.
4. **Test fixture:** Detox test that starts playback, locks device, interacts with lock screen buttons. Run on each iOS version.
5. **Device matrix locked:** Phase 1 spike includes "iOS versions to support" decision (e.g., iOS 16+).

**Detection:**
- Phase 1 test results by device: Mark each combo (device, OS version, button type) as pass/fail.
- Sentry: Filter by OS version; if lock screen action rate differs by >10% between versions, investigate.
- User crash reports: "Remote command failed" or "Lock screen button didn't work."

---

### Pitfall 3: Token Refresh Loop During Background Resume

**What goes wrong:**
- User backgrounded app with valid session.
- 10 minutes pass; access token expires (15-min TTL locked by PRD).
- User returns to foreground; app needs to fetch playlists.
- Token refresh succeeds; new token stored.
- But playback engine tries to use old token in background without checking.
- Auth interceptor detects 401, retries refresh, refreshes again (loop).
- App appears to hang or crash.

**Why it happens:**
- Access token stored in multiple places (Zustand, axios headers, playback engine state).
- Background playback engine doesn't subscribe to AuthStore updates.
- Refresh logic not idempotent; concurrent refresh requests trigger multiple token updates.

**Consequences:**
- App hangs on resume after extended background.
- User force-quits app; session lost.
- Sentry logs: Repeated 401 errors and refresh attempts.
- Negative review: "App freezes when I come back to it."

**Prevention:**
1. **Single source of truth for tokens:** AuthStore (Zustand) is canonical. Axios interceptor reads from store, updates store.
2. **Playback engine subscribes to AuthStore:** If token refreshes, playback engine is notified; can update its internal headers.
3. **Refresh idempotency:** Only one refresh in-flight at a time. Use Promise-based queue or mutex.
4. **Separate access token (ephemeral) from refresh token (persistent):** Access token in memory, refresh token in secure storage only. On launch, use refresh to get new access token, never reuse old one from storage.
5. **Test fixture:** Simulate app going into background, time passing >15 min, foreground resume, and playlist fetch. Verify no infinite loop.

**Detection:**
- Telemetry: Track refresh attempt count per session. Alert if >3 refreshes in 1 minute.
- Sentry: "401 AuthTokenExpired" error rate by app session. If rate >1% during background resume, investigate.
- Phase 3 fault injection test: Mock time to expire token, background app, resume, verify graceful refresh.

---

### Pitfall 4: Bluetooth Event Race with App State Hydration

**What goes wrong:**
- Bluetooth headphones connected; playback in foreground.
- User backgrounded app.
- OS triggers Bluetooth play/pause event while app is still in resume.
- Event handler tries to access PlaybackStore (not yet hydrated from Zustand).
- Undefined error or silent ignore; button press ineffective.
- User presses button again; this time it works. Inconsistent UX.

**Why it happens:**
- Remote command handlers registered globally but don't wait for app state initialization.
- Zustand store not hydrated from storage/async yet when first remote event arrives.
- Race condition between Bluetooth event queue and React Native event loop.

**Consequences:**
- Bluetooth reliability below 95%; Phase 1 gate fails.
- Users resort to unlocking phone to play/pause; defeats lock screen purpose.
- Sentry: "Cannot read property 'isPlaying' of undefined" from Bluetooth handler.

**Prevention:**
1. **Hydrate auth + playback state on app launch:** Use useEffect at app root to initialize stores before rendering. Block playback screen until hydrated.
2. **Remote command handler resilience:** Wrap handlers in try/catch. If state not ready, queue event for retry in 100ms.
3. **Use react-native-track-player remote handlers:** They're designed to handle this; don't implement custom handlers.
4. **Test fixture:** Start app, wait for store hydration, then simulate Bluetooth event. Verify handler executes.
5. **Phase 1 prototype must test this:** Real Bluetooth speaker / headphones + lock/unlock cycles. Not just emulator.

**Detection:**
- Phase 1 test results: Mark "Bluetooth reliability" as pass/fail. Target >95%.
- Sentry: Filter by "Bluetooth" tags; track error rates.
- Telemetry: Track Bluetooth command success rate by device. Alert if <90%.

---

### Pitfall 5: Import Polling Overwhelms Backend on Reconnect Storm

**What goes wrong:**
- Multiple users' apps background at 9 AM (e.g., commute time).
- Network drops briefly (tunnel, elevator).
- All devices simultaneously reconnect; all have paused imports waiting to resume polling.
- All devices poll /api/playlist/[id]/status at the same time (thundering herd).
- Backend gets spike of 1000 requests in 1 second.
- Database connection pool exhausted; API times out.
- All users see error; import polling stops; users think imports are broken.

**Why it happens:**
- No jitter on poll resumption. All devices use same 2s base interval (PRD locked).
- No server-side rate limiting or request coalescing.
- Naive polling without exponential backoff on failure.

**Consequences:**
- Backend SLA breach; incident response required.
- Users' imports stuck in limbo; no way to resume.
- Roadmap delays due to emergency scaling work.

**Prevention:**
1. **Jitter on poll intervals (PRD locked):** ±20% jitter on 2-8s intervals ensures staggered requests.
2. **Exponential backoff:** On 429 (too many requests) or 5xx, back off: 2s, 4s, 8s. This is already in PRD.
3. **Server-side hints (optional post-MVP):** Backend can return `Retry-After` header; client respects it.
4. **Client coalescing (optional):** If multiple playlists being imported, combine into single /api/status endpoint call.
5. **Test fixture:** Simulate 100 devices simultaneously reconnecting after network loss. Verify backend handles spike.

**Detection:**
- Backend monitoring: Alert on /api/playlist/*/status request spike (>100 req/sec). Correlate with network events.
- Telemetry: Track import polling response time (p95, p99). Alert if >2s.
- Phase 2 load test: Simulate 10K users with 10% importing simultaneously; verify backend handles it.

---

## Moderate Pitfalls

Not catastrophic, but cause friction during Phase 2+ execution.

### Pitfall 1: YouTube URL Parsing Fails for Non-standard Formats

**What goes wrong:**
- User imports `https://youtu.be/abc123` (short URL).
- Backend YouTube parser expects `https://www.youtube.com/watch?v=abc123` (long URL).
- Import fails with IMPORT_INVALID_SPOTIFY_URL error (misleading code name).
- User confused; tries again; fails again.
- Uninstalls; leaves negative review.

**Why it happens:**
- YouTube video URL has multiple formats; naive regex matching misses some.
- Backend validation doesn't normalize URLs before checking.

**Prevention:**
1. **Backend URL normalization:** Use youtube-dl or similar to normalize any YouTube URL to canonical form.
2. **Clear error message:** If YouTube URL invalid, show "Invalid YouTube URL. Try full URL: youtu.be/abc123."
3. **Test fixture:** Phase 2 includes test for all common YouTube URL formats.

**Detection:**
- Telemetry: Track IMPORT_INVALID_SPOTIFY_URL error rate. Alert if >5% of imports.
- User feedback: "I couldn't import my playlist; got invalid URL error."

---

### Pitfall 2: TanStack Query Cache Invalidation Timing Bug

**What goes wrong:**
- User imports a playlist; backend starts matching.
- TQ polling status endpoint; cache updates every 2 seconds.
- User goes to Playlist detail view; old cached playlist detail shown (from before import).
- Tracks still show as UNAVAILABLE even though matching has progressed.
- User sees stale state; thinks import failed.

**Why it happens:**
- Playlist detail query not invalidated when import status updates.
- TQ cache key doesn't account for "import in progress" state.

**Prevention:**
1. **Invalidate related queries:** When import status changes, call `queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] })`.
2. **Use query dependencies:** Tag queries so invalidation cascades (e.g., playlist detail depends on import status).
3. **Test fixture:** Import a playlist; verify playlist detail view updates in real-time as matching progresses.

**Detection:**
- Phase 2 user testing: "I see stale tracks after importing."
- Telemetry: Track time from import start to first track matching in UI. If >10s, investigate.

---

### Pitfall 3: Zustand Store Not Persisted; Session Lost on App Restart

**What goes wrong:**
- User plays track; app stores position in Zustand PlaybackStore.
- App force-quit (crash or OS termination).
- User reopens app; playback position lost; restart from 0:00.
- User frustrated; had to start over.

**Why it happens:**
- PlaybackStore lives in memory only; not persisted to disk.
- On app restart, new Zustand instance initialized with default state.

**Prevention:**
1. **Persist to AsyncStorage (optional for Phase 2):** Wrap Zustand with localStorage plugin (or manual AsyncStorage for React Native).
2. **Phase 1 scope:** Don't persist playback state in MVP; OK to lose position. Users don't expect mobile to persist like Spotify does.
3. **Phase 3+ feature:** If user feedback demands it, add persist plugin.

**Detection:**
- User feedback: "I had to restart playback after app crashed."
- Phase 2 QA: Not required; defer to Phase 3+ if needed.

---

### Pitfall 4: Seek Bar Flickers Due to Position Update Frequency

**What goes wrong:**
- Seek bar (progress bar) updates on every playback position update.
- Position updates every 10ms (from audio engine).
- Component re-renders 100 times per second.
- Seek bar flickers; appears jerky.
- User experience feels laggy; app seems slow.

**Why it happens:**
- No throttling on position updates.
- Zustand subscribers re-render on every state change.

**Prevention:**
1. **Throttle position updates:** Update UI only every 100-500ms, not on every audio engine tick.
2. **Use `useShallow` selector:** Subscribe only to changed position, not entire PlaybackStore.
3. **Test fixture:** Render seek bar; visually verify smoothness at 60 FPS.

**Detection:**
- Phase 2 user testing: "Seek bar is jerky / stuttering."
- React DevTools Profiler: High render frequency on playback screen.

---

### Pitfall 5: No Fallback UI for Missing Track Artwork

**What goes wrong:**
- Playlist has 1000 tracks; YouTube URL lookup returns no artwork for track #500.
- Now Playing screen crashes trying to render `undefined` image.
- App crashes; user sees "app.demusmobile has stopped."
- Uninstall.

**Why it happens:**
- No null-check on artwork before rendering Image component.
- YouTube metadata lookup sometimes returns incomplete data.

**Prevention:**
1. **Always provide fallback artwork:** Use default album art placeholder if URL missing.
2. **Defensive coding:** `<Image source={artwork || require('./placeholder.png')} />`.
3. **Test fixture:** Phase 2 includes test for tracks with missing metadata.

**Detection:**
- Crash telemetry: "Cannot read property 'uri' of undefined" errors. Alert if >0.

---

## Minor Pitfalls

Annoying but not blocking.

### Pitfall 1: Typos in Error Code Names

**What goes wrong:**
- Backend returns error code `AUTH_INVALID_CREDENTAILS` (typo: CREDENTAILS instead of CREDENTIALS).
- Mobile client checks for `AUTH_INVALID_CREDENTIALS` (correct spelling).
- Mismatch; error not recognized; generic fallback shown.
- User sees confusing error message.

**Why it happens:**
- Error codes defined in PRD; implementation inconsistency.

**Prevention:**
1. **Shared enum:** Error codes in shared TypeScript enum or JSON file, used by both backend and mobile.
2. **Code generation:** Auto-generate mobile error types from backend OpenAPI spec.
3. **PR review:** Check error code spelling before merge.

---

### Pitfall 2: Import Progress Badge Overlaps Queue Controls

**What goes wrong:**
- Playlist detail view shows track list.
- While import in progress, badge shows "50% matched" in corner.
- Badge covers up "play" button for first track.
- User can't interact with track.

**Why it happens:**
- Layout not responsive; badge positioned absolutely without considering controls.

**Prevention:**
1. **Responsive layout:** Badge below track list or in header, not overlapping controls.
2. **Phase 2 design review:** Verify import badge placement doesn't cover controls.

---

### Pitfall 3: No Loading State During Auth Bootstrap

**What goes wrong:**
- App launches; checking refresh token in secure storage.
- Takes 200ms; user sees blank white screen.
- Looks like app hung; user thinks it's broken.

**Why it happens:**
- No loading indicator during async token check.

**Prevention:**
1. **Show splash screen:** Display during auth bootstrap (200-500ms typical).
2. **Splash screen timeout:** If bootstrap takes >2s, assume failure; show login screen.

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Severity | Mitigation |
|-------|-------|----------------|----------|-----------|
| **Phase 1** | Playback background | Suspension on lock/background (Pitfall 1, Critical) | CRITICAL | Prototype 3-5 days, test on real devices, lock AVAudioSession config |
| **Phase 1** | Lock screen controls | Non-deterministic across iOS versions (Pitfall 2, Critical) | CRITICAL | Test on iOS 15, 16, 17+; lock device matrix in PRD before Phase 2 |
| **Phase 1** | Bluetooth events | App state race (Pitfall 4, Critical) | CRITICAL | Implement event queue; test with real Bluetooth devices |
| **Phase 2** | Token refresh | Refresh loop during resume (Pitfall 3, Critical) | CRITICAL | Test fixture: background 15+ min, resume, fetch; verify no loop |
| **Phase 2** | Import polling | Reconnect storm (Pitfall 5, Moderate) | MEDIUM | Jitter on poll intervals (PRD locked); load test 100 concurrent reconnects |
| **Phase 2** | TanStack Query | Cache invalidation timing (Pitfall 2, Moderate) | MEDIUM | Invalidate playlist detail on import status change |
| **Phase 2** | Error handling | Missing error code names (Pitfall 1, Minor) | LOW | Use shared enum; code review |
| **Phase 3** | UI rendering | Seek bar flickers (Pitfall 4, Moderate) | MEDIUM | Throttle position updates; use memoization |
| **Phase 3** | Remote controls | Bluetooth reliability fragmentation (Pitfall 3, Moderate) | MEDIUM | Full device matrix E2E testing; phase gate |
| **Phase 4** | QA | Crash handling (Multiple, depends on earlier phases) | DEPENDS | Sentry telemetry; crash-free session target 98%+ |

---

## Recommended Research & Validation

1. **Phase 1 spike (1 week):** Dedicate team to playback prototype on real devices. Document:
   - iOS AVAudioSession config that works (category, mode, options).
   - Lock screen control registration timing.
   - Bluetooth event handling under race conditions.
   - YouTube integration path (iframe vs WebView) decision.

2. **Phase 2 integration tests:** Automated tests for:
   - Token refresh loop scenario (background 15+ min, resume).
   - Import polling under network loss + reconnect.
   - TanStack Query cache invalidation on import status change.

3. **Phase 3 E2E device matrix:** Run full Detox + Appium suite on locked device list.

4. **Phase 4 production monitoring:** Sentry crashes, backend polling load, token refresh spike.

---

## Sources

- **PRD v1.2:** Risk register (R-001 YouTube playback, R-002 Auth regressions, R-003 Bluetooth fragmentation, R-004 Import latency)
- **React Native community:** GitHub issues with background audio, lock screen controls, token refresh patterns
- **Expo documentation:** Audio, Background tasks, Navigation module docs
- **iOS/Android official docs:** AVAudioSession, MPRemoteCommandCenter, MediaSession, foreground services
- **Post-mortems:** App Store crash data, user reviews from competitors (Spotify, YouTube Music) highlight similar pitfalls
