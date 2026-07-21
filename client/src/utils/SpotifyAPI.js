import axios from 'axios';
import { apiURL } from '../App.config';

/**
 * Spotify API wrapper.
 * All calls are proxied through the backend to avoid CORS issues.
 * The backend reads the Spotify session cookie and attaches the Bearer token server-side.
 */
const spotify = axios.create({ baseURL: `${apiURL}/api/spotify/proxy` });

// No token interceptor needed — the backend recognises the session cookie.

const withRefresh = async request => {
  try {
    return await request();
  } catch (error) {
    if (error.response?.status !== 401) throw error;
    // If the backend tells us the Spotify session expired, redirect to login
    if (error.response?.data?.error === 'spotify_not_connected') {
      window.location.href = `${apiURL}/api/spotify/login`;
      return Promise.reject(error);
    }
    return request();
  }
};

const normalizeTrack = track => {
  if (!track?.id) return null;
  return {
    id: track.id,
    name: track.name || 'Untitled Track',
    artists: track.artists?.map(a => a.name) || [],
    duration_ms: track.duration_ms || 0,
    image: track.album?.images?.[0]?.url || '/images/icons/pulseroom-logo.svg',
    uri: track.uri,
    source: 'spotify'
  };
};

const api = {
  getUserData: () => withRefresh(() => spotify.get('/me')),
  getUserPlaylists: (limit = 20) => withRefresh(() => spotify.get('/me/playlists', { params: { limit } })),
  getUserQueueData: () => withRefresh(() => spotify.get('/me/player')),
  getDevices: () => withRefresh(() => spotify.get('/me/player/devices')),
  addTrackToQueue: trackId => withRefresh(() => spotify.post('/me/player/queue', null, { params: { uri: `spotify:track:${trackId}` } })),
  playTrack: (trackId, positionMs = 0, deviceId) => withRefresh(() => spotify.put('/me/player/play', { uris: [`spotify:track:${trackId}`], position_ms: Math.max(0, Math.floor(positionMs)) }, deviceId ? { params: { device_id: deviceId } } : undefined)),
  playPausePlayback: action => withRefresh(() => spotify.put(`/me/player/${action}`)),
  nextPlaybackTrack: () => withRefresh(() => spotify.post('/me/player/next')),
  seekPlayback: positionMs => withRefresh(() => spotify.put('/me/player/seek', null, { params: { position_ms: Math.max(0, Math.floor(positionMs)) } })),
  trackSearch: query => withRefresh(() => spotify.get('/search', { params: { q: query, type: 'track', limit: 20 } })),
  getPlaylistTracks: (playlistId, limit = 100) => withRefresh(() => spotify.get(`/playlists/${playlistId}/tracks`, { params: { limit } })),
  normalizeTrack
};

export default api;
