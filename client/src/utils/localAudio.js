const cover = '/images/icons/pulseroom-logo.svg';

const tracks = [
  ['track_01', '10 Galaxies (Between Us)', 'Colyer, Steven Mark Colyer', 225000, 'ambient', '/audio/10-galaxies.m4a'],
  ['track_02', 'CONFESS YOUR LOVE FUNK', 'Unknown Artist', 80000, 'electronic', '/audio/confess-your-love-funk.m4a'],
  ['track_03', 'Drive You Insane', 'Unknown Artist', 214000, 'electronic', '/audio/drive-you-insane.m4a'],
  ['track_04', 'GOTOU寄生獣 - LOCKJAW', 'GOTOU', 165000, 'electronic', '/audio/lockjaw.mp3'],
  ['track_05', 'Killshot', 'Unknown Artist', 239000, 'electronic', '/audio/killshot.m4a'],
  ['track_06', 'No Lie (feat. Dua Lipa)', 'Sean Paul', 221000, 'world', '/audio/no-lie.m4a'],
  ['track_07', 'People', 'Unknown Artist', 187000, 'world', '/audio/people.m4a'],
  ['track_08', 'Purple Sun', 'Cannons', 244000, 'ambient', '/audio/purple-sun.mp3'],
  ['track_09', 'Subha Hone Na De', 'Unknown Artist', 292000, 'world', '/audio/subha-hone-na-de.m4a'],
  ['track_10', 'TOKYO_DRIFT_FAST_FURIOUS', 'Teriyaki Boyz', 258000, 'electronic', '/audio/tokyo-drift.m4a'],
  ['track_11', 'Take You Dancing', 'Unknown Artist', 192000, 'electronic', '/audio/take-you-dancing.m4a'],
  ['track_12', 'Udi', 'Aneesh Sarkar, Hruday Poojari', 215000, 'world', '/audio/udi.m4a'],
  ['track_13', 'Vibe', 'Unknown Artist', 195000, 'electronic', '/audio/vibe.m4a'],
  ['track_14', 'YOU HAUNT ME', 'CITIZEN', 218000, 'ambient', '/audio/you-haunt-me.m4a'],
  ['track_15', 'feel nothing', 'sufr, jaiyash, junedeath', 249000, 'ambient', '/audio/feel-nothing.m4a']
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

const load = async (track, positionMs = 0) => {
  if (!audio) throw new Error('Audio is unavailable in this browser.');
  if (!track || !track.id) throw new Error('A valid track must be provided.');
  const trackUrl = String(track.url || '').startsWith('/')
    ? track.url
    : tracks.find(item => item.id === track.id)?.url;
  if (!trackUrl) throw new Error('This track is not available in the local or remote catalogue.');

  if (currentTrackId !== track.id) {
    audio.pause();
    currentTrackId = track.id;
    audio.src = trackUrl;
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
