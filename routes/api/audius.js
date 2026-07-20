const router = require('express').Router();

const AUDIUS_API_URL = 'https://api.audius.co/v1';
const REQUEST_TIMEOUT_MS = 8000;
const MAX_RESULTS = 12;

const audiusHeaders = () => ({
  Accept: 'application/json',
  'x-api-key': process.env.AUDIUS_API_KEY
});

const requestAudius = async (path, extraHeaders = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${AUDIUS_API_URL}${path}`, {
      headers: { ...audiusHeaders(), ...extraHeaders },
      signal: controller.signal
    });
    if (!response.ok) {
      const detail = await response.text();
      const error = new Error(`Audius returned ${response.status}.`);
      error.status = response.status;
      error.detail = detail.slice(0, 240);
      throw error;
    }
    return response;
  } finally {
    clearTimeout(timeout);
  }
};

const artworkUrls = artwork => {
  if (!artwork) return [];
  return [artwork['480x480'], artwork['150x150'], artwork['1000x1000']].filter(Boolean);
};

router.get('/search', async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (query.length < 2) {
    return res.status(400).json({ message: 'Enter at least 2 characters to search.' });
  }
  if (!process.env.AUDIUS_API_KEY) {
    return res.status(503).json({
      message: 'Online music search needs a free Audius API key. Local tracks are still available.',
      code: 'AUDIUS_NOT_CONFIGURED',
      results: []
    });
  }

  try {
    const params = new URLSearchParams({ query: query.slice(0, 80), limit: String(MAX_RESULTS) });
    const response = await requestAudius(`/tracks/search?${params}`);
    const payload = await response.json();
    const results = (Array.isArray(payload.data) ? payload.data : []).map(track => ({
      id: `audius_${track.id}`,
      sourceId: String(track.id),
      name: String(track.title || 'Untitled track'),
      artists: [String(track.user?.name || track.user?.handle || 'Audius artist')],
      duration_ms: Math.max(1000, Number(track.duration || 0) * 1000),
      genre: String(track.genre || 'Audius'),
      image: artworkUrls(track.artwork)[0] || '/images/icons/pulseroom-logo.svg',
      imageMirrors: artworkUrls(track.artwork),
      source: 'audius',
      url: `/api/audius/tracks/${encodeURIComponent(track.id)}/stream`
    }));
    return res.json({ results });
  } catch (error) {
    return res.status(error.name === 'AbortError' ? 504 : 502).json({
      message: error.name === 'AbortError'
        ? 'Audius search timed out. Local tracks are still available.'
        : 'Audius search is temporarily unavailable. Local tracks are still available.',
      results: []
    });
  }
});

router.get('/tracks/:id/stream', async (req, res) => {
  if (!process.env.AUDIUS_API_KEY) {
    return res.status(503).json({ message: 'Audius streaming is not configured.' });
  }
  const trackId = String(req.params.id || '').trim();
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(trackId)) {
    return res.status(400).json({ message: 'Invalid Audius track ID.' });
  }

  try {
    const rangeHeaders = req.headers.range ? { Range: req.headers.range } : {};
    const response = await requestAudius(`/tracks/${encodeURIComponent(trackId)}/stream`, rangeHeaders);
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    const acceptRanges = response.headers.get('accept-ranges');
    const contentRange = response.headers.get('content-range');
    res.status(response.status);
    if (contentType) res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);
    if (contentRange) res.setHeader('Content-Range', contentRange);
    res.setHeader('Cache-Control', 'private, max-age=300');
    const buffer = Buffer.from(await response.arrayBuffer());
    return res.send(buffer);
  } catch (error) {
    return res.status(error.name === 'AbortError' ? 504 : 502).json({
      message: error.name === 'AbortError' ? 'Audius stream timed out.' : 'This Audius track could not be streamed.'
    });
  }
});

module.exports = router;
