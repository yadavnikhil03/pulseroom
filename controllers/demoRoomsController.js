const { collection, findTrack, tracks } = require('./demoCatalogue');

const rooms = new Map();
let trackSequence = 0;

const clone = value => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();

const ensureRoom = (roomId, res) => {
  const room = rooms.get(roomId);
  if (!room) {
    res.status(404).json({ message: `Room ${roomId} was not found` });
    return null;
  }
  return room;
};

const toQueueTrack = track => ({
  _id: `demo-track-${++trackSequence}`,
  info: `${track.name} - ${track.artists[0]}`,
  spotifyId: track.id,
  metadata: clone(track),
  played: false,
  progress: 0,
  nowPlaying: false,
  likes: []
});

const normalizeAudiusTrack = input => {
  if (!input || input.source !== 'audius') return null;
  const id = String(input.id || input.spotifyId || '');
  const sourceId = String(input.sourceId || id.replace(/^audius_/, ''));
  const url = String(input.url || '');
  const artists = Array.isArray(input.artists) ? input.artists : [];
  if (!/^audius_[A-Za-z0-9_-]{1,100}$/.test(id)
    || !/^[A-Za-z0-9_-]{1,100}$/.test(sourceId)
    || url !== `/api/audius/tracks/${encodeURIComponent(sourceId)}/stream`
    || !String(input.name || '').trim()
    || !String(artists[0] || '').trim()) return null;

  return {
    id,
    sourceId,
    name: String(input.name).trim().slice(0, 160),
    artists: [String(artists[0]).trim().slice(0, 120)],
    duration_ms: Math.min(24 * 60 * 60 * 1000, Math.max(1000, Number(input.duration_ms) || 1000)),
    genre: String(input.genre || 'Audius').trim().slice(0, 60),
    image: String(input.image || '/images/icons/pulseroom-logo.svg').slice(0, 500),
    imageMirrors: Array.isArray(input.imageMirrors) ? input.imageMirrors.slice(0, 3).map(String) : [],
    source: 'audius',
    url
  };
};

const metadataFor = (room, trackId) => findTrack(trackId)
  || room.addedTracks.find(track => track.spotifyId === trackId)?.metadata
  || null;

const snapshot = room => {
  const result = clone(room);
  if (result.playback.isPlaying) {
    result.playback.positionMs += Math.max(0, Date.now() - new Date(result.playback.updatedAt).getTime());
  }
  return result;
};

const selectTrack = (room, trackId, positionMs = 0) => {
  const selected = room.addedTracks.find(track => track.spotifyId === trackId);
  if (!selected) return false;
  room.currentTrackId = selected.spotifyId;
  room.addedTracks.forEach(track => { track.nowPlaying = track === selected; });
  room.playback = { isPlaying: false, positionMs, updatedAt: now() };
  return true;
};

