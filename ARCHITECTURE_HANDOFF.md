# Demus — Full Architectural Handoff (Production System)

## Overview

Demus is a **zero-cost, scalable music streaming platform** that delivers a Spotify-like experience using:

- Public web scraping (Spotify)
- Heuristic search (YouTube)
- Intelligent caching (MongoDB + Redis)
- Client-side playback (YouTube CDN / IFrame)

The system is designed to operate with:

```txt
$0 API cost
$0 audio bandwidth cost
Near-infinite playback scalability
```

---

# Core Principles

## 1. Zero API Cost

Demus DOES NOT use:

- Spotify Web API
- YouTube Data API

Instead:

```txt
Spotify → spotify-url-info (public embed scraping)
YouTube → yt-search (HTML scraping)
```

---

## 2. Zero Server Bandwidth

The server NEVER streams audio.

```txt
Server → extracts audio URL
Client → streams directly from YouTube CDN
```

---

## 3. Cache-First System

MongoDB acts as a **global memory layer**.

```txt
If a track is matched once → never search again
```

---

## 4. Serialized External Calls

All scraping is **strictly controlled**:

```txt
ONLY worker processes can call yt-search
```

---

# System Architecture

## High-Level Flow

```txt
User → Import Playlist
        ↓
Spotify Scraper
        ↓
MongoDB (Tracks)
        ↓
Redis Queue
        ↓
Worker (yt-search)
        ↓
MongoDB (youtubeVideoId)
        ↓
Playback (Client)
```

---

# 1. Spotify Data Ingestion

### Tool

```txt
spotify-url-info
```

### Method

- Fetch Spotify embed page:

```txt
https://open.spotify.com/embed/playlist/{id}
```

- Extract JSON from hydration script

### Extracted Data

```txt
Track Name
Artist
Album
Duration
```

### Constraints

```txt
No OAuth
No API keys
Public playlists only
```

---

# 2. YouTube Matching System

### Tool

```txt
yt-search
```

### Query Format

```txt
"${trackName} ${artist} official audio"
```

---

### Scoring Algorithm

**Positive signals:**

- duration match ±15s
- "official audio"
- "topic channel"
- VEVO / official channels

**Negative signals:**

- cover
- remix
- live
- karaoke

---

### Output

```txt
youtubeVideoId
```

Stored in MongoDB.

---

# 3. MongoDB (Global Cache Layer)

## Track Model

```txt
spotifyId
name
artists[]
duration
youtubeVideoId
fingerprint
audioUrl (optional cache)
audioExpiresAt
```

---

## Fingerprint System

```txt
generateFingerprint(name + artists)
```

Used for:

- deduplication
- reuse across playlists
- future audio reuse optimization

---

## Golden Rule

```txt
NEVER call yt-search if youtubeVideoId exists
```

---

# 4. Redis System

Redis is used for **3 critical systems**:

---

## A. Matching Queue

```txt
demus:ytmatch:queue
```

- stores matching jobs
- consumed by worker

---

## B. Audio URL Cache

```txt
demus:audio-url:<videoId>
```

- stores extracted CDN URLs
- TTL ≈ 2 hours

---

## C. Extraction Lock

```txt
demus:audio-lock:<videoId>
```

Prevents:

```txt
multiple extraction calls
CPU spikes
```

---

# 5. Worker System

## ytMatchWorker

### Responsibilities:

```txt
pop job from Redis
wait 1–5s
run yt-search
update Track.youtubeVideoId
```

---

## chartsWorker

- seeds popular playlists

---

## artistCrawler

- expands graph via albums

---

## Rule

```txt
API MUST NOT call yt-search directly
```

---

# 6. Audio Extraction System (Mobile Playback)

### Tool

```txt
youtubei.js (InnerTube)
```

---

### Flow

```txt
Client → /api/audio-url/{videoId}
        ↓
Redis cache
        ↓
MongoDB cache
        ↓
youtubei.js extraction
```

---

### Output

```json
{
  "audioUrl": "...",
  "expiresAt": timestamp
}
```

---

### Important Constraints

```txt
Server NEVER streams audio
Server ONLY returns URL
```

---

# 7. Hybrid Playback Architecture

## Desktop

```txt
YouTube IFrame
```

- zero cost
- no extraction

---

## Mobile / PWA

```txt
HTML5 <audio>
```

- uses extracted CDN URL
- supports background playback

---

## Fallback

```txt
audio fails → fallback to iframe
```

---

# 8. iOS Background Playback System

## Critical Requirements

iOS requires:

```txt
audio.play() inside user gesture
continuous audio activity
no async gap before play()
```

---

## Implemented Strategy

```txt
User tap
↓
audio.src = SILENT_MP3
↓
audio.loop = true
↓
audio.play()
↓
fetch audio URL
↓
audio.loop = false
↓
audio.src = streamUrl
↓
audio.load()
↓
audio.play()
```

---

## Additional Components

- AudioContext keep-alive (oscillator)
- MediaSession API
- visibility recovery
- pageshow handling

---

# 9. Playback Control System

Controls must route based on:

```txt
activePlayer = "audio" | "youtube"
```

---

## Unified Controls

```txt
play / pause
seek
volume
next / previous
```

---

# 10. Rate Limiting

Applied to:

```txt
/import-playlist
/youtube-match
```

---

## Current System

```txt
in-memory limiter
(optional Redis-based)
```

---

# 11. System Constraints (DO NOT BREAK)

1.

```txt
Do NOT use YouTube Data API
```

2.

```txt
Do NOT proxy audio
```

3.

```txt
Do NOT bypass Redis queue
```

4.

```txt
Do NOT search YouTube if cached
```

5.

```txt
Do NOT create multiple YT players
```

6.

```txt
Do NOT break fingerprint system
```

---

# 12. Known Limitations

## 1. Slow Imports

```txt
100 tracks → ~5–8 minutes
```

(due to queue serialization)

---

## 2. Scraping Fragility

- Spotify DOM may change
- YouTube DOM may change

---

## 3. IP Reputation

- shared VPS IPs may get blocked

---

## 4. Audio URL Expiry

```txt
~6 hours validity
```

must refresh

---

# 13. Scaling Strategy

## Current Model

```txt
Cache everything
Avoid duplicate work
Serialize scraping
```

---

## Future Optimizations

- fingerprint-based audio cache
- pre-extraction worker
- distributed queue
- global semaphore

---

# 14. Mental Model for Copilot / AI

Before ANY change:

Ask:

```txt
Does this increase cost?
Does this bypass cache?
Does this break zero-bandwidth rule?
Does this increase yt-search calls?
```

---

# 15. Final System Identity

Demus is:

```txt
A zero-cost, scrape-powered, cache-first streaming engine
```

Core principle:

```txt
Extract once → reuse forever
```

---

# END OF DOCUMENT
