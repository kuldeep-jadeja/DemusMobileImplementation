---
phase: 02
slug: music-playback-queue
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2025-01-18
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 with @testing-library/react-native 12.4.1 |
| **Config file** | jest.config.js (exists, configured in Phase 1) |
| **Quick run command** | `npm run test -- --testPathPattern=playback\|queue` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15-20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --testPathPattern=playback|queue`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green + manual audio playback test
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | US-PLAY-001 | unit | `npm list react-native-track-player expo-haptics` | ✅ | ⬜ pending |
| 02-01-02 | 01 | 1 | US-PLAY-001 | unit | `npm test -- TrackPlayerService` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | US-PLAY-001 | manual | Verify setupTrackPlayer logs | ✅ | ⬜ pending |
| 02-02-01 | 02 | 2 | US-PLAY-001, US-PLAY-002, US-PLAY-003 | unit | `npm test -- PlaybackService` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | US-PLAY-002, US-PLAY-003 | unit | `npm test -- QueueService` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 2 | US-PLAY-001, US-PLAY-002 | unit | `npm test -- PlaybackContext` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 3 | US-PLAY-001 | unit | `npm test -- MusicPlayer` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 3 | US-PLAY-001 | unit | `npm test -- ProgressBar` | ❌ W0 | ⬜ pending |
| 02-03-03 | 03 | 3 | US-PLAY-001 | integration | Manual verify full player UI | ✅ | ⬜ pending |
| 02-04-01 | 04 | 4 | US-PLAY-002, US-PLAY-003 | unit | `npm test -- QueueList` | ❌ W0 | ⬜ pending |
| 02-04-02 | 04 | 4 | US-PLAY-001, US-PLAY-002, US-PLAY-003 | integration | `npm test -- playback-flow` | ❌ W0 | ⬜ pending |
| 02-04-03 | 04 | 4 | PERF-001, PERF-002 | manual | Manual QA checkpoint | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/services/audio/TrackPlayerService.test.ts` — Verify RNTP setup, initialization, idempotency (REQ US-PLAY-001)
- [ ] `tests/services/audio/PlaybackService.test.ts` — Play, pause, skip, seek APIs (REQ US-PLAY-001)
- [ ] `tests/services/audio/QueueService.test.ts` — Add, remove, reorder, shuffle, repeat logic (REQ US-PLAY-002, US-PLAY-003)
- [ ] `tests/contexts/PlaybackContext.test.tsx` — Context state management, hook behavior (REQ US-PLAY-001, US-PLAY-002)
- [ ] `tests/components/player/MusicPlayer.test.tsx` — Full player rendering, control interactions (REQ US-PLAY-001)
- [ ] `tests/components/player/ProgressBar.test.tsx` — Seekable progress bar, drag interaction (REQ US-PLAY-001)
- [ ] `tests/components/queue/QueueList.test.tsx` — FlatList optimization, 1000+ tracks performance (REQ US-PLAY-002)
- [ ] `tests/integration/playback-flow.test.ts` — End-to-end: play track → pause → skip → seek → queue manipulation (REQ US-PLAY-001, US-PLAY-002, US-PLAY-003)
- [ ] `__mocks__/react-native-track-player.ts` — Mock RNTP for all tests

**Note:** Most tasks in Plan 02-01, 02-02, 02-03, 02-04 have `tdd="true"` attribute, meaning they create tests first before implementation. Wave 0 scaffold provides the test file structure.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Playback starts within 1 second | PERF-001 | Requires real audio engine, stopwatch measurement on physical device | 1. Load track from streaming URL<br>2. Tap play<br>3. Use stopwatch to measure time until audio starts<br>4. Should be <1s |
| Playback controls respond <200ms | PERF-002 | Requires real-time interaction measurement | 1. Play a track<br>2. Tap pause/play/skip rapidly<br>3. Observe visual feedback and state changes<br>4. Should feel instant (<200ms) |
| Background playback works | US-PLAY-001 | Requires OS backgrounding, lock screen testing | 1. Play a track<br>2. Background the app (home button)<br>3. Verify audio continues<br>4. Lock device, verify lock screen controls |
| Drag-to-reorder gestures | US-PLAY-002 | Gesture smoothness evaluation | 1. Open queue with 50+ tracks<br>2. Long-press a track<br>3. Drag to new position<br>4. Release, verify order updated |

