# Demus Mobile - REQUIREMENTS.md

## User Stories & Acceptance Criteria

### Authentication & Onboarding

**US-AUTH-001: User Registration**
- User can create account with email/password
- User can register with Google OAuth
- User can register with Apple Sign-In
- AC: Registration completes in <5 seconds, validates email format, enforces password strength

**US-AUTH-002: User Login**
- User can log in with email/password
- User can log in with OAuth providers
- Session persists across app restarts (up to 30 days)
- AC: Login completes in <3 seconds, handles auth failures gracefully

**US-AUTH-003: Password Management**
- User can reset password via email
- User can change password in settings
- Session invalidates on password change

### Music Playback

**US-PLAY-001: Play Individual Track**
- User can tap track to play
- Audio plays through device speakers or headphones
- Playback controls: play/pause, next, previous, seek
- AC: Audio starts playing within 1 second, seek is responsive

**US-PLAY-002: Queue Management**
- User can view current queue
- User can add tracks to queue
- User can remove tracks from queue
- User can reorder queue by dragging
- AC: Queue updates instantly, handles >1000 tracks

**US-PLAY-003: Playback Controls**
- Shuffle mode: randomize playback order
- Repeat: off, repeat all, repeat one
- Playback speed: 0.75x, 1.0x, 1.25x, 1.5x
- AC: All controls persist across app sessions

### Library Management

**US-LIB-001: View Music Library**
- User can view all downloaded/owned tracks
- User can filter by artist, album, genre
- User can search library
- AC: Shows 50 tracks per page with lazy loading

**US-LIB-002: Playlist Management**
- User can create new playlists
- User can add/remove tracks from playlists
- User can edit playlist metadata (name, description, cover)
- User can delete playlists
- AC: Playlist operations atomic, changes persist

**US-LIB-003: Favorites**
- User can mark tracks/albums/artists as favorites
- Favorites sync across devices
- User can access favorites in dedicated view
- AC: Favorite toggle completes in <500ms

### Discovery & Browse

**US-DISC-001: Browse Categories**
- User can browse music by genre
- User can browse curated playlists
- User can see trending content
- AC: Browse completes in <2 seconds with caching

**US-DISC-002: Search**
- User can search tracks by title, artist, album
- Search returns results in real-time
- User can filter search results
- AC: Search updates every keystroke, <300ms latency

**US-DISC-003: Recommendations**
- App shows personalized recommendations
- Recommendations based on listening history
- User can refresh recommendations
- AC: Recommendations update daily, show 20+ options

### Social Features

**US-SOC-001: Follow Users**
- User can search and follow other users
- User can view follower/following lists
- User can unfollow users
- AC: Follow action completes in <1 second

**US-SOC-002: Share Content**
- User can share tracks/playlists via deep links
- User can share to social media
- Shared content opens app with correct context
- AC: Deep links resolve within 2 seconds

**US-SOC-003: Social Feed**
- User can see activity from followed users
- User can like/comment on shared content
- Notifications for interactions
- AC: Feed updates in real-time with WebSocket

### Offline Functionality

**US-OFF-001: Offline Playback**
- User can download tracks for offline use
- Downloaded tracks play without network
- User can queue offline content
- AC: Download completes at max device speed, playback seamless

**US-OFF-002: Offline Library**
- Library accessible without network
- Search works on offline content
- Sync happens when network restored
- AC: Offline mode transparent to user

### Settings & Preferences

**US-SET-001: Audio Settings**
- User can adjust volume normalization
- User can set equalizer presets
- User can enable spatial audio (if supported)
- AC: Settings persist, take effect immediately

**US-SET-002: Playback Preferences**
- User can choose audio quality (128/256/320 kbps)
- User can enable/disable gapless playback
- User can set autoplay behavior
- AC: Quality setting syncs across devices

**US-SET-003: Notification Settings**
- User can enable/disable push notifications
- User can customize notification types
- User can set quiet hours
- AC: Settings respected in real-time

## Non-Functional Requirements

### Performance
- App launch: <2 seconds on mid-range device
- Music playback start: <1 second
- List scrolling: 60 FPS on iOS, 90 FPS on Android
- Search response: <300ms
- API response time: <1 second (p95)

### Reliability
- Crash rate: <0.5% across both platforms
- Uptime: 99.9% for core features
- Data sync: 99.99% accuracy
- Music streaming availability: 99.95%

### Security
- All API calls encrypted (TLS 1.3+)
- Passwords hashed with bcrypt (cost 12+)
- JWT tokens expire in 1 hour
- Refresh tokens in secure storage
- No sensitive data in logs

### Storage
- Min app size: iOS <150MB, Android <200MB
- Cache: 1GB max for downloaded tracks
- DB: <50MB local SQLite database

### Compatibility
- iOS 14.0+
- Android 9.0+ (API level 28+)
- Support for tablets and phones
- Landscape and portrait orientation support

### Accessibility
- WCAG 2.1 Level AA compliance
- VoiceOver/TalkBack support
- High contrast mode
- Text scaling support

## Data Models

### User
```
{
  id: UUID,
  email: string (unique),
  displayName: string,
  avatar: URL,
  preferences: UserPreferences,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Track
```
{
  id: UUID,
  title: string,
  artist: Artist,
  album: Album,
  genre: string,
  duration: number (ms),
  coverArt: URL,
  streamURL: URL,
  metadata: Metadata
}
```

### Playlist
```
{
  id: UUID,
  userId: UUID,
  name: string,
  description: string,
  coverArt: URL,
  tracks: Track[],
  isPublic: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## API Contract Summary

- **Authentication**: `/auth/register`, `/auth/login`, `/auth/refresh`
- **Tracks**: `GET /tracks/{id}`, `GET /tracks/search`, `GET /recommendations`
- **Playlists**: CRUD operations on `/playlists`
- **User**: `GET /user/profile`, `PUT /user/preferences`
- **Social**: `/users/{id}/follow`, `/feed`, `/users/{id}/playlists`
- **Streaming**: `GET /tracks/{id}/stream` with Range support

## Success Metrics

- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Session duration
- Crash-free users ratio
- Playback success rate
- Feature adoption rates
- User retention cohorts
