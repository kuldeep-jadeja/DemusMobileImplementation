# Technology Stack

**Project:** Demus React Native Mobile App
**Researched:** 2024-2025
**Status:** Locked by PRD v1.2; recommendations for Phase 1 validation

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Expo** | 51.x+ | App build, development, and deployment framework | Expo allows rapid iteration without native code compilation; includes Audio, Navigation, Secure Store modules. SDK51+ stable for background playback. |
| **React Native** | 0.74.x+ | Cross-platform iOS/Android framework | Mature ecosystem, production-tested for media apps (Spotify, YT Music). Performance adequate for playback controls. |
| **TypeScript** | 5.x+ | Static typing for entire codebase | PRD requirement; enables catching auth and state errors early. React Native + TS has excellent IDE support. |
| **React Navigation** | 6.x+ | Navigation and routing | PRD-recommended; handles authenticated/unauthenticated stack, bottom tabs for playlists/player. |

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **TanStack Query (React Query)** | 5.x+ | Server state (API caching, refetch, retry) | Handles playlist fetching, import status polling, stream lookup caching. Built-in retry logic with exponential backoff aligns with PRD's adaptive polling (2-8s). Reduces boilerplate vs manual useEffect. |
| **Zustand** | 4.x+ | Client state (playback position, queue, UI) | Lightweight, minimal overhead for React Native. No Redux boilerplate. Perfect for ephemeral playback state. Alternative: Redux Toolkit if team prefers (PRD open decision). |

### Audio & Playback

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| **expo-av (Expo Audio)** | Latest | Core audio playback engine | Production-grade for background audio. Supports 30+ min background playback on iOS/Android. Handles volume ducking, interruption modes. Lower-level alternative: react-native-audio-recorder-player (no lock screen). |
| **react-native-track-player** | 3.x+ | Lock screen controls + Bluetooth transport | Wraps iOS MPRemoteCommandCenter + Android MediaSession. Essential for lock screen play/pause, next/previous. Integrates with expo-av output. |
| **react-native-youtube-iframe** | 2.x+ | YouTube playback (RECOMMENDED for Phase 1) | Embedded iframe playback, simplest integration with minimal transport controls. Alternative: WebView + custom YouTube player (more complex, better UX control). Phase 1 gate decides path. |

### Auth & Security

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| **expo-secure-store** | Latest | Secure token storage | Encrypts refresh token on iOS Keychain, Android Keystore. No plain-text storage. Required for dual-auth. |
| **axios** or **fetch API** | Latest | HTTP client | For API requests with bearer token injection. Axios recommended for interceptors (auto-refresh on 401). |
| **jotai** or **zustand** | Latest | Auth context (optional) | If using zustand, can colocate auth state with playback state. Otherwise, create separate auth context. |

### Database & Caching

| Technology | Version | Purpose | Why |
|---------|---------|---------|-----|
| **TanStack Query** | 5.x+ | Query caching with automatic invalidation | (See above under state management) Replaces redux-persist for client-side cache. |
| **AsyncStorage** (optional) | Latest | Persistent local state (e.g., last playlist, user prefs) | Lower priority than TanStack Query. TQ handles server caching. AsyncStorage for user settings only. |

### Testing

| Framework | Version | Purpose | When to Use |
|-----------|---------|---------|-------------|
| **Jest** | 29.x+ | Unit testing (components, utilities) | Auth logic, token refresh, error handling. Mock API responses with msw (Mock Service Worker). |
| **React Testing Library** | Latest | Component testing | Playlist view, playback controls, error states. |
| **Detox** | 20.x+ | E2E testing (iOS) | Lock screen controls, background playback, Bluetooth actions. Phase 1 gate and ongoing Phase 3/4. |
| **Appium** or **Maestro** | Latest | E2E testing (Android) | Same as Detox but for Android. Maestro emerging alternative (simpler, cloud-ready). |
| **MSW (Mock Service Worker)** | Latest | API mocking | Mock dual-auth responses, error envelopes, token refresh. |

### Performance & Debugging

| Tool | Version | Purpose | Why |
|------|---------|---------|-----|
| **React Native Debugger** | Latest | Dev-time debugging | Breakpoints, Redux DevTools, Network tab. |
| **Sentry** (recommended for Phase 2) | Latest | Error tracking in production | Tracks crashes, named error codes, correlation IDs. |
| **Flipper** | Latest | Native debugging | Android Studio / Xcode integration for logs, network, UI hierarchy. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **expo-linking** | Latest | Deep linking (e.g., share import links) | Post-MVP if sharing/invite feature added. |
| **expo-notifications** | Latest | Push notifications (import complete, etc.) | Post-MVP; deferred per PRD items register. |
| **react-native-gesture-handler** | Latest | Gesture support (swipe, long-press) | If adding gesture controls for playback. |
| **react-native-reanimated** | Latest | Smooth animations | Player UI animations (progress bar, shuffle state). |

