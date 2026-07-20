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

module.exports = {
  tracks,
  findTrack: id => tracks.find(track => track.id === id),
  collection: id => tracks.filter(track => track.genre === id)
};
