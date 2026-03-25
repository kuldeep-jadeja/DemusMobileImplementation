# Audio URL Extraction - Implementation Guide

## Overview

Mobile app now supports native audio playback with proper URL expiry handling. The backend extracts YouTube audio URLs, caches them, and the mobile app automatically refetches expired URLs.

---

## 🎯 Backend Implementation

### 1. Install Dependencies

In your backend repository (`Pro-Music-App`):

```bash
npm install youtubei.js
```

### 2. Create API Endpoint

**File:** `pages/api/audio-url/[videoId].js`

Copy the code from `BACKEND_ENDPOINT_audio-url.js` (created in your mobile project folder) to your backend repository.

**Location in backend:**
```
Pro-Music-App/
└── pages/
    └── api/
        └── audio-url/
            └── [videoId].js  ← Create this file
```

### 3. Test the Endpoint

After deploying, test with:

```bash
# Replace with your backend URL
curl https://music.kuldeepjadeja.dev/api/audio-url/dQw4w9WgXcQ
```

**Expected response:**
```json
{
  "audioUrl": "https://rr4---sn-4g5ednee.googlevideo.com/...",
  "expiresAt": 1711234567890,
  "videoId": "dQw4w9WgXcQ",
  "format": "audio/webm",
  "bitrate": 128000,
  "contentLength": "4567890"
}
```

### 4. Redis Cache Keys

The endpoint uses:
- **Key:** `demus:audio-url:{videoId}`
- **TTL:** 7200 seconds (2 hours)
- **Format:** JSON string

Example:
```
demus:audio-url:dQw4w9WgXcQ → {"audioUrl":"https://...", "expiresAt":...}
```

---

## 📱 Mobile App (Already Implemented)

### Features Added

1. **Automatic Expiry Checking** ✅
   - Checks `expiresAt` before using cached URL
   - Auto-refetches if expired
   - Prevents "URL expired" playback failures

2. **In-Memory Caching** ✅
   - Reduces API calls
   - Faster playback start
   - Periodic cleanup every 30 minutes

3. **Error Handling** ✅
   - Gracefully handles extraction failures
   - Logs errors for debugging
   - Skips unplayable tracks

### Code Flow

```typescript
// Before playback
const audioUrl = await getAudioUrlSafe(youtubeVideoId);

// getAudioUrlSafe() internally does:
if (Date.now() > cached.expiresAt) {
  // Refetch from backend
  audioUrl = await getAudioUrl(videoId, forceRefresh: true);
}
```

### API Functions

```typescript
// Get audio URL with expiry check
getAudioUrlSafe(videoId: string): Promise<string | null>

// Force refresh (bypass cache)
getAudioUrl(videoId: string, forceRefresh: boolean): Promise<AudioUrlResponse>

// Cleanup expired URLs
clearExpiredAudioUrls(): void

// Clear all URLs (on logout)
clearAllAudioUrls(): void
```

---

## ⚡ Performance Optimization

### Caching Strategy

**3-Tier Cache:**
1. **Mobile In-Memory** (instant) - 2 hour TTL
2. **Backend Redis** (5-10ms) - 2 hour TTL  
3. **YouTube Extraction** (1-2s) - Fresh fetch

### Why 2-Hour TTL?

- YouTube URLs expire after **~6 hours**
- We use **2 hours** for safety margin
- Reduces failed playback attempts
- Backend re-extracts when needed

### Cache Cleanup

**Mobile App:**
- Runs every 30 minutes
- Clears expired URLs from memory
- Prevents memory leaks

**Backend:**
- Redis auto-expires after 2 hours
- No manual cleanup needed

---

## 🔧 Testing Checklist

### Backend Tests

