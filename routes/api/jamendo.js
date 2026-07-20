const router = require('express').Router();
const axios = require('axios');

const JAMENDO_API_URL = 'https://api.jamendo.com/v3.0';

router.get('/search', async (req, res) => {
  const clientId = process.env.JAMENDO_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({
      message: 'Jamendo API client ID is not configured on the server.',
      results: []
    });
  }

  const { search, limit = 20, imagesize = 400 } = req.query;
  if (!search) {
    return res.status(400).json({ message: 'Search query is required.' });
  }

  try {
    const { data } = await axios.get(`${JAMENDO_API_URL}/tracks/`, {
      params: {
        client_id: clientId,
        format: 'json',
        limit,
        search,
        imagesize
      }
    });

    if (data.headers.status !== 'success') {
      return res.status(502).json({ message: data.headers.error_message || 'Jamendo API returned an error.' });
    }
    
    const tracks = data.results.map(track => ({
      id: String(track.id),
      name: track.name,
      artists: [{ name: track.artist_name }],
      album: track.album_name,
      image: track.image,
      url: track.audio,
      duration_ms: track.duration * 1000,
      license: track.license_ccurl
    }));

    res.json({ results: tracks });

  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error.response?.data
    });
  }
});

module.exports = router;
