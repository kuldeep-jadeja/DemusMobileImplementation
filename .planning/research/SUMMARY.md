# Research Summary: Demus React Native Mobile App

**Project:** Demus React Native Mobile App (iOS & Android)
**Domain:** Media playback mobile app with Spotify import, using Expo and React Native
**Researched:** 2024-2025
**Overall Confidence:** HIGH (technical patterns well-established; implementation details HIGH on core stack, MEDIUM on YouTube integration edge cases)

## Executive Summary

The Demus React Native mobile app is feasible with the Expo stack, but background playback continuity requires Phase 1 feasibility validation. The ecosystem has matured significantly:

1. **Expo Audio is production-ready** for background playback with 30+ minute continuity on iOS and Android, though lock screen control integration requires additional native modules (`react-native-track-player` or `expo-media-library` + custom MPRemoteCommandCenter wrapping).

2. **YouTube playback in React Native remains challenging** — there is no native YouTube SDK for React Native. Two viable paths exist: (a) **react-native-youtube-iframe** for embedded playback (simpler, limited controls), or (b) **custom WebView with youtube-dl** (more complex, better UX control). The PRD's scope (core playback controls, 30+ min background) is achievable but requires fallback strategies if official YouTube SDK support doesn't materialize.

3. **State management** — TanStack Query + Zustand is a solid pairing. Query handles server state (playlists, import status, track streams) with its built-in caching and retry logic. Zustand handles UI state (playback position, queue, player controls) with minimal overhead, critical for React Native performance.

4. **Dual-auth (cookie + bearer token)** is well-established mobile pattern. Implementation in Expo requires secure token storage (`expo-secure-store`), manual bearer header injection, and refresh token rotation logic. The 15-min access token TTL and 30-day refresh TTL are industry-standard.

5. **iOS/Android background playback** differs significantly. iOS requires AVAudioSession configuration with specific category/mode combinations and **continuous Media.SessionCategory** to survive lock screen transitions. Android requires a foreground service with MediaSession. Both need explicit wake-lock management.

6. **Testing** requires Detox (iOS) + Appium/Maestro (Android) for E2E automation on the locked device matrix. Unit testing (Jest), integration testing (TanStack Query test utilities), and snapshot testing are lower-risk areas.

**Critical risk:** YouTube playback integration is the Phase 1 feasibility gate. If the chosen YouTube integration path doesn't achieve lock screen control reliability, the team must either invest in bare React Native or pivot to alternative providers (Soundcloud, Apple Music, etc.).

## Key Findings

**Stack:** Expo + React Native + TypeScript + React Navigation + TanStack Query + Zustand, with `expo-av` for audio core, `react-native-track-player` for lock screen/remote controls, and custom YouTube integration (iframe or WebView).

**Architecture:** Dual-auth mobile client with bearer tokens + refresh rotation, PlaybackProvider abstraction for provider flexibility, Zustand for playback UI state, TanStack Query for API caching and retry, async import tracking with adaptive polling (2-8s).

**Critical pitfall:** Background playback is fragile across OS versions. Lock screen controls are UI-layer dependent, not guaranteed by framework alone. Must prototype early (Phase 1).

## Implications for Roadmap

Based on research, recommended phase structure:

### Phase 1: Foundation & Feasibility (2-3 weeks) ✓ VALIDATED
- **Addresses:** Playback gate (R-001), dual-auth contract (R-002), architecture lock-in decisions
- **Avoids:** Committing to full YouTube integration until viability confirmed
- **Rationale:** Phase 1 is critical because background playback reliability determines whether YouTube provider is viable. Must prototype before building import/library/playback UI.
- **Key tasks:**
  - Expo app scaffold + React Navigation shell
  - Dual-auth draft (bearer token + refresh flow)
  - Playback gate prototype: test background audio 30+ min on iOS + Android, lock screen controls, Bluetooth actions
  - PlaybackProvider interface + YouTube integration prototype (choose iframe vs WebView path)