```bash
# 1. Test valid video
curl https://YOUR_BACKEND/api/audio-url/dQw4w9WgXcQ

# Expected: 200 OK with audioUrl

# 2. Test invalid video
curl https://YOUR_BACKEND/api/audio-url/INVALID123

# Expected: 404 Not Found

# 3. Test cache hit (run same request twice)
curl https://YOUR_BACKEND/api/audio-url/dQw4w9WgXcQ
# First: X-Cache: MISS
# Second: X-Cache: HIT

# 4. Test URL playback (paste audioUrl in VLC/browser)
# Should play audio without errors
```

### Mobile App Tests

1. **Fresh URL Fetch**
   - Play song for first time
   - Check logs: "Fetching audio URL from backend"

2. **Cache Hit**
   - Play same song again immediately
   - Check logs: "Using cached audio URL"

3. **Expiry Handling**
   - Wait 2+ hours
   - Play song again
   - Check logs: "Cached URL expired, refetching"

4. **Network Failure**
   - Turn off WiFi
   - Try to play new song
   - Should show error, skip track

---

## 🐛 Troubleshooting

### Audio Not Playing

**Symptom:** Song shows in player but no audio

**Checks:**
1. Backend endpoint deployed? 
   ```bash
   curl https://YOUR_BACKEND/api/audio-url/TEST_VIDEO_ID
   ```
2. Mobile app using correct API URL?
   ```typescript
   // In .env or app.json
   EXPO_PUBLIC_API_URL=https://music.kuldeepjadeja.dev
   ```
3. Check mobile logs for errors:
   ```
   adb logcat | grep audio.ts
   ```

### "URL Expired" Errors

**Symptom:** Playback fails randomly after 2-6 hours

**Solution:** Already handled! The app auto-refetches. If you still see errors:
1. Check `expiresAt` is being set correctly
2. Verify Date.now() comparison logic
3. Clear app cache and reinstall

### Redis Connection Issues

**Symptom:** Backend logs show Redis errors

**Solution:** Endpoint still works without Redis (falls through to extraction). To fix Redis:
1. Check `REDIS_URL` in `.env`
2. Verify Redis server is running
3. Test connection: `redis-cli ping`

---

## 📊 Performance Metrics

### Expected Response Times

| Scenario | Time | Cache |
|----------|------|-------|
| Cache hit (mobile) | 0ms | Memory |
| Cache hit (backend) | 5-10ms | Redis |
| Fresh extraction | 1-2s | None |

### Mobile Bandwidth

- **Per song:** ~0.5-1 MB (for URL fetch)
- **Audio streaming:** Variable (handled by YouTube CDN)
- **Cache benefit:** 99% fewer extractions after first play

---

## 🔒 Security Notes

### URL Security

- URLs contain YouTube signature tokens
- Tokens expire after ~6 hours
- Cannot be reused after expiry
- Safe to cache (no PII)

### Rate Limiting

Consider adding rate limiting to prevent abuse:

```javascript
// In backend: pages/api/audio-url/[videoId].js
import rateLimit from '@/lib/rateLimit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export default async function handler(req, res) {
  try {
    await limiter.check(res, 20, 'AUDIO_URL_LIMIT'); // 20 requests per minute
  } catch {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  
  // ... rest of endpoint code
}
```

---

## 📝 Next Steps

1. **Deploy Backend Endpoint**
   - Copy `BACKEND_ENDPOINT_audio-url.js` to `pages/api/audio-url/[videoId].js`
   - Install `youtubei.js`
   - Deploy to production

2. **Rebuild Mobile APK**
   - Mobile code already updated
   - Build new release APK
   - Test on device

3. **Monitor Performance**
   - Check Redis hit rate
   - Monitor extraction failures
   - Track expired URL refetches

4. **Future Enhancements**
   - Pre-warm cache for playlists
   - Background URL refresh before expiry
   - Quality selection (high/medium/low bitrate)

---

## 🎉 Success Criteria

✅ Songs play on mobile device
✅ No "URL expired" errors
✅ Cache hit rate > 80%
✅ Playback starts within 1 second
✅ Background audio works
✅ Notification controls functional

---

**Created:** 2026-03-25
**Status:** Ready for backend deployment