module.exports = {
  findAll: (req, res) => res.json(clone([...rooms.values()].map(snapshot))),

  findByName: (req, res) => {
    const room = ensureRoom(req.params.id, res);
    if (room) res.json(snapshot(room));
  },

  create: (req, res) => {
    const roomId = String(req.body.room_id || '').trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,20}$/.test(roomId)) {
      return res.status(400).json({ message: 'Room ID must be 3–20 letters, numbers, dashes, or underscores.' });
    }
    if (rooms.has(roomId)) return res.status(409).json({ message: `Room ${roomId} already exists.` });

    const collectionId = req.body.collectionId || 'electronic';
    const requestedIds = Array.isArray(req.body.trackIds) ? req.body.trackIds : [];
    const explicitTracks = requestedIds.map(findTrack).filter(Boolean);
    const sourceTracks = explicitTracks.length ? explicitTracks : collection(collectionId);
    const fallbackTracks = sourceTracks.length ? sourceTracks : tracks.slice(0, 2);
    const seededTracks = fallbackTracks.map(toQueueTrack);
    const room = {
      _id: `demo-room-${roomId}`,
      room_id: roomId,
      title: String(req.body.title || '').trim().slice(0, 48) || `${collectionId} room`,
      collectionId,
      createdAt: now(),
      currentTrackId: seededTracks[0]?.spotifyId || null,
      playback: { isPlaying: false, positionMs: 0, updatedAt: now() },
      addedTracks: seededTracks
    };
    if (seededTracks[0]) seededTracks[0].nowPlaying = true;
    rooms.set(roomId, room);
    return res.status(201).json(snapshot(room));
  },

  addTrack: (req, res) => {
    const room = ensureRoom(req.params.id, res);
    if (!room) return;
    const metadata = findTrack(req.body.spotifyId) || normalizeAudiusTrack(req.body.track);
    if (!metadata || metadata.id !== String(req.body.spotifyId || metadata.id)) {
      return res.status(400).json({ message: 'Track metadata is invalid or unsupported.' });
    }
    if (room.addedTracks.some(item => item.spotifyId === metadata.id && !item.played)) {
      return res.status(409).json({ message: `${metadata.name} is already in the upcoming queue.` });
    }
    const queueTrack = toQueueTrack(metadata);
    room.addedTracks.push(queueTrack);
    if (!room.currentTrackId) selectTrack(room, metadata.id);
    return res.json(snapshot(room));
  },

  updatePlayback: (req, res) => {
    const room = ensureRoom(req.params.id, res);
    if (!room) return;
    const current = snapshot(room).playback.positionMs;
    const requestedPosition = Number(req.body.positionMs);
    const duration = metadataFor(room, room.currentTrackId)?.duration_ms || Number.MAX_SAFE_INTEGER;
    room.playback.positionMs = Number.isFinite(requestedPosition)
      ? Math.min(duration, Math.max(0, requestedPosition))
      : Math.min(duration, current);
    room.playback.isPlaying = Boolean(req.body.isPlaying && room.currentTrackId);
    room.playback.updatedAt = now();
    return res.json(snapshot(room));
  },

  advance: (req, res) => {
    const room = ensureRoom(req.params.id, res);
    if (!room) return;
    const currentIndex = room.addedTracks.findIndex(track => track.spotifyId === room.currentTrackId);
    if (currentIndex >= 0) {
      room.addedTracks[currentIndex].played = true;
      room.addedTracks[currentIndex].nowPlaying = false;
    }
    const nextTrack = room.addedTracks.slice(currentIndex + 1).find(track => !track.played);
    if (!nextTrack) {
      room.currentTrackId = null;
      room.playback = { isPlaying: false, positionMs: 0, updatedAt: now() };
    } else {
      selectTrack(room, nextTrack.spotifyId);
      room.playback.isPlaying = true;
      room.playback.updatedAt = now();
    }
    return res.json(snapshot(room));
  },

  updateTrack: (req, res) => {
    const room = ensureRoom(req.params.roomId, res);
    if (!room) return;
    const track = room.addedTracks.find(item => item.spotifyId === req.params.trackId);
    if (!track) return res.status(404).json({ message: 'Track was not found' });
    switch (req.params.updateType) {
      case 'played': track.played = true; track.nowPlaying = false; break;
      case 'now_playing': selectTrack(room, track.spotifyId, track.progress); break;
      case 'like': if (req.query.user && !track.likes.includes(req.query.user)) track.likes.push(req.query.user); break;
      case 'unlike': track.likes = track.likes.filter(user => user !== req.query.user); break;
      default: return res.status(400).json({ message: 'Unknown update type' });
    }
    return res.json(snapshot(room));
  },

  updateNowPlaying: (req, res) => {
    const room = ensureRoom(req.params.roomId, res);
    if (!room) return;
    if (!selectTrack(room, req.params.trackId)) return res.status(404).json({ message: 'Track was not found' });
    return res.json(snapshot(room));
  },

  updateSongProgress: (req, res) => {
    const room = ensureRoom(req.params.roomId, res);
    if (!room) return;
    const track = room.addedTracks.find(item => item.spotifyId === req.params.trackId);
    if (!track) return res.status(404).json({ message: 'Track was not found' });
    track.progress = Number(req.params.progress) || 0;
    room.playback.positionMs = track.progress;
    room.playback.updatedAt = now();
    return res.json(snapshot(room));
  },

  remove: (req, res) => {
    const room = ensureRoom(req.params.id, res);
    if (!room) return;
    rooms.delete(req.params.id);
    return res.json(snapshot(room));
  }
};
