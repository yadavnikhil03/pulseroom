import axios from 'axios';
import SpotifyAPI from './SpotifyAPI';
import { apiURL } from '../App.config';

const REQUEST_TIMEOUT = 8000;
const roomsURL = `${apiURL}/api/rooms`;
const requestConfig = { timeout: REQUEST_TIMEOUT, withCredentials: true };

export default {
  getRooms: () => axios.get(roomsURL, requestConfig),
  createRoom: (roomId, collectionId, options = {}) => axios.post(roomsURL, {
    room_id: roomId,
    collectionId,
    title: options.title,
    trackIds: options.trackIds,
    tracks: options.tracks
  }, requestConfig),
  searchTracks: query => SpotifyAPI.trackSearch(query).then(({ data }) => ({ data: { results: (data.tracks?.items || []).map(SpotifyAPI.normalizeTrack) } })),
  getTracks: roomId => axios.get(`${roomsURL}/${encodeURIComponent(roomId)}`, requestConfig),
  updatePlayback: (roomId, isPlaying, positionMs) => axios.put(`${roomsURL}/${encodeURIComponent(roomId)}/playback`, { isPlaying, positionMs }, requestConfig),
  switchTrack: (roomId, trackId, isPlaying = true) => axios.put(`${roomsURL}/${encodeURIComponent(roomId)}/select`, { trackId, isPlaying }, requestConfig),
  advanceTrack: roomId => axios.put(`${roomsURL}/${encodeURIComponent(roomId)}/advance`, null, requestConfig),
  updateTrack: (roomId, trackId, type, user) => axios.put(user ? `${roomsURL}/${encodeURIComponent(roomId)}/track/${encodeURIComponent(trackId)}/${type}?user=${encodeURIComponent(user)}` : `${roomsURL}/${encodeURIComponent(roomId)}/track/${encodeURIComponent(trackId)}/${type}`, null, requestConfig),
  updateNowPlaying: (roomId, trackId) => axios.put(`${roomsURL}/${encodeURIComponent(roomId)}/playing/${encodeURIComponent(trackId)}`, null, requestConfig),
  updateSongProgress: (roomId, trackId, progress) => axios.put(`${roomsURL}/${encodeURIComponent(roomId)}/progress/${encodeURIComponent(trackId)}/${progress}`, null, requestConfig),
  addTrack: (roomId, trackOrId, trackInfo) => {
    const isTrackObject = trackOrId && typeof trackOrId === 'object';
    const body = isTrackObject
      ? { spotifyId: trackOrId.id, info: `${trackOrId.name} - ${trackOrId.artists?.[0] || ''}`, metadata: trackOrId }
      : { spotifyId: trackOrId, info: trackInfo };
    return axios.put(`${roomsURL}/${encodeURIComponent(roomId)}`, body, requestConfig);
  }
};
