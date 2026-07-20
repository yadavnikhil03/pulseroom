const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:8888';
const ROOM_ID = `SMOKE_${Date.now()}`;
let testsPassed = 0;
let testsFailed = 0;

const test = async (name, fn) => {
  try {
    await fn();
    console.log(`✅ PASS: ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ FAIL: ${name}`);
    console.error(error);
    testsFailed++;
    process.exitCode = 1;
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message || 'Assertion failed');
};

const post = (path, body) => fetch(`${BASE_URL}${path}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

const put = (path, body) => fetch(`${BASE_URL}${path}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

const get = (path) => fetch(`${BASE_URL}${path}`);

(async () => {
  await test('Server is running', async () => {
    const res = await get('/api/rooms');
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
  });

  await test('Create a new room', async () => {
    const res = await post('/api/rooms', { room_id: ROOM_ID, collectionId: 'ambient', title: 'Smoke Test' });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const room = await res.json();
    assert(room.room_id === ROOM_ID, `Expected room ID ${ROOM_ID}, got ${room.room_id}`);
  });

  await test('Get the created room', async () => {
    const res = await get(`/api/rooms/${ROOM_ID}`);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const room = await res.json();
    assert(room.room_id === ROOM_ID, `Expected room ID ${ROOM_ID}, got ${room.room_id}`);
    assert(room.addedTracks.length > 0, 'Expected room to have initial tracks');
  });

  await test('Add a valid local track', async () => {
    const res = await put(`/api/rooms/${ROOM_ID}`, { spotifyId: 'track_01' });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const room = await res.json();
    assert(room.addedTracks.some(t => t.spotifyId === 'track_01'), 'Track was not added');
  });

  await test('Add a valid Audius track', async () => {
    const track = { id: "audius_dZ4gq", source: "audius", sourceId: "dZ4gq", name: "Test Track", artists: ["Test Artist"], url: "/api/audius/tracks/dZ4gq/stream" };
    const res = await put(`/api/rooms/${ROOM_ID}`, { spotifyId: track.id, track });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    const room = await res.json();
    assert(room.addedTracks.some(t => t.spotifyId === track.id), 'Audius track was not added');
  });

  await test('Reject a malformed Audius track URL', async () => {
    const track = { id: "audius_dZ4gq", source: "audius", sourceId: "dZ4gq", name: "Test Track", artists: ["Test Artist"], url: "https://example.com/malicious" };
    const res = await put(`/api/rooms/${ROOM_ID}`, { spotifyId: track.id, track });
    assert(res.status === 400, `Expected status 400, got ${res.status}`);
  });

  await test('Reject a duplicate track', async () => {
    const res = await put(`/api/rooms/${ROOM_ID}`, { spotifyId: 'track_01' });
    assert(res.status === 409, `Expected status 409, got ${res.status}`);
  });

  await test('Audius search returns 503 without API key', async () => {
    const res = await get('/api/audius/search?q=test');
    // This will pass if the key is not set, which is the case in the user's env
    assert(res.status === 503, `Expected status 503, got ${res.status}`);
  });

  console.log(`\nSmoke test complete. Passed: ${testsPassed}, Failed: ${testsFailed}`);
})();
