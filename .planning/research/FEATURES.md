# Feature Landscape

**Domain:** React Native media player with Spotify playlist import
**Researched:** 2024-2025
**Status:** PRD v1.2 MVP locked; Phase structure informed by feature dependencies

## Table Stakes Features

Features users expect in a mobile music app. Missing = product feels incomplete or unsecure.

| Feature | Why Expected | Complexity | Status | Notes |
|---------|--------------|------------|--------|-------|
| Secure login / signup | Users won't enter credentials into unverified app | Low-Med | P0 (Phase 2) | Dual-auth contract locked; mobile session bootstrap required. |
| Persistent session | Don't ask to re-login on app restart | Low | P0 (Phase 2) | Refresh token in secure storage; auto-refresh on launch. |
| Playlist import from URL | Core value; Spotify playlists are standard share format | Med | P0 (Phase 2) | Backend import pipeline exists; mobile wraps /api/import-playlist. |
| View imported playlists | See what you imported | Low | P0 (Phase 2) | Call /api/playlists; list view with title, track count, art. |
| Play / pause | Core control | Low | P0 (Phase 2) | Bind to expose-av + remote controls. |
| Next / previous track | Basic queue navigation | Low | P0 (Phase 2) | Advance queue state; trigger playback update. |
| Lock screen controls | Resume playback without opening app | Med | P0 (Phase 2) | react-native-track-player integration; platform-specific (iOS MPRemoteCommandCenter, Android MediaSession). |
| Bluetooth transport controls | Control playback via headphones, car | Med | P0 (Phase 3) | Depends on Phase 1 feasibility gate. Lock screen / Bluetooth share integration path. |
| Background playback | Listen during other apps or locked screen | High | P0 (Phase 1 gate) | Expo Audio + background task configuration. **CRITICAL GATE.** |
| Progress tracking | Show how far into track you are | Low | P0 (Phase 2) | Seek bar with current position / duration binding. |
| Error messages | Understand what went wrong | Med | P0 (Phase 2) | Named error codes (10 locked by PRD); map each to UX recovery (retry, relogin, etc.). |

## Differentiators

Features that set Demus mobile apart. Not expected, but valued for engagement.

| Feature | Value Proposition | Complexity | Depends On | Status | Notes |
|---------|-------------------|-----------|-----------|--------|-------|
| Import progress tracking | See matching progress in real-time | Med | Import API + polling | P0 (Phase 2) | Adaptive polling 2-8s; paused-state resume with cooldown. |
| Paused import resume | Don't lose progress if import stalls | Med | Backend cooldown logic, mobile state | P0 (Phase 2) | Manual retry affordance when polling stops. |
| Queue-lag degrade banner | Transparency when matches lag >90s | Low | Import status + UI | P0 (Phase 2) | Badge/banner says "Matching in progress"; hides completion time uncertainty. |
| Synchronized queue across sessions | Resume on phone if started on web | High | Backend sync API | Post-MVP (deferred) | Would require additional backend endpoint. PRD defers to Phase 4+. |
| Offline mode | Listen to already-matched tracks without network | High | Local cache + playback handling | Post-MVP (deferred) | Requires client-side matched track cache. Out of MVP scope. |
| Playlist sharing | Share Demus queues with friends | High | Backend sharing API | Post-MVP (deferred) | Would require user accounts, share links. Future engagement lever. |
| Playlist search/filter | Find tracks in large imports | Low | Client-side text search | Post-MVP (deferred) | Low complexity but not MVP critical. Can add Phase 3+. |
| Playback history | See what you listened to | Med | Backend history API | Post-MVP (deferred) | Nice-to-have; requires additional backend telemetry. |

## Anti-Features

Features to explicitly NOT build. Saves time, reduces scope creep, sets expectations.