## Installation & Setup

```bash
# Create new Expo project (Phase 1)
npx create-expo-app demus-mobile --template
cd demus-mobile

# Core dependencies
npm install expo-av react-native-track-player react-native-youtube-iframe
npm install axios zustand @tanstack/react-query
npm install react-navigation @react-navigation/native @react-navigation/bottom-tabs
npm install expo-secure-store @react-native-async-storage/async-storage

# Dev dependencies
npm install -D typescript @types/react-native @types/react jest @testing-library/react-native
npm install -D @react-native-debugger/native-debugger

# Testing (Phase 2+)
npm install -D detox detox-cli (iOS testing)
npm install -D appium @appium/android-driver (Android testing)
npm install -D msw @testing-library/jest-dom

# TypeScript setup
npx tsc --init  # Create tsconfig.json with React Native preset
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Recommended |
|----------|-------------|-------------|-------------------|
| Audio library | expo-av | react-native-sound, react-native-media-kit | expo-av has better Expo integration; alternatives require more native code. |
| Lock screen | react-native-track-player | Custom MPRemoteCommandCenter wrapper | RNTP is battle-tested, reduces integration complexity. |
| YouTube | react-native-youtube-iframe | Bare WebView, youtube-dl integration | iframe simpler for Phase 1 gate; can pivot to WebView if control needs demand it. |
| State management | Zustand | Redux Toolkit | Zustand lighter for React Native; RTK if team insists (PRD open decision). |
| Query caching | TanStack Query | SWR, Apollo Client | TQ best for REST API; Apollo for GraphQL (not applicable here). SWR simpler but TQ's retry logic essential for polling. |
| Secure storage | expo-secure-store | react-native-keychain | Expo version integrated with Expo CLI; RN version requires native setup. |
| E2E testing | Detox + Appium | Calabash, UIAutomator | Detox/Appium are industry standard; others less maintained. |

## Configuration & Environment

### .env.local (for Phase 1+)

```bash
# API
REACT_APP_API_BASE=http://localhost:3000  # Local dev, adjust for staging/prod
REACT_APP_API_TIMEOUT=15000

# Auth
REACT_APP_AUTH_REDIRECT_URI=demusmobile://auth-callback
REACT_APP_TOKEN_REFRESH_INTERVAL=900000  # 15 min (locked by PRD)

# Logging
REACT_APP_LOG_LEVEL=debug  # debug | info | warn | error
```

### tsconfig.json (React Native preset)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "jsx": "react",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## Version Pinning & Lock Strategy

- **Expo SDK:** Pin to 51.x or later (lock minor version). Upgrade quarterly after community validation.
- **React Native:** Pin to 0.74.x or later (lock minor version). Expo SDK auto-selects compatible RN version.
- **TanStack Query:** Pin to 5.x (lock minor version). Major version bumps are infrequent; monitor changelog.
- **Zustand:** Pin to 4.x (stable, rarely updates breaking changes).
- **TypeScript:** Pin to 5.x (lock minor version). Annual updates typical.

Use `package-lock.json` (npm) or `yarn.lock` (yarn) to ensure reproducible installs across team and CI/CD.

## Backend Contract Alignment

This stack assumes backend compliance with PRD v1.2 contracts:

| Contract | Stack Implication | Implementation |
|----------|-------------------|-----------------|
| Dual-auth (cookie + bearer) | Axios interceptors inject `Authorization: Bearer {token}` | axios instance with custom request interceptor |
| Standard error envelope | Zustand error state store maps codes to UX recovery | Error boundary + modal/toast per code |
| 15-min access token TTL | Token refresh before expiry (proactive), or retry on 401 (reactive) | axios response interceptor on 401 triggers refresh flow |
| 30-day refresh token TTL | Refresh token persisted in expo-secure-store, rotated on successful refresh | SecureStore read/write in auth context |

## Sources

- **Expo documentation:** expo.dev/docs (Audio, Secure Store, Navigation)
- **React Navigation:** reactnavigation.org/docs
- **TanStack Query:** tanstack.com/query/latest
- **Zustand:** github.com/pmndrs/zustand
- **react-native-track-player:** rntp.music (GitHub: react-native-music/react-native-track-player)
- **Detox:** detoxjs.io (GitHub: wix/detox)
- **Community patterns:** reddit.com/r/reactnative, github.com/react-native issues, Stack Overflow