---

## Requirement → Test Coverage Map

### US-PLAY-001: Play Individual Track
**Automated Tests:**
- `TrackPlayerService.test.ts` → setupTrackPlayer(), play()
- `PlaybackService.test.ts` → play(), pause(), skipToNext(), skipToPrevious(), seekTo()
- `PlaybackContext.test.tsx` → Track state updates, position tracking
- `MusicPlayer.test.tsx` → UI renders track info, controls trigger actions
- `ProgressBar.test.tsx` → Seekable progress bar updates position
- `playback-flow.test.ts` → End-to-end: load track → play → pause → seek

**Manual Tests:**
- Lock screen controls (iOS + Android)
- Background playback continuation
- Playback latency <1s (PERF-001)

**Plans:** 02-01, 02-02, 02-03, 02-04

---

### US-PLAY-002: Queue Management
**Automated Tests:**
- `QueueService.test.ts` → setQueue(), addToQueue(), removeFromQueue(), reorderQueue()
- `PlaybackContext.test.tsx` → Queue state management, currentIndex updates
- `QueueList.test.tsx` → FlatList performance with >1000 tracks, drag-to-reorder logic
- `playback-flow.test.ts` → Add track → play from queue → remove track

**Manual Tests:**
- Drag-to-reorder gesture smoothness
- Queue performance with 1000+ tracks (scroll, search)

**Plans:** 02-02, 02-04

---

### US-PLAY-003: Playback Controls (Shuffle, Repeat)
**Automated Tests:**
- `QueueService.test.ts` → toggleShuffle(), setRepeatMode(), shuffle algorithm
- `PlaybackContext.test.tsx` → Shuffle state, repeat mode persistence
- `ShuffleRepeatControls.test.tsx` → Button toggles, visual state changes
- `playback-flow.test.ts` → Enable shuffle → skip tracks → verify order, repeat mode edge cases

**Manual Tests:**
- Shuffle maintains current track (doesn't skip on enable)
- Repeat modes work correctly (off → all → one → off)

**Plans:** 02-02, 02-03, 02-04

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags (Jest runs once, exits with code)
- [x] Feedback latency < 20s (test suite fast enough)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** Pending execution

---

## Notes

1. **Test Infrastructure:** Jest framework already installed and configured in Phase 1 (`jest.config.js`). No Wave 0 framework setup needed.

2. **Mock Requirement:** react-native-track-player must be mocked for tests (`__mocks__/react-native-track-player.ts`). This is a standard pattern for native modules.

3. **Manual QA Critical:** Actual audio playback timing (US-PLAY-001 <1s requirement) cannot be verified by unit tests. Manual QA checkpoint is mandatory in Plan 02-04, Task 3.

4. **TDD Approach:** Most tasks have `tdd="true"` attribute. Executors write tests first (RED), then implement (GREEN), then refactor. Wave 0 provides test file scaffolds.

5. **Test Patterns:**
   - Services: Unit tests with mocked TrackPlayer
   - Context: Integration tests with React Testing Library
   - Components: Snapshot + interaction tests
   - Integration: End-to-end flow tests simulating user journeys

6. **Coverage Target:** >80% for service layer (PlaybackService, QueueService, TrackPlayerService). Components can be lower (snapshot coverage).

7. **Feedback Loop:** Fast test runs (<20s) enable rapid TDD cycles. Use `--testPathPattern` to run only affected tests during development.

8. **Performance Tests:** US-PLAY-002 (queue handles >1000 tracks) is partially automated via `QueueList.test.tsx` (renders without crash), but smoothness is manual verification.
