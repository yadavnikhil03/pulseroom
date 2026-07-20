const cover = '/images/icons/pulseroom-logo.svg';

const tracks = [
  ['track_01', 'GOTOU寄生獣 - LOCKJAW', 'GOTOU', 165000, 'electronic', '/audio/lockjaw.mp3'],
  ['track_02', 'No Lie', 'Sean Paul, Dua Lipa', 221000, 'world', '/audio/no-lie.m4a'],
  ['track_03', 'Udi', 'Aneesh Sarkar, Hruday Poojari', 215000, 'world', '/audio/udi.m4a'],
  ['track_04', 'YOU HAUNT ME', 'CITIZEN', 218000, 'ambient', '/audio/you-haunt-me.m4a'],
  ['track_05', 'feel nothing', 'sufr, jaiyash, junedeath', 249000, 'ambient', '/audio/feel-nothing.m4a']
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
