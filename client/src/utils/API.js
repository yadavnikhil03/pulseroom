import axios from 'axios';

export default {
  getRooms: () => axios.get('/api/rooms'),
  createRoom: (roomId, collectionId, options = {}) => axios.post('/api/rooms', {
    room_id: roomId,
    collectionId,
    title: options.title,
    trackIds: options.trackIds
  }),
  searchTracks: query => axios.get(`/api/audius/search?q=${encodeURIComponent(query)}`),
  getTracks: roomId => axios.get(`/api/rooms/${roomId}`),
  updatePlayback: (roomId, isPlaying, positionMs) => axios.put(
    `/api/rooms/${roomId}/playback`,
    { isPlaying, positionMs }
  ),
  advanceTrack: roomId => axios.put(`/api/rooms/${roomId}/advance`),
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
