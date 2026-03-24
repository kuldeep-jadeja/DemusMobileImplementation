# Backend Audio URL Endpoint Required

## Overview

The mobile app now calls `/api/audio-url/{videoId}` to fetch real audio stream URLs before playback.

## Required Endpoint

### Route
```
GET /api/audio-url/[videoId]
```

### Implementation (Next.js API Route)

Create: `pages/api/audio-url/[videoId].js`

```javascript
import { InnerTube } from 'youtubei.js';
import redis from '../../../lib/redis'; // Your Redis client

export default async function handler(req, res) {
  const { videoId } = req.query;

  if (!videoId || typeof videoId !== 'string') {
    return res.status(400).json({ error: 'Invalid videoId' });
  }

  try {
    // Check Redis cache first
    const cacheKey = `demus:audio-url:${videoId}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      const data = JSON.parse(cached);
      // Check if not expired
      if (data.expiresAt > Date.now()) {
        console.log(`[audio-url] Cache HIT for ${videoId}`);
        return res.status(200).json(data);
      }
    }

    // Cache miss or expired - extract URL
    console.log(`[audio-url] Cache MISS for ${videoId} - extracting...`);
    
    const youtube = await InnerTube.create();
    const info = await youtube.getBasicInfo(videoId);
    
    // Get best audio format (usually OPUS or M4A)
    const audioFormat = info.streaming_data.adaptive_formats.find(
      fmt => fmt.has_audio && !fmt.has_video
    );
    
    if (!audioFormat || !audioFormat.url) {
      throw new Error('No audio format found');
    }

    const result = {
      audioUrl: audioFormat.url,
      expiresAt: Date.now() + (2 * 60 * 60 * 1000), // 2 hours
    };

    // Cache for 2 hours
    await redis.setex(cacheKey, 7200, JSON.stringify(result));

    return res.status(200).json(result);
    
  } catch (error) {
    console.error(`[audio-url] Failed to extract ${videoId}:`, error);
    return res.status(500).json({ 
      error: 'Failed to extract audio URL',
      message: error.message 
    });
  }
}
```

## Response Format

### Success (200)
```json
{
  "audioUrl": "https://rr4---sn-4g5ednee.googlevideo.com/...",
  "expiresAt": 1678901234567
}
```

### Error (500)
```json
{
  "error": "Failed to extract audio URL",
  "message": "Video unavailable"
}
```

## Redis Cache Keys

- **Key:** `demus:audio-url:{videoId}`
- **TTL:** 7200 seconds (2 hours)
- **Value:** JSON string of `{ audioUrl, expiresAt }`

## Performance Notes

- First request: ~1-2 seconds (YouTube extraction)
- Cached requests: ~5-10ms
- URLs expire after ~6 hours (YouTube's limit)
- Our cache expires after 2 hours to be safe

## Dependencies

```json
{
  "youtubei.js": "^10.0.0"
}
```

## Testing

```bash
curl http://localhost:4072/api/audio-url/dQw4w9WgXcQ
```

Should return a working audio URL that plays in VLC/mpv.

## Integration with Mobile

The mobile app (React Native) now:

1. Gets tracks with `youtubeVideoId` from playlists API
2. Calls `/api/audio-url/{youtubeVideoId}` for each track
3. Passes real `audioUrl` to `react-native-track-player`
4. Audio plays through native player with background support

## Fallback Behavior

If this endpoint returns 500:
- Mobile app will skip the track
- Shows error message to user
- Continues with next track in queue
