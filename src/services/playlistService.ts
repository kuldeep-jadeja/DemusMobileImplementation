/**
 * Playlist Service - API client for playlist operations
 * Supports both mock mode (for testing) and real API mode
 */

import { Playlist, ApiTrack, PlaylistStatus } from '../types';

// Toggle between mock and real API
const MOCK_MODE = false;

// API Configuration
const API_BASE_URL = 'https://music.kuldeepjadeja.dev';

// Mock data for testing
const mockPlaylists: Playlist[] = [
  {
    id: 'mock-playlist-1',
    name: 'Today\'s Top Hits',
    description: 'The hottest tracks right now',
    coverImage: 'https://mosaic.scdn.co/300/ab67616d0000b273a91c10fe9472d9bd89802e5aab67616d0000b273c8b444df094279e70d0ed856ab67616d0000b273cdb645498cd3d8a4676a1ace',
    owner: 'Spotify',
    trackCount: 50,
    status: 'ready',
    importProgress: 100,
    spotifyPlaylistId: '37i9dQZF1DXcBWIGoYBM5M',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'mock-playlist-2',
    name: 'Chill Vibes',
    description: 'Relax and unwind with these chill tracks',
    coverImage: 'https://i.scdn.co/image/ab67706f00000003b0e1f5c5a0f9e9e0c9b9d9c1',
    owner: 'Spotify',
    trackCount: 30,
    status: 'ready',
    importProgress: 100,
    spotifyPlaylistId: '37i9dQZF1DX4WYpdgoIcn6',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'mock-playlist-3',
    name: 'Rock Classics',
    description: 'The greatest rock anthems of all time',
    coverImage: 'https://i.scdn.co/image/ab67706f00000003c8b444df094279e70d0ed856',
    owner: 'Demus',
    trackCount: 100,
    status: 'matching',
    importProgress: 65,
    spotifyPlaylistId: '37i9dQZF1DXcF6B6QPhFDv',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const mockTracks: Record<string, ApiTrack[]> = {
  'mock-playlist-1': [
    {
      id: 'track-1',
      spotifyId: '2takcwgKJHFWWbcHxeNvST',
      name: 'Blinding Lights',
      artists: ['The Weeknd'],
      album: 'After Hours',
      duration: 200040,
      youtubeVideoId: '4NRXx6U8ABQ',
      albumImage: 'https://i.scdn.co/image/ab67616d0000b273c8b444df094279e70d0ed856',
    },
    {
      id: 'track-2',
      spotifyId: '3takcwgKJHFWWbcHxeNvST',
      name: 'Levitating',
      artists: ['Dua Lipa', 'DaBaby'],
      album: 'Future Nostalgia',
      duration: 203960,
      youtubeVideoId: 'TUVcZfQe-Kw',
      albumImage: 'https://i.scdn.co/image/ab67616d0000b273a91c10fe9472d9bd89802e5a',
    },
    {
      id: 'track-3',
      spotifyId: '4takcwgKJHFWWbcHxeNvST',
      name: 'Save Your Tears',
      artists: ['The Weeknd'],
      album: 'After Hours',
      duration: 215626,
      youtubeVideoId: 'XXYlFuWEuKI',
      albumImage: 'https://i.scdn.co/image/ab67616d0000b273c8b444df094279e70d0ed856',
    },
    {
      id: 'track-4',
      spotifyId: '5takcwgKJHFWWbcHxeNvST',
      name: 'Good 4 U',
      artists: ['Olivia Rodrigo'],
      album: 'SOUR',
      duration: 178147,
      youtubeVideoId: 'gNi_6U5Pm_o',
      albumImage: 'https://i.scdn.co/image/ab67616d0000b273a91c10fe9472d9bd89802e5a',
    },
    {
      id: 'track-5',
      spotifyId: '6takcwgKJHFWWbcHxeNvST',
      name: 'Peaches',
      artists: ['Justin Bieber', 'Daniel Caesar', 'Giveon'],
      album: 'Justice',
      duration: 198000,
      youtubeVideoId: 'tQ0yjYUFKAE',
      albumImage: 'https://i.scdn.co/image/ab67616d0000b273cdb645498cd3d8a4676a1ace',
    },
  ],
  'mock-playlist-2': [
    {
      id: 'track-6',
      spotifyId: '7takcwgKJHFWWbcHxeNvST',
      name: 'Watermelon Sugar',
      artists: ['Harry Styles'],
      album: 'Fine Line',
      duration: 174000,
      youtubeVideoId: 'E07s5ZYygMg',
      albumImage: 'https://i.scdn.co/image/ab67616d0000b273adaf5005e0b6be14e1db7bec',
    },
    {
      id: 'track-7',
      spotifyId: '8takcwgKJHFWWbcHxeNvST',
      name: 'Circles',
      artists: ['Post Malone'],
      album: 'Hollywood\'s Bleeding',
      duration: 215280,
      youtubeVideoId: 'wXhTHyIgQ_U',
      albumImage: 'https://i.scdn.co/image/ab67616d0000b2739478c87599550dd73bfa7e02',
    },
    {
      id: 'track-8',
      spotifyId: '9takcwgKJHFWWbcHxeNvST',
      name: 'Sunflower',
      artists: ['Post Malone', 'Swae Lee'],
      album: 'Spider-Man: Into the Spider-Verse',
      duration: 158040,
      youtubeVideoId: 'ApXoWvfEYVU',
      albumImage: 'https://i.scdn.co/image/ab67616d0000b273e2e352d89826aef6dbd5ff8f',
    },
  ],
  'mock-playlist-3': [],
};

/**
 * Maps API response playlist to frontend Playlist type
 */
function mapApiPlaylistToPlaylist(apiPlaylist: any): Playlist {
  return {
    id: apiPlaylist._id || apiPlaylist.id,
    name: apiPlaylist.name,
    description: apiPlaylist.description,
    coverImage: apiPlaylist.coverImage,
    owner: apiPlaylist.owner,
    trackCount: apiPlaylist.trackCount,
    status: apiPlaylist.status,
    importProgress: apiPlaylist.importProgress,
    spotifyPlaylistId: apiPlaylist.spotifyPlaylistId,
    tracks: apiPlaylist.tracks?.map(mapApiTrackToApiTrack),
    retryAfter: apiPlaylist.retryAfter,
    errorMessage: apiPlaylist.errorMessage,
    createdAt: apiPlaylist.createdAt,
  };
}

/**
 * Maps API response track to ApiTrack type
 */
function mapApiTrackToApiTrack(apiTrack: any): ApiTrack {
  return {
    id: apiTrack._id || apiTrack.id,
    spotifyId: apiTrack.spotifyId,
    name: apiTrack.name,
    artists: apiTrack.artists,
    album: apiTrack.album,
    duration: apiTrack.duration,
    youtubeVideoId: apiTrack.youtubeVideoId,
    albumImage: apiTrack.albumImage,
    importedAt: apiTrack.importedAt,
  };
}

import { getAudioUrlSafe } from '../api/audio';

/**
 * Converts ApiTrack to playback Track format with real audio URL
 */
export async function convertApiTrackToTrack(apiTrack: ApiTrack): Promise<any> {
  // Fetch real audio stream URL from backend
  let audioUrl = '';
  if (apiTrack.youtubeVideoId) {
    const fetchedUrl = await getAudioUrlSafe(apiTrack.youtubeVideoId);
    audioUrl = fetchedUrl || '';
  }

  return {
    id: apiTrack.id,
    url: audioUrl, // Real stream URL from youtubei.js
    youtubeVideoId: apiTrack.youtubeVideoId, // Keep for reference
    title: apiTrack.name,
    artist: apiTrack.artists.join(', '),
    album: apiTrack.album,
    artwork: apiTrack.albumImage,
    duration: apiTrack.duration,
  };
}

/**
 * Fetches all playlists for the authenticated user
 */
export async function getPlaylists(): Promise<Playlist[]> {
  if (MOCK_MODE) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...mockPlaylists];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/playlists`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch playlists: ${response.status}`);
    }

    const data = await response.json();
    return data.playlists.map(mapApiPlaylistToPlaylist);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    throw error;
  }
}

