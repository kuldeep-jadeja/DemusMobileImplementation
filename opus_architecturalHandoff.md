# Demus — Architecture Review & Production Upgrade Plan

> **Review Date:** March 2026
> **Status:** Pre-Production Review
> **Verdict:** 7/10 — Great foundation, 5 critical risks must be resolved before launch

---

## Table of Contents

- [1. Executive Summary](#1-executive-summary)
- [2. What's Solid — Keep These](#2-whats-solid--keep-these)
- [3. Critical Risk #1 — Spotify 100-Track Hard Limit](#3-critical-risk-1--spotify-100-track-hard-limit)
- [4. Critical Risk #2 — YouTube Matching Quality](#4-critical-risk-2--youtube-matching-quality)
- [5. Critical Risk #3 — PO Token / Bot Detection](#5-critical-risk-3--po-token--bot-detection)
- [6. Critical Risk #4 — Import Speed UX](#6-critical-risk-4--import-speed-ux)
- [7. Critical Risk #5 — youtubei.js Decipher Requirement](#7-critical-risk-5--youtubeijs-decipher-requirement)
- [8. Medium Risks](#8-medium-risks)
- [9. Revised Architecture Diagram](#9-revised-architecture-diagram)
- [10. Priority Action Items](#10-priority-action-items)
- [11. Updated Mental Model for AI / Copilot](#11-updated-mental-model-for-ai--copilot)
- [Appendix A — Dependency Map](#appendix-a--dependency-map)
- [Appendix B — Environment Variables](#appendix-b--environment-variables)
- [Appendix C — File Structure](#appendix-c--file-structure)

---

## 1. Executive Summary

Demus is a zero-cost, scrape-powered, cache-first music streaming engine built on:

- Public web scraping (Spotify)
- Heuristic search (YouTube)
- Intelligent caching (MongoDB + Redis)
- Client-side playback (YouTube CDN / IFrame)

### Core Design Goals

| Goal | Target |
| ---- | ------ |
| API cost | $0 |
| Audio bandwidth cost | $0 |
| Playback scalability | Near-infinite |

### Core Principles

| # | Principle | Implementation |
| - | --------- | -------------- |
| 1 | Zero API Cost | Spotify → scraping / YouTube → scraping |
| 2 | Zero Server Bandwidth | Server extracts URL → Client streams from YouTube CDN |
| 3 | Cache-First | MongoDB as global memory — matched once = never search again |
| 4 | Serialized External Calls | Only worker processes can call yt-search |

### System Identity

```text
Extract once → Reuse forever
```

---

## 2. What's Solid — Keep These

### 2.1 Cache-First Architecture ✅

The golden rule:

> **NEVER call yt-search if youtubeVideoId exists.**

This is the single most important principle. The fingerprint deduplication is excellent
for preventing wasted work across playlists.

### 2.2 Worker-Based Serialization ✅

Isolating `yt-search` behind a Redis queue prevents stampede and rate limiting.

```text
Rule: API MUST NOT call yt-search directly.
```

### 2.3 Hybrid Playback (IFrame + Audio) ✅

| Platform | Method | Cost |
| -------- | ------ | ---- |
| Desktop | YouTube IFrame | $0 — zero extraction needed |
| Mobile | Extracted CDN URL via `<audio>` | $0 bandwidth — supports background playback |

### 2.4 Redis Layering ✅

Three-system Redis usage is clean and well-separated:

| Key Pattern | Purpose |
| ----------- | ------- |
| `demus:ytmatch:queue` | Matching jobs for workers |
| `demus:audio-url:<videoId>` | Extracted CDN URLs (TTL ≈ 2h) |
| `demus:audio-lock:<videoId>` | Extraction deduplication lock |

### 2.5 Server Never Streams Audio ✅

This is the most important scaling property.

```text
Server → extracts audio URL
Client → streams directly from YouTube CDN
```

Server costs stay near-zero regardless of user count.

---

## 3. Critical Risk #1 — Spotify 100-Track Hard Limit

### Problem

`spotify-url-info` has a hard architectural ceiling — only the first 100 tracks are returned.

| Issue | Impact |
| ----- | ------ |
| Max 100 tracks per playlist | 500+ track playlists get silently truncated |
| Embed page scraping | Spotify can change embed DOM at any time |
| No pagination | Cannot fetch tracks 101+ |
| No private playlists | Only public playlists work |

### Solution A — Pagination via Direct Embed Scraping (Fragile)

```javascript
// lib/spotify/scraper.js
const BATCH_SIZE = 100;

async function scrapeFullPlaylist(playlistId) {
  const allTracks = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      if (offset === 0) {
        const { getTracks } = require('spotify-url-info')(fetch);
        const tracks = await getTracks(
          `https://open.spotify.com/playlist/${playlistId}`
        );
        allTracks.push(...tracks);
        hasMore = tracks.length === BATCH_SIZE;
        offset += BATCH_SIZE;
      } else {
        const res = await fetch(
          `https://open.spotify.com/embed/playlist/${playlistId}`,
          {
            headers: {
              'User-Agent': 'googlebot',
              Range: `tracks=${offset}-${offset + BATCH_SIZE}`,
            },
          }
        );
        const html = await res.text();
        const tracks = parseSpotifyHydration(html, offset);

        if (!tracks.length) {
          hasMore = false;
        } else {
          allTracks.push(...tracks);
          offset += tracks.length;
          hasMore = tracks.length === BATCH_SIZE;
        }
      }

      await sleep(500 + Math.random() * 1000);
    } catch (err) {
      console.error(`[spotify] Failed at offset ${offset}:`, err.message);
      hasMore = false;
    }
  }

  return deduplicateByFingerprint(allTracks);
}
```

### Solution B — Spotify Web API with Client Credentials (⭐ Recommended)

This is free, reliable, and production-grade:

- Client Credentials flow = **no user login needed**
- Full pagination support
- Rate limit: ~180 requests/minute
- **$0 cost**
- Only trade-off: register an app at [developer.spotify.com](https://developer.spotify.com)

```javascript
// lib/spotify/api.js
class SpotifyClient {
  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.token = null;
    this.tokenExpiresAt = 0;
  }

  async getToken() {
    if (this.token && Date.now() < this.tokenExpiresAt) return this.token;

    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${this.clientId}:${this.clientSecret}`
        ).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    const data = await res.json();
    this.token = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    return this.token;
  }

  async getPlaylistTracks(playlistId) {
    const allTracks = [];
    let url =
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?` +
      `limit=100&fields=items(track(id,name,artists(name),album(name),duration_ms)),next`;

    while (url) {
      const token = await this.getToken();
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Spotify API ${res.status}`);

      const data = await res.json();
      allTracks.push(
        ...data.items
          .filter((i) => i.track)
          .map((i) => ({
            spotifyId: i.track.id,
            name: i.track.name,
            artists: i.track.artists.map((a) => a.name),
            album: i.track.album?.name,
            duration: Math.round(i.track.duration_ms / 1000),
          }))
      );

      url = data.next;
      if (url) await sleep(100);
    }

    return allTracks;
  }
}

module.exports = { SpotifyClient };
```

### Recommendation

Use the **Spotify Web API**. It is free, reliable, has pagination, and preserves the
zero-cost model. Scraping is the weakest link in the current architecture.

---

## 4. Critical Risk #2 — YouTube Matching Quality

### Problem

The current matching system produces **wrong matches 10–20% of the time**. For a music
app this is devastating — playing the wrong song destroys user trust.

| Issue | Example |
| ----- | ------- |
| Query format too rigid | Fan uploads returned instead of official |
| No ISRC matching | Cannot uniquely identify recordings |
| Duration ±15s too loose | A 3:30 song matches a 3:45 remix |
| No cross-reference validation | Cannot verify correctness |
| `yt-search` scrapes HTML | YouTube DOM changes break it constantly |

### Solution — Multi-Signal Scoring System

```javascript
// lib/matching/scorer.js
const DURATION_TOLERANCE_SEC = 10;

/**
 * Scores a YouTube candidate against a Spotify track.
 *
 * Score ranges:
 *   70+   Very high confidence (Topic channel + duration match)
 *   40-69 Good match (official channel + title match)
 *   15-39 Acceptable (some signals match)
 *   <15   Rejected (too risky)
 */
function scoreCandidate(candidate, track) {
  let score = 0;
  const titleLower = candidate.title.toLowerCase();
  const channelLower = (candidate.author?.name || '').toLowerCase();

  // ── STRONG POSITIVE SIGNALS ──

  // Topic channel = official YouTube Music upload (always correct)
  if (channelLower.endsWith('- topic')) score += 50;

  // VEVO channel
  if (channelLower.includes('vevo')) score += 40;

  // Duration match
  const durationDiff = Math.abs(candidate.duration?.seconds - track.duration);
  if (durationDiff <= 3) score += 30;
  else if (durationDiff <= DURATION_TOLERANCE_SEC) score += 20;
  else if (durationDiff <= 15) score += 5;
  else score -= 30;

  // Title contains track name and artist
  const trackNameNorm = normalize(track.name);
  const artistNorm = normalize(track.artists[0]);
  if (normalize(candidate.title).includes(trackNameNorm)) score += 15;
  if (normalize(candidate.title).includes(artistNorm)) score += 10;

  // Official markers
  if (titleLower.includes('official audio')) score += 10;
  if (titleLower.includes('official music video')) score += 8;

  // ── STRONG NEGATIVE SIGNALS ──
  const negatives = [
    'cover', 'remix', 'live', 'karaoke', 'instrumental',
    'reaction', 'tutorial', 'slowed', 'reverb', 'sped up',
    '8d audio', 'nightcore', 'bass boosted',
  ];

  for (const neg of negatives) {
    if (titleLower.includes(neg) && !track.name.toLowerCase().includes(neg)) {
      score -= 25;
    }
  }

  // Extreme length mismatch
  if (candidate.duration?.seconds < 30) score -= 50;
  if (candidate.duration?.seconds > track.duration * 2.5) score -= 40;

  return score;
}

function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

/**
 * Multi-query search strategy.
 * Tries progressively broader queries, stops on high-confidence match.
 */
async function findBestMatch(track, searchFn) {
  const queries = [
    `${track.name} ${track.artists[0]} audio`,
    `${track.name} ${track.artists[0]} official`,
    `${track.name} ${track.artists[0]}`,
  ];

  let bestCandidate = null;
  let bestScore = -Infinity;

  for (const query of queries) {
    const results = await searchFn(query);
    const videos = results.videos?.slice(0, 8) || [];

    for (const video of videos) {
      const s = scoreCandidate(video, track);
      if (s > bestScore) {
        bestScore = s;
        bestCandidate = { ...video, matchScore: s, matchQuery: query };
      }
    }

    if (bestScore >= 70) break;

    await sleep(800 + Math.random() * 400);
  }

  if (bestScore < 15) {
    return { videoId: null, matchScore: bestScore, reason: 'no confident match' };
  }

  return bestCandidate;
}

module.exports = { scoreCandidate, findBestMatch, normalize };
```

### Replace yt-search with youtubei.js Search

Since `youtubei.js` is already a dependency for extraction, use it for search too:

```javascript
const yt = await getInnertube();
const search = await yt.search(
  `${track.name} ${track.artists[0]} audio`,
  { type: 'video' }
);
const videos = search.results?.filter((r) => r.type === 'Video') || [];
```

This eliminates the `yt-search` dependency and its HTML-scraping fragility entirely.

---

## 5. Critical Risk #3 — PO Token / Bot Detection

### Problem — Existential Risk

This is the **#1 existential threat** to Demus.

YouTube is actively rolling out Proof of Origin (PO) Token requirements across all
clients. A PO token is a parameter that YouTube requires with video playback requests.

**Without it:**

- Format URL requests return HTTP 403
- Bot detection pages appear
- Account or IP address gets blocked

**What makes it harder (2025+):**

YouTube now uses **content-bound PO tokens** — generated per video using the video ID.

| Constraint | Detail |
| ---------- | ------ |
| Session tokens no longer sufficient | Must be per-video |
| Token lifespan | ~12 hours |
| Binding | Bound to Visitor ID or Session ID |
| Caching | Must NOT cache across different videos |

### Impact on Demus

| Scenario | Consequence |
| -------- | ----------- |
| ANDROID client stops working | All mobile extraction fails |
| Server IP flagged | All extraction fails from that server |
| Session tokens expire | 403 errors mid-playback |

### Solution — Integrate BgUtils for PO Token Generation

```javascript
// lib/po-token.js
import { BG } from 'bgutils-js';
import { JSDOM } from 'jsdom';

let mintCallback = null;
let visitorData = null;

/**
 * Initialize BotGuard challenge.
 * Call once at startup, refresh every ~12 hours.
 */
async function initBotGuard(innertube) {
  const requestKey = 'O43z0dpjhgX20SCx4KAo';

  const challengeResponse = await fetch(
    'https://jnn-pa.googleapis.com/$rpc/google.internal.waa.v1.Waa/Create',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json+protobuf',
        'x-goog-api-key': 'AIzaSyDyT5W0Jh49F30Pqqtyfdf7pDLFKLJoAnw',
        'x-user-agent': 'grpc-web-javascript/0.1',
      },
      body: JSON.stringify([requestKey]),
    }
  );

  const challengeData = await challengeResponse.json();

  const dom = new JSDOM(
    '<!DOCTYPE html><html><body></body></html>',
    {
      url: 'https://www.youtube.com',
      runScripts: 'dangerously',
      resources: 'usable',
    }
  );

  const bgConfig = {
    fetch: fetch,
    globalObj: dom.window,
    identifier:
      visitorData || innertube.session.context.client.visitorData,
  };

  const bgInstance = await BG.Challenge.create(bgConfig, challengeData);
  if (!bgInstance) throw new Error('Failed to create BG challenge');

  mintCallback = bgInstance.mint;
  visitorData = bgConfig.identifier;

  return { mintCallback, visitorData };
}

/**
 * Generate a content-bound PO token for a specific video ID.
 * This token is bound to the video ID and must NOT be cached across videos.
 */
async function generatePoToken(videoId) {
  if (!mintCallback) throw new Error('BotGuard not initialized');

  const result = await mintCallback(new TextEncoder().encode(videoId));
  if (!result || !(result instanceof Uint8Array)) {
    throw new Error('PO token generation failed');
  }

  const poToken = Buffer.from(result).toString('base64url');
  return { poToken, visitorData };
}

module.exports = { initBotGuard, generatePoToken };
```

### Integration with Extraction Handler

```javascript
const { poToken, visitorData } = await generatePoToken(videoId);

const info = await yt.getBasicInfo(videoId, {
  client: 'WEB',
});
```

### PO Token Lifecycle Rules

| # | Rule |
| - | ---- |
| 1 | Initialize BotGuard **once** at server startup |
| 2 | Refresh BotGuard challenge every ~12 hours |
| 3 | Generate a **new** content-bound token for **each** video |
| 4 | Do **NOT** cache PO tokens across videos |
| 5 | Regenerate on 403 errors |

---

## 6. Critical Risk #4 — Import Speed UX

### Problem

```text
100 tracks → ~5–8 minutes wait time
```

Users waiting 8 minutes staring at a loading screen will delete the app.

### Solution — 3-Phase Import Architecture

```text
Phase 1: INSTANT (< 2 seconds)
  → Import Spotify metadata → save to MongoDB → return to user immediately
  → UI shows playlist with all track names, artists, album art
  → Status: "Matching in progress..."

Phase 2: BACKGROUND (parallel workers)
  → Worker processes pick up matching jobs in priority order
  → Each track status: pending → matching → matched → failed

Phase 3: ON-DEMAND (lazy extraction)
  → Audio URL extracted ONLY when user taps play
  → Not during import
```

### API Response Structure

```json
{
  "status": "imported",
  "playlist": {
    "id": "pl_abc123",
    "name": "My Playlist",
    "trackCount": 247,
    "matchedCount": 0,
    "tracks": [
      {
        "id": "tr_001",
        "name": "Blinding Lights",
        "artist": "The Weeknd",
        "duration": 200,
        "status": "pending",
        "youtubeVideoId": null
      }
    ]
  },
  "estimatedMatchTime": "3-5 minutes"
}
```

### Smart Queue with Priority and Fingerprint Cache

```javascript
// lib/queue/smartQueue.js
class SmartQueue {
  async enqueuePlaylist(playlistId, tracks) {
    const redis = await getRedis();

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];

      // Check fingerprint cache first
      const fingerprint = generateFingerprint(track.name, track.artists);
      const existing = await db.collection('tracks').findOne({
        fingerprint,
        youtubeVideoId: { $ne: null },
      });

      if (existing) {
        // Instant match from cache — no worker needed
        await db.collection('tracks').updateOne(
          { _id: track._id },
          {
            $set: {
              youtubeVideoId: existing.youtubeVideoId,
              status: 'matched',
              matchedFrom: 'fingerprint-cache',
            },
          }
        );
        continue;
      }

      // Priority: first 10 tracks = highest priority
      const priority = i < 10 ? 0 : i < 50 ? 1 : 2;

      await redis.zadd(
        'demus:ytmatch:queue',
        priority,
        JSON.stringify({
          trackId: track._id,
          name: track.name,
          artists: track.artists,
          duration: track.duration,
          playlistId,
        })
      );
    }
  }
}

module.exports = { SmartQueue };
```

### Client-Side Progress Polling

```javascript
function usePlaylistImportProgress(playlistId) {
  const [progress, setProgress] = useState({ matched: 0, total: 0 });

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/playlist/${playlistId}/progress`);
      const data = await res.json();
      setProgress(data);

      if (data.matched === data.total) clearInterval(interval);
    }, 3000);

    return () => clearInterval(interval);
  }, [playlistId]);

  return progress;
}
```

### Expected Improvement

| Metric | Before | After |
| ------ | ------ | ----- |
| Time to see playlist | 5–8 minutes | < 2 seconds |
| Fingerprint cache hits | 0% | 30–60% instant resolution |
| Playable during import | No | Yes (already-matched songs) |

---

## 7. Critical Risk #5 — youtubei.js Decipher Requirement

### Problem

Deciphering streaming URLs in `youtubei.js` requires executing YouTube's obfuscated
JavaScript code. The library does **not** include a built-in interpreter — it relies on
Node.js `vm` module.

### Runtime Compatibility

| Runtime | `vm` Module | Decipher Works |
| ------- | ----------- | -------------- |
| Node.js (VPS / Container) | ✅ Built-in | ✅ Yes |
| Vercel Serverless (Node) | ✅ Available | ✅ Yes |
| Vercel Edge Runtime | ❌ Not available | ❌ No |
| Cloudflare Workers | ❌ Not available | ❌ No |
| Deno Deploy | ❌ Not available | ❌ No |

### Solution — Deploy on Node.js Runtime Only

```javascript
// Verify at startup
try {
  require('vm');
  console.log('[demus] vm module available — decipher will work');
} catch {
  console.error('[demus] vm module NOT available — decipher WILL FAIL');
  console.error('[demus] Deploy on Node.js runtime, not edge runtime');
  process.exit(1);
}
```

### Deployment Rules

```text
✅ VPS (DigitalOcean, Hetzner, AWS EC2)
✅ Docker containers
✅ Vercel Serverless Functions (Node.js runtime)
✅ Railway / Render

❌ Vercel Edge Functions
❌ Cloudflare Workers
❌ Deno Deploy
```

---

## 8. Medium Risks

### 8.1 MongoDB Schema — Missing Indexes

Without proper indexes, queries do full collection scans at scale:

```javascript
db.tracks.createIndex({ fingerprint: 1 }, { unique: false });
db.tracks.createIndex({ spotifyId: 1 }, { unique: true, sparse: true });
db.tracks.createIndex({ youtubeVideoId: 1 }, { sparse: true });
db.tracks.createIndex({ playlist: 1, status: 1 });
db.tracks.createIndex(
  { name: 'text', artists: 'text' },
  { weights: { name: 10, artists: 5 } }
);
```

### 8.2 iOS Background Playback — Silent MP3 Hack Is Fragile

The current silent MP3 loop trick works but violates Apple's guidelines and may break
with any iOS update.

**Current approach (fragile):**

```text
tap → silent MP3 → loop → fetch URL → swap src → play
```

**Improved approach (more robust):**

```javascript
class BackgroundAudioKeepAlive {
  constructor() {
    this.audioContext = null;
  }

  start() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    gain.gain.value = 0.001; // Nearly silent
    oscillator.connect(gain);
    gain.connect(this.audioContext.destination);
    oscillator.start();
  }

  stop() {
    this.audioContext?.close();
  }
}
```

Use **alongside** the audio element, not instead of it.

### 8.3 Rate Limiting — In-Memory Won't Survive Restarts

Replace with Redis-based limiter (Redis is already available):

```javascript
// lib/rateLimit.js
async function checkRateLimit(redis, key, maxRequests, windowSec) {
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, windowSec);
  }
  return current <= maxRequests;
}

// Usage
const allowed = await checkRateLimit(
  redis,
  `demus:ratelimit:import:${userId}`,
  5,
  3600
);
```

### 8.4 yt-search HTML Parsing Fragility

`yt-search` uses HTTP requests and parses results with cheerio. The `ytInitialData`
object is subject to continuous modifications by YouTube.

**Solution:** Replace with `youtubei.js` search (see Section 4).

---

## 9. Revised Architecture Diagram

### High-Level System Flow

```text
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT (React Native)                         │
│                                                                      │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────────────────┐  │
│  │  Playlist    │  │  Track List    │  │  Player                 │  │
│  │  Import      │  │  (optimistic   │  │  IFrame (desktop)       │  │
│  │              │  │   UI, instant) │  │  <audio> (mobile)       │  │
│  └──────┬───────┘  └───────┬────────┘  └───────────┬─────────────┘  │
│         │                  │                        │                │
└─────────┼──────────────────┼────────────────────────┼────────────────┘
          │                  │                        │
          ▼                  ▼                        ▼
┌──────────────────────────────────────────────────────────────────────┐
│                           API LAYER                                  │
│                                                                      │
│  POST /import-playlist       GET /playlist/:id/progress              │
│  GET  /audio-url/:videoId    GET /track/:id                          │
│                                                                      │
│  [Redis Rate Limiter] ──▶ [Handler] ──▶ [Response]                   │
└──────────┬───────────────────────┬──────────────┬────────────────────┘
           │                       │              │
           ▼                       ▼              ▼
┌───────────────────┐  ┌──────────────────┐  ┌─────────────────────────┐
│  Spotify Client   │  │    MongoDB       │  │  Audio Extraction       │
│                   │  │                  │  │                         │
│  Option A:        │  │  tracks {        │  │  1. Redis cache check   │
│   API (free)      │  │    fingerprint   │  │  2. MongoDB cache check │
│   ✅ Reliable     │  │    youtubeVideoId│  │  3. Redis lock acquire  │
│   ✅ Pagination   │  │    audioUrl      │  │  4. youtubei.js         │
│                   │  │    audioExpiresAt│  │     + BgUtils PO token  │
│  Option B:        │  │    matchScore    │  │  5. decipher() URL      │
│   spotify-url-    │  │    status        │  │  6. Cache in Redis +    │
│   info (scrape)   │  │  }              │  │     MongoDB             │
│   ⚠️ 100 limit    │  │                  │  │                         │
└───────────────────┘  │  playlists { }   │  └─────────────────────────┘
                       │  users { }       │
                       └────────┬─────────┘
                                │
           ┌────────────────────┼────────────────────┐
           ▼                    ▼                    ▼
┌────────────────────┐ ┌───────────────┐ ┌────────────────────┐
│  ytMatchWorker     │ │ chartsWorker  │ │ artistCrawler      │
│                    │ │               │ │                    │
│  Redis ZPOP ──▶    │ │ Pre-seeds     │ │ Expands catalog   │
│  youtubei.js       │ │ popular       │ │ via related       │
│  search() ──▶      │ │ tracks        │ │ artists           │
│  Multi-Signal      │ │               │ │                    │
│  Score & Match     │ │               │ │                    │
│  ──▶ MongoDB       │ │               │ │                    │
│                    │ │               │ │                    │
│  Delay: 2–5s      │ │               │ │                    │
│  between calls     │ │               │ │                    │
└────────────────────┘ └───────────────┘ └────────────────────┘
```

### Audio Extraction Flow (Detailed)

```text
GET /api/audio-url/:videoId
        │
        ▼
┌─── Redis Cache ────┐
│ demus:audio-url:   │──── HIT ────▶ Return cached URL
│ <videoId>          │
└────────┬───────────┘
         │ MISS
         ▼
┌─── MongoDB Cache ──┐
│ tracks.audioUrl    │──── HIT ────▶ Return + cache in Redis
│ + audioExpiresAt   │
└────────┬───────────┘
         │ MISS
         ▼
┌─── Redis Lock ─────┐
│ demus:audio-lock:  │──── LOCKED ─▶ Wait for existing extraction
│ <videoId>          │
└────────┬───────────┘
         │ ACQUIRED
         ▼
┌─── PO Token Gen ───┐
│ BgUtils            │
│ Content-bound      │
│ token for videoId  │
└────────┬───────────┘
         │
         ▼
┌─── youtubei.js ────┐
│ getBasicInfo()     │
│ chooseFormat()     │
│ decipher()         │
└────────┬───────────┘
         │
         ▼
┌─── Cache & Return ─┐
│ Redis SET (2h TTL) │
│ MongoDB UPDATE     │
│ Release lock       │
│ Return audioUrl    │
└────────────────────┘
```

---

## 10. Priority Action Items

| Priority | Issue | Fix | Effort |
| -------- | ----- | --- | ------ |
| **P0** | PO Token not implemented | Integrate BgUtils + content-bound tokens | 2–3 days |
| **P0** | Import UX (5–8 min wait) | Optimistic UI + fingerprint cache + priority queue | 1–2 days |
| **P1** | 100-track limit | Spotify API (Client Credentials) | 1 day |
| **P1** | Match quality ~80% | Multi-signal scoring + multi-query | 1–2 days |
| **P1** | yt-search fragility | Replace with youtubei.js search | 0.5 day |
| **P2** | Missing MongoDB indexes | Add compound indexes | 0.5 day |
| **P2** | In-memory rate limiter | Redis-based rate limiting | 0.5 day |
| **P2** | iOS background fragility | AudioContext keep-alive | 0.5 day |
| **P3** | No monitoring / alerting | Health checks + match quality metrics | 1 day |

**Estimated Total Effort: 8–11 days**

---

## 11. Updated Mental Model for AI / Copilot

Before **ANY** change to the Demus codebase, ask:

| # | Question |
| - | -------- |
| 1 | Does this increase cost? → Must remain $0 |
| 2 | Does this bypass cache? → Cache is sacred |
| 3 | Does this break zero-bandwidth rule? → Server NEVER streams |
| 4 | Does this increase YouTube requests? → Minimize at all costs |
| 5 | Does this handle PO token requirements? → Critical for 2025+ |
| 6 | Does this work without serverless/edge? → vm module required |
| 7 | Does this degrade gracefully when YouTube changes? → Fallback required |
| 8 | Is the user waiting synchronously? → Make it async with optimistic UI |

### System Constraints — DO NOT BREAK

| # | Constraint |
| - | ---------- |
| 1 | Do NOT use YouTube Data API |
| 2 | Do NOT proxy audio through server |
| 3 | Do NOT bypass Redis queue for YouTube matching |
| 4 | Do NOT search YouTube if youtubeVideoId is cached |
| 5 | Do NOT create multiple YouTube IFrame players |
| 6 | Do NOT break the fingerprint deduplication system |
| 7 | Do NOT deploy on edge runtimes (decipher requires vm) |
| 8 | Do NOT cache PO tokens across different videos |

---

## Appendix A — Dependency Map

| Dependency | Purpose | Status | Risk |
| ---------- | ------- | ------ | ---- |
| `youtubei.js` | Audio extraction + search | ✅ Active | Medium |
| `bgutils-js` | PO token generation | ✅ Active | High |
| `jsdom` | BotGuard execution environment | ✅ Stable | Low |
| `spotify-url-info` | Spotify scraping (current) | ⚠️ Limited | High |
| `@spotify/web-api-ts-sdk` | Spotify API (recommended) | ✅ Official | Low |
| `ioredis` | Redis client | ✅ Stable | Low |
| `mongoose` / `mongodb` | MongoDB client | ✅ Stable | Low |
| `yt-search` | YouTube search (current) | ⚠️ Fragile | High |

### Recommended Removals

| Package | Replaced By |
| ------- | ----------- |
| `@distube/ytdl-core` | `youtubei.js` |
| `yt-search` | `youtubei.js` search |
| `spotify-url-info` | Spotify Web API (Client Credentials) |

---

## Appendix B — Environment Variables

```env
# ── Spotify (if using API) ──
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret

# ── MongoDB ──
MONGODB_URI=mongodb+srv://...

# ── Redis ──
REDIS_URL=redis://...

# ── Runtime ──
NODE_ENV=production
```

> **Note:** `youtubei.js` and `bgutils-js` do not require environment variables.
> They use the InnerTube API directly and generate tokens at runtime.

---

## Appendix C — File Structure

```text
demus/
├── pages/
│   └── api/
│       ├── audio-url/
│       │   └── [videoId].js            # Audio extraction endpoint
│       ├── import-playlist.js          # Spotify playlist import
│       └── playlist/
│           └── [id]/
│               └── progress.js         # Match progress polling
├── lib/
│   ├── spotify/
│   │   ├── api.js                      # Spotify Web API client
│   │   └── scraper.js                  # Legacy scraper (fallback)
│   ├── matching/
│   │   ├── scorer.js                   # Multi-signal scoring
│   │   └── findBestMatch.js            # Multi-query search
│   ├── extractors/
│   │   └── innertube.js                # youtubei.js singleton + extraction
│   ├── po-token.js                     # BgUtils PO token generation
│   ├── queue/
│   │   └── smartQueue.js               # Priority queue + fingerprint cache
│   ├── redis.js                        # Redis connection
│   ├── rateLimit.js                    # Redis-based rate limiter
│   └── db.js                           # MongoDB connection
├── workers/
│   ├── ytMatchWorker.js                # YouTube matching worker
│   ├── chartsWorker.js                 # Popular tracks pre-seeder
│   └── artistCrawler.js               # Catalog expansion
├── .innertube-cache/                   # youtubei.js player cache (gitignored)
└── .env
```

---

> **Last Updated:** March 2026
> **Architecture Version:** 2.0
> **Status:** Ready for P0 implementation