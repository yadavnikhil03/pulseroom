import axios from 'axios';

const REQUEST_TIMEOUT = 8000;

export default {
  getRooms: () => axios.get('/api/rooms', { timeout: REQUEST_TIMEOUT }),
  createRoom: (roomId, collectionId, options = {}) => axios.post('/api/rooms', {
    room_id: roomId,
    collectionId,
    title: options.title,
    trackIds: options.trackIds
  }, { timeout: REQUEST_TIMEOUT }),
  searchTracks: query => axios.get(`/api/audius/search?q=${encodeURIComponent(query)}`, { timeout: 5000 }),
  getTracks: roomId => axios.get(`/api/rooms/${roomId}`, { timeout: REQUEST_TIMEOUT }),
  updatePlayback: (roomId, isPlaying, positionMs) => axios.put(
    `/api/rooms/${roomId}/playback`,
    { isPlaying, positionMs },
    { timeout: REQUEST_TIMEOUT }
  ),
  switchTrack: (roomId, trackId, isPlaying = true) => axios.put(
    `/api/rooms/${roomId}/select`,
    { trackId, isPlaying },
    { timeout: REQUEST_TIMEOUT }
  ),
  advanceTrack: roomId => axios.put(`/api/rooms/${roomId}/advance`, null, { timeout: REQUEST_TIMEOUT }),
  updateTrack: (roomId, trackId, type, user) => {
    const url = user
      ? `/api/rooms/${roomId}/track/${trackId}/${type}?user=${user}`
      : `/api/rooms/${roomId}/track/${trackId}/${type}`;
    return axios.put(url);
  },
  updateNowPlaying: (roomId, trackId) => axios.put(
    `/api/rooms/${roomId}/playing/${trackId}`
  ),
  updateSongProgress: (roomId, trackId, progress) => axios.put(
    `/api/rooms/${roomId}/progress/${trackId}/${progress}`
  ),
  addTrack: (roomId, trackOrId, trackInfo) => {
    const isTrackObject = trackOrId && typeof trackOrId === 'object';
    return axios.put(`/api/rooms/${roomId}`, isTrackObject
      ? { spotifyId: trackOrId.id, track: trackOrId }
      : { spotifyId: trackOrId, info: trackInfo });
  }
};