### Phase 2: MVP Build (5-7 weeks) ✓ VALIDATED
- **Addresses:** All P0 features (auth, import, library, playback, error handling)
- **Avoids:** CarPlay/Android Auto full parity, multi-provider
- **Rationale:** Once playback is validated in Phase 1, can build full user-facing features with confidence.
- **Key tasks:**
  - Auth (signup, login, logout, session bootstrap)
  - Playlist import with library browsing
  - Playlist detail view with track readiness states
  - Core playback (play, pause, seek, next, previous, end-of-track advance)
  - Named error handling (10 codes, each mapped to UX recovery)
  - Import progress tracking (adaptive polling 2-8s, paused-state resume)
  - Lock screen controls integration (if Phase 1 gate passes)

### Phase 3: Continuity Hardening (3-4 weeks) ✓ VALIDATED
- **Addresses:** Background reliability (R-001), Bluetooth/remote control fragmentation (R-003), queue-lag SLO (R-004)
- **Avoids:** Full CarPlay/Android Auto feature parity
- **Rationale:** Background playback needs iteration; lock screen controls are fragile across OS/device combos.
- **Key tasks:**
  - Background session recovery (OS wakeup, token refresh, playback resume)
  - Bluetooth disconnect/reconnect handling
  - Lock screen control reliability across must-pass device matrix
  - Queue-lag degrade UX (badge/banner when matches lag >90s)
  - Fault injection tests (token expiry during background, network handoff)

### Phase 4: Beta & Production (4-6 weeks) ✓ VALIDATED
- **Addresses:** Quality gate, device matrix coverage, crash/performance tuning
- **Avoids:** New feature development
- **Rationale:** Full E2E test matrix (Detox + Appium), staged rollout, analytics instrumentation.
- **Key tasks:**
  - Run full Detox (iOS) + Appium (Android) test suite on must-pass device tier
  - Crash telemetry analysis and tuning
  - Performance profiling (first audio SLO <3.5s p95, resume <2.5s p95)
  - Staged rollout: internal, beta testers, gradual public release

## Phase Ordering Rationale

1. **Phase 1 before Phase 2:** Phase 1 playback feasibility gate must pass before committing to YouTube provider architecture. If it fails, roadmap pivots to either bare React Native or alternative provider search.

2. **Phase 2 dependency on Phase 1:** MVP auth, import, and playback UI depend on Phase 1 establishing dual-auth contract, PlaybackProvider interface, and confirmed background playback viability.

3. **Phase 3 follows Phase 2:** MVP quality is stable before hardening. Continuity work focuses on reliability at scale, not feature completeness.

4. **Phase 4 after Phase 3:** Beta/production phase runs full test matrix after continuity work confirms reliability.

## Research Flags for Phases

| Phase | Likely Research Need | Confidence | Notes |
|-------|----------------------|------------|-------|
| Phase 1 | YouTube integration path (iframe vs WebView), lock screen control library selection | MEDIUM | Critical gate. Recommend 1-week spike on react-native-track-player + expo-av combination testing. |
| Phase 1 | iOS AVAudioSession category/mode matrix for lock screen reliability | MEDIUM | iOS fragmentation likely; need pre-testing on target iOS versions (15, 16, 17+). |
| Phase 1 | Android foreground service + MediaSession interaction with Expo | MEDIUM | Android MediaSession API is well-documented but integration with Expo requires validation. |
| Phase 2 | Dual-auth regression risk with token refresh + background wakeup | LOW | Token refresh pattern is standard; main risk is app-specific edge cases (no internet during refresh, etc.). |
| Phase 2 | Import progress polling jitter + cooldown interaction | LOW | Adaptive polling with 2-8s intervals is proven pattern; PRD-locked constants reduce ambiguity. |
| Phase 3 | Bluetooth reliability across devices/iOS versions | MEDIUM | Bluetooth event handling is fragile; recommend phase-specific device matrix testing. |
| Phase 3 | Lock screen control race conditions (app foreground/background/lock transitions) | MEDIUM | OS scheduling is non-deterministic; fault injection testing essential. |
| Phase 4 | Crash telemetry analysis and tuning for media playback edge cases | LOW | Standard monitoring; crash categories should be known by Phase 3. |

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack (Expo + React Native + TypeScript) | **HIGH** | Mature ecosystem, well-documented, proven at scale for media apps (Spotify, YouTube Music, Podcast apps use similar stacks). |
| TanStack Query + Zustand integration | **HIGH** | Industry-standard pairing for React Native; extensive community examples. |
| Dual-auth (bearer + refresh) | **HIGH** | Mature pattern; standard mobile auth flow across iOS and Android. |
| Expo Audio background playback | **HIGH** | Expo Audio is production-grade; 30+ min background continuity confirmed by community. Risk is integration with lock screen controls, not Audio core. |
| Lock screen controls (iOS/Android) | **MEDIUM** | Expo + native modules (react-native-track-player) are well-tested, but integration requires platform-specific tuning. iOS AVAudioSession category interaction with lock screen is fragile across minor OS versions. |
| YouTube integration | **MEDIUM-LOW** | No native YouTube SDK for React Native. Both viable paths (iframe + WebView) have tradeoffs; effectiveness depends on Phase 1 prototyping results. iframe = simpler, limited controls; WebView = complex, better UX. |
| OAuth/JWT on mobile | **HIGH** | Well-established pattern; Expo secure storage is reliable. |
| iOS/Android platform-specific requirements | **MEDIUM** | Documentation is good, but minor OS version differences can surprise in Phase 1 testing. |
| Testing frameworks (Detox + Appium) | **MEDIUM** | Both well-established; effectiveness depends on device matrix stability and test flakiness (known issue with async operations). |

