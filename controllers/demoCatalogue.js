const cover = '/images/icons/pulseroom-logo.svg';

const tracks = [
  ['demo_track_01', 'Global Pulse', 'SoundHelix Demo Library', 372000, 'electronic', '/audio/demo-track-1.mp3'],
  ['demo_track_02', 'Night Transit', 'SoundHelix Demo Library', 425000, 'electronic', '/audio/demo-track-2.mp3'],
  ['demo_track_03', 'Open Horizons', 'SoundHelix Demo Library', 343000, 'ambient', '/audio/demo-track-3.mp3'],
  ['demo_track_04', 'Tokyo Afterglow', 'Pulseroom Demo Edit', 372000, 'world', '/audio/demo-track-1.mp3'],
  ['demo_track_05', 'Sahara Drive', 'Pulseroom Demo Edit', 425000, 'world', '/audio/demo-track-2.mp3'],
  ['demo_track_06', 'Rio Sunrise', 'Pulseroom Demo Edit', 343000, 'world', '/audio/demo-track-3.mp3'],
  ['demo_track_07', 'Berlin Current', 'Pulseroom Demo Edit', 372000, 'electronic', '/audio/demo-track-1.mp3'],
  ['demo_track_08', 'Mumbai Monsoon', 'Pulseroom Demo Edit', 425000, 'ambient', '/audio/demo-track-2.mp3'],
  ['demo_track_09', 'Nordic Skies', 'Pulseroom Demo Edit', 343000, 'ambient', '/audio/demo-track-3.mp3']
].map(([id, name, artist, duration_ms, genre, url]) => ({
  id,
  name,
  artists: [artist],
  duration_ms,
  genre,
  url,
  image: cover
}));

module.exports = {
  tracks,
  findTrack: id => tracks.find(track => track.id === id),
  collection: id => tracks.filter(track => track.genre === id)
};