/**
 * Imports a playlist from Spotify URL
 */
export async function importPlaylist(url: string): Promise<Playlist> {
  if (MOCK_MODE) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Validate URL format
    if (!url.includes('spotify.com/playlist/') && !url.startsWith('spotify:playlist:')) {
      throw new Error('Invalid Spotify playlist URL');
    }

    // Create a new mock playlist
    const newPlaylistId = `mock-playlist-${Date.now()}`;
    const newPlaylist: Playlist = {
      id: newPlaylistId,
      name: 'New Imported Playlist',
      description: 'Imported from Spotify',
      coverImage: 'https://i.scdn.co/image/ab67706f00000003b0e1f5c5a0f9e9e0c9b9d9c1',
      owner: 'You',
      trackCount: 25,
      status: 'imported',
      importProgress: 0,
      spotifyPlaylistId: url.split('/').pop()?.split('?')[0] || 'unknown',
      createdAt: new Date().toISOString(),
    };

    // Generate mock tracks for the new playlist
    mockTracks[newPlaylistId] = [
      {
        id: `${newPlaylistId}-track-1`,
        spotifyId: 'imported-track-1',
        name: 'Shape of You',
        artists: ['Ed Sheeran'],
        album: '÷ (Divide)',
        duration: 233713,
        youtubeVideoId: 'JGwWNGJdvx8',
        albumImage: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
      },
      {
        id: `${newPlaylistId}-track-2`,
        spotifyId: 'imported-track-2',
        name: 'Thinking Out Loud',
        artists: ['Ed Sheeran'],
        album: 'x (Deluxe Edition)',
        duration: 281560,
        youtubeVideoId: 'lp-EO5I60KA',
        albumImage: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
      },
      {
        id: `${newPlaylistId}-track-3`,
        spotifyId: 'imported-track-3',
        name: 'Perfect',
        artists: ['Ed Sheeran'],
        album: '÷ (Divide)',
        duration: 263400,
        youtubeVideoId: '2Vv-BfVoq4g',
        albumImage: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
      },
      {
        id: `${newPlaylistId}-track-4`,
        spotifyId: 'imported-track-4',
        name: 'Photograph',
        artists: ['Ed Sheeran'],
        album: 'x (Deluxe Edition)',
        duration: 258200,
        youtubeVideoId: 'nSDgHBxUbVQ',
        albumImage: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
      },
      {
        id: `${newPlaylistId}-track-5`,
        spotifyId: 'imported-track-5',
        name: 'Castle on the Hill',
        artists: ['Ed Sheeran'],
        album: '÷ (Divide)',
        duration: 261320,
        youtubeVideoId: 'K0ibBPhiaG0',
        albumImage: 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96',
      },
    ];

    mockPlaylists.unshift(newPlaylist);

    // Simulate background matching progress
    setTimeout(() => {
      newPlaylist.status = 'matching';
      newPlaylist.importProgress = 30;
    }, 2000);

    setTimeout(() => {
      newPlaylist.importProgress = 70;
    }, 4000);

    setTimeout(() => {
      newPlaylist.status = 'ready';
      newPlaylist.importProgress = 100;
      newPlaylist.trackCount = mockTracks[newPlaylistId].length; // Update to actual track count
    }, 6000);

    return newPlaylist;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/import-playlist`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to import playlist');
    }

    const data = await response.json();
    return mapApiPlaylistToPlaylist(data.playlist);
  } catch (error) {
    console.error('Error importing playlist:', error);
    throw error;
  }
}

/**
 * Fetches a single playlist with all tracks
 */
export async function getPlaylistById(id: string): Promise<Playlist> {
  if (MOCK_MODE) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 400));

    const playlist = mockPlaylists.find(p => p.id === id);
    if (!playlist) {
      throw new Error('Playlist not found');
    }

    // Return playlist with tracks
    const tracks = mockTracks[id] || [];
    return {
      ...playlist,
      tracks,
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/playlist/${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch playlist: ${response.status}`);
    }

    const data = await response.json();
    return mapApiPlaylistToPlaylist(data);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    throw error;
  }
}

/**
 * Fetches playlist status (lightweight for polling)
 */
export async function getPlaylistStatus(id: string): Promise<{ status: PlaylistStatus; importProgress: number }> {
  if (MOCK_MODE) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const playlist = mockPlaylists.find(p => p.id === id);
    if (!playlist) {
      throw new Error('Playlist not found');
    }

    return {
      status: playlist.status,
      importProgress: playlist.importProgress,
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/playlist/${id}/status`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch playlist status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching playlist status:', error);
    throw error;
  }
}