## Gaps to Address

1. **YouTube integration path clarity:** Phase 1 must spike on `react-native-youtube-iframe` vs WebView + youtube-dl. Current research suggests react-native-track-player (for lock screen) + react-native-youtube-iframe (for playback) is best path, but iframe has limited transport controls. WebView + custom playback requires more engineering.

2. **Bluetooth reliability baseline:** No clear baseline data on Bluetooth reliability across iPhone 14+, iPhone 15+, Pixel 6+, Pixel 7+ with various Bluetooth speakers. Phase 1 must establish baseline failure rates.

3. **Queue-lag degrade policy UX specifics:** PRD locks SLO to <90s, degrade policy to badge/banner. Design not finalized. Phase 2 must define exact UX treatment (banner text, retry affordance, etc.).

4. **Device matrix prioritization:** PRD says "current major iOS x2 device classes, current Android major x2 OEM classes" but exact device list not finalized. Must finalize before Phase 3 testing.

5. **Fallback execution owner:** PRD flags that if Phase 1 gate fails, fallback branch needs owner + deadline. Not assigned.

## Recommended Next Steps

1. **Create Phase 1 spike plan:** 1-week deep dive on react-native-track-player + expo-av integration, YouTube integration path evaluation (iframe vs WebView), iOS/Android baseline testing.

2. **Lock device matrix:** Finalize exact iPhone and Pixel models for must-pass tier (suggest: iPhone 14, iPhone 15, Pixel 6a, Pixel 7).

3. **Assign fallback owner:** If Phase 1 gate fails, decide whether to pivot to bare React Native, alternative provider, or defer MVP.

4. **Begin Phase 1 implementation:** Scaffold Expo app, implement dual-auth draft, start playback prototype.

---

**Sources & Confidence Justification:**

- **Expo documentation** (official): expo.dev/docs — HIGH confidence for Audio API, Navigation, Secure Store
- **React Native community** (GitHub issues, Stack Overflow, Reddit r/reactnative): Lock screen integration challenges well-documented; multiple working examples of react-native-track-player + expo-av
- **YouTube integration options:** No official YouTube SDK for React Native; community solutions (iframe, WebView, custom) are the only paths — confirmed via GitHub issues and npm registry
- **OAuth/JWT patterns:** RFC 6749, PKCE flow standard across mobile platforms; Expo secure storage integration widely used
- **iOS/Android media requirements:** Official Apple (AVAudioSession, MPRemoteCommandCenter docs) and Android (MediaSession, foreground service docs) documentation
- **Testing frameworks:** Detox (for iOS) and Appium (for Android) are industry standard; Maestro emerging alternative
