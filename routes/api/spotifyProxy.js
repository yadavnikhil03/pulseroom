const axios = require('axios');
const router = require('express').Router();
const { getSession, readCookie } = require('./spotify');

/**
 * Spotify API Proxy
 *
 * Proxies /api/spotify/proxy/* to api.spotify.com/v1/*
 * This avoids CORS issues from the browser.
 */
router.all('/*', async (req, res) => {
  try {
    const sessionId = readCookie(req, 'pulseroom_spotify_session');
    const session = sessionId ? await getSession(req) : null;
    if (!session?.accessToken) {
      return res.status(401).json({ error: 'spotify_not_connected' });
    }

    // e.g. req.params[0] = "me/playlists", req.url = "/me/playlists?limit=50"
    const spotifyPath = req.params[0] || '';
    const qsIndex = req.url.indexOf('?');
    const queryString = qsIndex >= 0 ? req.url.slice(qsIndex) : '';
    const spotifyUrl = `https://api.spotify.com/v1/${spotifyPath}${queryString}`;

    const response = await axios({
      method: req.method,
      url: spotifyUrl,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': req.headers['content-type'] || 'application/json',
      },
      data: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
      timeout: 15000,
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    console.error('Spotify proxy error:', error.message);
    return res.status(500).json({ error: 'proxy_error', message: error.message });
  }
});

module.exports = router;