| Anti-Feature | Why Avoid | What to Do Instead | Notes |
|--------------|-----------|-------------------|-------|
| Full CarPlay / Android Auto integration | Complex platform APIs; fragmentation across car models | Implement baseline car transport controls (play/pause, seek buttons) | PRD explicitly limits to "baseline car controls" in MVP. Full integration deferred to Phase 4+. |
| Multi-provider playback (YouTube + Spotify + Apple Music) | YouTube integration alone requires Phase 1 gate. Multi-provider requires separate SDK integration per provider. | Focus on YouTube provider MVP; architect PlaybackProvider interface for future expansion | PRD locks MVP to YouTube only. RNTP can support multiple providers eventually, but YouTube is the gate. |
| Lyric display | Requires third-party lyric API (Genius, Spotify, etc.). Adds licensing complexity. | Future phase if user demand validates | Out of MVP scope. Keep for future engagement lever. |
| Audio equalizer / effects | Requires native audio DSP; fragmentation across iOS/Android | Rely on device-level EQ in Control Center / Android Settings | Users already have device EQ. Demus adds no value here. |
| Podcast playback | Different content type; requires separate ingestion pipeline | Stay music-focused for MVP | Playlists are curated music; podcasts are long-form. Different UX patterns. |
| Social features (follow users, playlists, comments) | Requires user profiles, messaging, moderation | Phase 4+ engagement lever | Out of MVP. Social adds complexity and requires backend redesign. |
| Download for offline playback | YouTube doesn't support DL; licensing complexity | Require continuous network | MVP is stream-only. PRD doesn't include offline scope. |
| Custom playback speed | Edge case control; not core use case | Start with normal speed only | Podcast/audiobook feature, not music. |

## Feature Dependencies

```
[App Launch]
  ↓
[Auth Bootstrap] ← expo-secure-store (refresh token)
  ├─ Success → [Main Tab Navigation]
  └─ Failure → [Login Screen]

[Main Tab Navigation]
  ├─ [Playlists Tab]
  │   ├─ [Playlist List] ← /api/playlists
  │   ├─ [Import URL Input]
  │   │   ↓
  │   │   [Trigger /api/import-playlist]
  │   │   ↓
  │   │   [Poll /api/playlist/[id]/status] (2-8s adaptive)
  │   │   ↓
  │   │   [Show progress badge, track readiness states]
  │   └─ [Playlist Detail]
  │       ├─ Tracks with readiness states (READY, PENDING, UNAVAILABLE)
  │       └─ → [Tap track to play]
  │
  └─ [Now Playing Tab]
      ├─ [Large player view with art]
      ├─ [Playback controls: play, pause, next, prev]
      ├─ [Progress bar + seek]
      ├─ [Lock screen controls] ← react-native-track-player
      └─ [Bluetooth transport] ← (Phase 3 hardening)

[Playback Engine]
  ├─ expo-av (audio core)
  ├─ react-native-track-player (lock screen, remote)
  └─ PlaybackProvider interface (YouTube impl)

[Error Handling]
  ├─ AUTH_INVALID_CREDENTIALS → [Relogin prompt]
  ├─ AUTH_TOKEN_EXPIRED → [Silent refresh, retry]
  ├─ AUTH_REFRESH_FAILED → [Controlled relogin]
  ├─ IMPORT_INVALID_SPOTIFY_URL → [Error banner + retry]
  ├─ IMPORT_QUEUE_UNAVAILABLE → [Retry with backoff]
  ├─ MATCH_RESUME_COOLDOWN → [Manual retry affordance]
  ├─ PLAYBACK_SOURCE_UNAVAILABLE → [Track unavailable banner]
  ├─ PLAYBACK_BACKGROUND_BLOCKED → [Native permission error]
  ├─ REMOTE_CONTROL_BIND_FAILED → [Graceful fallback to in-app controls]
  └─ NETWORK_OFFLINE_RETRYABLE → [Offline banner + retry]
```

## Feature Timeline & MVP Focus

