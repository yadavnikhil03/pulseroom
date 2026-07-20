const router = require('express').Router(),
  querystring = require('querystring'),
  request = require('request');

require('dotenv').config();

const getRedirectUri = (req) => {
  if (process.env.REDIRECT_URI || process.env.REDIRECT_URL) {
    return (process.env.REDIRECT_URI || process.env.REDIRECT_URL).trim();
  }
  const host = req.get('host') || 'localhost:8888';
  return `http://${host}/api/spotify/callback`;
};

const getClientId = () => (process.env.CLIENT_ID || process.env.client_id || '').trim();
const getClientSecret = () => (process.env.CLIENT_SECRET || process.env.client_secret || '').trim();

// ROUTE: /api/spotify/login
router.get('/login', function (req, res) {
  if (process.env.DEMO_MODE === 'true') {
    const demoUrl = process.env.FRONTEND_URL || 'http://localhost:3000/home';
    return res.redirect(demoUrl + '?access_token=dev_mock_token');
  }
  const clientId = getClientId();
  if (!clientId) {
    return res.status(500).send('ERROR: Spotify Client ID is missing in .env file (please check CLIENT_ID or client_id and restart server).');
  }

  const url =
    'https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: clientId,
      scope:
        'user-read-private user-read-email playlist-modify-private playlist-modify-public user-read-currently-playing user-read-playback-state user-modify-playback-state',
      redirect_uri: getRedirectUri(req),
    });

  res.redirect(url);
});

// ROUTE: /api/spotify/callback
router.get('/callback', function (req, res) {
  let code = req.query.code || null;
  const clientId = getClientId();
  const clientSecret = getClientSecret();

  let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: getRedirectUri(req),
      grant_type: 'authorization_code',
    },
    headers: {
      Authorization:
        'Basic ' +
        Buffer.from(clientId + ':' + clientSecret).toString('base64'),
    },
    json: true,
  };
  request.post(authOptions, (error, response, body) => {
    const url = process.env.FRONTEND_URL || 'http://localhost:3000/home';
    if (error || response.statusCode !== 200 || !body || !body.access_token) {
      console.error('Spotify token exchange failed:', error || body);
      const errMsg = body && (body.error_description || body.error) ? (body.error_description || body.error) : 'Failed to obtain Spotify access token';
      return res.redirect(url + '?error=' + encodeURIComponent(errMsg));
    }
    const access_token = body.access_token;
    res.redirect(url + '?access_token=' + access_token);
  });
});

module.exports = router;
