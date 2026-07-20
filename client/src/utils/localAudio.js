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

const audio = typeof window !== 'undefined' ? new Audio() : null;
let currentTrackId = null;
let timeUpdateListener = null;
let errorListener = null;

if (audio) audio.preload = 'metadata';

const clampTime = (timeMs, durationMs) => Math.min(
  Math.max(0, Number(timeMs) || 0),
  Math.max(0, Number(durationMs) || 0)
);

const waitForMetadata = () => new Promise((resolve, reject) => {
  if (!audio) return reject(new Error('Audio is unavailable in this browser.'));
  if (audio.readyState >= 1) return resolve();

  const loaded = () => {
    cleanup();
    resolve();
  };
  const failed = () => {
    cleanup();
    reject(new Error('The local audio file could not be loaded.'));
  };
  const cleanup = () => {
    audio.removeEventListener('loadedmetadata', loaded);
    audio.removeEventListener('error', failed);
  };

  audio.addEventListener('loadedmetadata', loaded, { once: true });
  audio.addEventListener('error', failed, { once: true });
});

const load = async (trackId, positionMs = 0) => {
  if (!audio) throw new Error('Audio is unavailable in this browser.');
  const track = tracks.find(item => item.id === trackId);
  if (!track) throw new Error('This track is not available in the local catalogue.');

  if (currentTrackId !== trackId) {
    audio.pause();
    currentTrackId = trackId;
    audio.src = track.url;
    audio.load();
  }

  await waitForMetadata();
  const durationMs = Number.isFinite(audio.duration) ? audio.duration * 1000 : track.duration_ms;
  audio.currentTime = clampTime(positionMs, Math.max(0, durationMs - 250)) / 1000;
  return track;
};

const pause = () => {
  if (audio) audio.pause();
};

const stop = () => {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  currentTrackId = null;
  audio.removeAttribute('src');
  audio.load();
};

const localAudio = {
  getCatalogue: () => tracks.map(track => ({ ...track, artists: [...track.artists] })),
  findById: id => tracks.find(track => track.id === id) || null,
  imageFor: genre => tracks.some(track => track.genre === genre)
    ? `/images/collections/${genre}.png`
    : cover,
  load,
  play: async (trackId, positionMs = 0) => {
    await load(trackId, positionMs);
    await audio.play();
    return true;
  },
  resume: async () => {
    if (!audio || !currentTrackId) throw new Error('Choose a track before playing.');
    await audio.play();
    return true;
  },
  pause,
  stop,
  seek: async timeMs => {
    if (!audio || !currentTrackId) return false;
    await waitForMetadata();
    const durationMs = Number.isFinite(audio.duration) ? audio.duration * 1000 : Number.MAX_SAFE_INTEGER;
    audio.currentTime = clampTime(timeMs, Math.max(0, durationMs - 250)) / 1000;
    return true;
  },
  setVolume: value => {
    if (audio) audio.volume = Math.max(0, Math.min(1, Number(value) || 0));
  },
  getState: () => ({
    trackId: currentTrackId,
    isPlaying: Boolean(audio && !audio.paused),
    positionMs: audio ? audio.currentTime * 1000 : 0,
    durationMs: audio && Number.isFinite(audio.duration) ? audio.duration * 1000 : 0
  }),
  onTimeUpdate: callback => {
    if (!audio) return;
    if (timeUpdateListener) audio.removeEventListener('timeupdate', timeUpdateListener);
    timeUpdateListener = typeof callback === 'function'
      ? () => callback(audio.currentTime * 1000, audio.duration * 1000)
      : null;
    if (timeUpdateListener) audio.addEventListener('timeupdate', timeUpdateListener);
  },
  onEnded: callback => {
    if (audio) audio.onended = typeof callback === 'function' ? callback : null;
  },
  onError: callback => {
    if (!audio) return;
    if (errorListener) audio.removeEventListener('error', errorListener);
    errorListener = typeof callback === 'function'
      ? () => callback(new Error('The local audio file could not be played.'))
      : null;
    if (errorListener) audio.addEventListener('error', errorListener);
  }
};

export default localAudio;
