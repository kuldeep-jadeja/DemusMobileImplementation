import { Innertube } from 'youtubei.js';
import { getRedis } from '@/lib/redis';

const CACHE_TTL_SECONDS = 2 * 60 * 60; // 2 hours (YouTube URLs expire ~6h, cache for 2h to be safe)
const isDev = process.env.NODE_ENV !== 'production';

function log(msg) {
    if (isDev) console.log(`[audio-url] ${msg}`);
}

/**
 * GET /api/audio-url/[videoId]
 * 
 * Extracts the direct audio stream URL from YouTube using youtubei.js (InnerTube).
 * Returns the CDN URL that mobile clients can stream directly.
 * 
 * Redis caching layer (TTL = 2h):
 *   key: demus:audio-url:<videoId>
 *   
 * CRITICAL: YouTube URLs expire after ~6 hours. Mobile clients MUST check
 * expiresAt before playback and refetch if expired.
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { videoId } = req.query;

    if (!videoId || typeof videoId !== 'string' || videoId.trim() === '') {
        return res.status(400).json({ error: 'Missing or invalid videoId' });
    }

    const cacheKey = `demus:audio-url:${videoId}`;

    // ------------------------------------------------------------------
    // 1. Check Redis cache first
    // ------------------------------------------------------------------
    let redis = null;
    try {
        redis = await getRedis();
        if (redis) {
            const cached = await redis.get(cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                
                // Check if cached URL is still valid (not expired)
                if (data.expiresAt && data.expiresAt > Date.now()) {
                    log(`Redis cache HIT for ${videoId} (expires in ${Math.round((data.expiresAt - Date.now()) / 1000 / 60)}m)`);
                    res.setHeader('X-Cache', 'HIT');
                    return res.status(200).json(data);
                } else {
                    log(`Redis cache EXPIRED for ${videoId} - will re-extract`);
                    // Delete expired cache
                    await redis.del(cacheKey);
                }
            } else {
                log(`Redis cache MISS for ${videoId}`);
            }
        }
    } catch (redisErr) {
        if (isDev) console.error('[audio-url] Redis read error:', redisErr.message);
        redis = null;
    }

    // ------------------------------------------------------------------
    // 2. Extract audio URL using youtubei.js
    // ------------------------------------------------------------------
    try {
        log(`Extracting audio URL for ${videoId}...`);
        
        const youtube = await Innertube.create({
            lang: 'en',
            location: 'US',
        });

        const info = await youtube.getInfo(videoId);

        if (!info.streaming_data) {
            log(`No streaming data available for ${videoId}`);
            return res.status(404).json({
                error: 'No streaming data available for this video',
                videoId,
            });
        }

        // Find best audio-only format
        // Priority: OPUS > M4A (AAC) > other audio formats
        const audioFormats = info.streaming_data.adaptive_formats?.filter(
            fmt => fmt.has_audio && !fmt.has_video
        ) || [];

        if (audioFormats.length === 0) {
            log(`No audio-only formats found for ${videoId}`);
            return res.status(404).json({
                error: 'No audio format available for this video',
                videoId,
            });
        }

        // Sort by audio quality (bitrate) descending
        audioFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

        const bestAudioFormat = audioFormats[0];

        // Debug: Log format object structure
        log(`Format object keys: ${Object.keys(bestAudioFormat).join(', ')}`);
        log(`URL type: ${typeof bestAudioFormat.url}`);
        log(`Has decipher: ${typeof bestAudioFormat.decipher}`);
        
        // Get the URL - newer versions of youtubei.js return URL objects
        let audioUrl;
        
        if (typeof bestAudioFormat.url === 'string') {
            // URL is already a string
            audioUrl = bestAudioFormat.url;
            log(`Using direct URL string`);
        } else if (bestAudioFormat.url && typeof bestAudioFormat.url === 'object') {
            log(`URL is object, attempting decipher...`);
            // URL is an object, need to decipher
            try {
                audioUrl = bestAudioFormat.decipher(youtube.session.player);
                log(`Decipher result type: ${typeof audioUrl}`);
            } catch (err) {
                log(`Decipher error: ${err.message}`);
                // Decipher failed, try accessing url property directly
                audioUrl = bestAudioFormat.url.toString();
            }
        } else {
            log(`No URL available for ${videoId}`);
            return res.status(500).json({
                error: 'No audio URL available',
                videoId,
            });
        }

        if (!audioUrl || typeof audioUrl !== 'string' || audioUrl.length === 0) {
            log(`Invalid audio URL for ${videoId}: ${typeof audioUrl}`);
            return res.status(500).json({
                error: 'Invalid audio URL',
                videoId,
            });
        }

        // YouTube URLs expire after ~6 hours
        // Set our expiry to 2 hours to be conservative
        const expiresAt = Date.now() + (2 * 60 * 60 * 1000);

        const payload = {
            audioUrl: audioUrl,
            expiresAt,
            videoId,
            format: bestAudioFormat.mime_type?.split(';')[0] || 'audio/webm',
            bitrate: bestAudioFormat.bitrate,
            contentLength: bestAudioFormat.content_length,
        };

        log(`✅ Extracted audio URL for ${videoId} (${bestAudioFormat.mime_type}, ${Math.round((bestAudioFormat.bitrate || 0) / 1000)}kbps)`);

        // ------------------------------------------------------------------
        // 3. Cache in Redis (best-effort)
        // ------------------------------------------------------------------
        try {
            if (redis) {
                await redis.set(
                    cacheKey,
                    JSON.stringify(payload),
                    'EX',
                    CACHE_TTL_SECONDS
                );
                log(`Cached audio URL for ${videoId} (TTL: ${CACHE_TTL_SECONDS}s)`);
            }
        } catch (redisErr) {
            if (isDev) console.error('[audio-url] Redis write error:', redisErr.message);
        }

        res.setHeader('X-Cache', 'MISS');
        return res.status(200).json(payload);

    } catch (err) {
        console.error(`[audio-url] Extraction failed for ${videoId}:`, err);
        
        // Handle specific YouTube errors
        if (err.message?.includes('Video unavailable')) {
            return res.status(404).json({
                error: 'Video unavailable or private',
                videoId,
            });
        }

        if (err.message?.includes('age-restricted')) {
            return res.status(403).json({
                error: 'Video is age-restricted',
                videoId,
            });
        }

        return res.status(500).json({
            error: 'Failed to extract audio URL',
            message: isDev ? err.message : 'Internal server error',
            videoId,
        });
    }
}
