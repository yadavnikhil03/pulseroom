import axios from 'axios';
import spotifyAuth from './spotifyAuth';

const spotify = axios.create({ baseURL: 'https://api.spotify.com/v1' });

spotify.interceptors.request.use(async config => {
  const token = await spotifyAuth.getAccessToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const withRefresh = async request => {
  try {
    return await request();
  } catch (error) {
    if (error.response?.status !== 401) throw error;
    spotifyAuth.clearAccessToken();
    await spotifyAuth.getAccessToken();
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