### Phase 1 (2-3 weeks): Foundation & Gate
- **Deliverable:** Playback prototype that validates 30+ min background audio, lock screen controls, Bluetooth reliability
- **Not user-facing:** Auth framework draft, PlaybackProvider skeleton, no real playlist import

### Phase 2 (5-7 weeks): MVP Feature Build
- **All P0 table stakes:** Auth, import, playlists, playback controls, error handling
- **Key differentiator:** Import progress tracking with adaptive polling
- **Outcome:** App is usable end-to-end; not polished, but functional

### Phase 3 (3-4 weeks): Continuity Hardening
- **Not new features; reliability:** Background resumption, Bluetooth disconnect handling, race condition fixes
- **UX addition:** Queue-lag degrade banner (visual only, no new backend)

### Phase 4 (4-6 weeks): Beta & Production
- **Not new features; quality:** Full device matrix test, crash tuning, staged rollout
- **Analytics:** Track SLOs (first audio <3.5s p95, resume <2.5s p95)

## MVP Recommendation

### Must Include (P0)
1. **Auth flow** (signup, login, logout, session bootstrap, refresh token rotation)
2. **Playlist import from Spotify URL** with progress tracking
3. **Library view** (list of playlists with track count, art)
4. **Playlist detail** (tracks with readiness states)
5. **Core playback** (play, pause, seek, next, previous)
6. **Lock screen controls** (if Phase 1 gate passes)
7. **Background playback** (30+ min continuity)
8. **Error handling** (all 10 named codes mapped to UX recovery)
9. **Import progress tracking** (adaptive polling, paused-state resume)

### Defer (Post-MVP)
- Full CarPlay / Android Auto parity
- Multi-provider playback
- Offline mode
- Playlist sharing / user profiles
- Playback history
- Lyric display
- Advanced player controls (EQ, speed, etc.)

## Success Criteria

| Criterion | Target | Phase to Validate |
|-----------|--------|-------------------|
| Background playback continuity | 30+ min without interruption | Phase 1 (gate) |
| Lock screen control reliability | 95%+ success rate on must-pass device matrix | Phase 1 (gate) |
| Bluetooth action reliability | 95%+ success rate for play/pause/next/prev | Phase 3 (hardening) |
| Import success rate | 95%+ for valid Spotify URLs | Phase 2 (MVP) |
| p95 first audio latency | <3.5s on stable network | Phase 4 (tuning) |
| p95 resume latency | <2.5s after foreground | Phase 4 (tuning) |
| Named error recovery rate | 90%+ of users succeed on retry/relogin | Phase 3+ (hardening) |
| Queue-lag SLO | p95 lag <90s; 99% of imports within 5 min | Phase 2 (MVP build) |

## Competitive Landscape

| Competitor | Strength | Weakness | Demus Advantage |
|------------|----------|----------|-----------------|
| Spotify | Licensed playback, huge catalog, social | Closed API; can't import playlists from YouTube | Direct import from any Spotify URL |
| YouTube Music | YouTube integration, huge catalog, free tier | Mobile app is bloated; slow import | Lightweight, fast import, focused UX |
| Apple Music | Integrated with Apple ecosystem | Requires Apple ecosystem; expensive | Works on Android + iOS equally |
| SoundCloud | Artist-uploaded content, DJ mixes | Mobile app declining; discovery weak | Curated playlists from user's library |
| Podcast apps (Pocket Casts, Overcast) | Podcast-specific UX | Not music-focused | Demus focuses purely on music playlists |

**Demus differentiation:** Fast, focused import + playback. Not a social network, not an unlimited library. Is a personal playlist curator that respects user's existing collections (Spotify, YouTube).

## Sources

- **PRD v1.2:** Product requirements locked P0 and P1 features, error codes, performance SLOs
- **Market research:** Competitor app store reviews identify friction points (slow import, unclear progress, background reliability)
- **Backend API documentation:** Pages API, import pipeline, error envelope contracts
- **Community feedback:** User requests from earlier Demus web app (playlists, playback, offline, sharing rank highest)
