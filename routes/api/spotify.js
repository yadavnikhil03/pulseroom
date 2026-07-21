const crypto = require('crypto');
const router = require('express').Router();
const querystring = require('querystring');
const axios = require('axios');

require('dotenv').config();

const sessions = new Map();
const SESSION_COOKIE = 'pulseroom_spotify_session';
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-modify-playback-state'
].join(' ');

const getRedirectUri = req => (process.env.SPOTIFY_REDIRECT_URI || process.env.REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/spotify/callback`).trim();
const getClientId = () => (process.env.SPOTIFY_CLIENT_ID || process.env.CLIENT_ID || '').trim();
const getClientSecret = () => (process.env.SPOTIFY_CLIENT_SECRET || process.env.CLIENT_SECRET || '').trim();
const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

const readCookie = (req, name) => {
  const header = req.headers.cookie || '';
  const value = header.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`));
  return value ? decodeURIComponent(value.slice(name.length + 1)) : null;
};

const setSessionCookie = (res, id) => {
  const productionAttributes = process.env.NODE_ENV === 'production'
    ? 'SameSite=None; Secure'
    : 'SameSite=Lax';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(id)}; Path=/; HttpOnly; ${productionAttributes}`);
};
const getSession = req => sessions.get(readCookie(req, SESSION_COOKIE));
const redirectWithError = (res, message) => res.redirect(`${getFrontendUrl()}/home?error=${encodeURIComponent(message)}`);

const getAuthHeader = () => `Basic ${Buffer.from(`${getClientId()}:${getClientSecret()}`).toString('base64')}`;

const spotifyTokenApi = axios.create({
  baseURL: 'https://accounts.spotify.com/api',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  timeout: 10000,
});

router.get('/login', (req, res) => {
  const clientId = getClientId();
  if (!clientId || !getClientSecret()) return res.status(500).send('Spotify credentials are missing. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.');
  const state = crypto.randomBytes(24).toString('hex');
  sessions.set(state, { state, createdAt: Date.now() });
  const url = 'https://accounts.spotify.com/authorize?' + querystring.stringify({ response_type: 'code', client_id: clientId, scope: SCOPES, redirect_uri: getRedirectUri(req), state });
  return res.redirect(url);
});

router.get('/callback', async (req, res) => {
  const pending = req.query.state && sessions.get(req.query.state);
  if (!pending || Date.now() - pending.createdAt > 10 * 60 * 1000) return redirectWithError(res, 'Spotify login expired. Please try again.');
  sessions.delete(req.query.state);
  if (req.query.error) return redirectWithError(res, `Spotify login failed: ${req.query.error}`);
  try {
    const response = await spotifyTokenApi.post('/token', querystring.stringify({
      code: req.query.code,
      redirect_uri: getRedirectUri(req),
      grant_type: 'authorization_code',
    }), { headers: { Authorization: getAuthHeader() } });
    if (!response.data?.access_token) return redirectWithError(res, 'Failed to obtain Spotify access token');
    const sessionId = crypto.randomBytes(32).toString('hex');
    sessions.set(sessionId, { accessToken: response.data.access_token, refreshToken: response.data.refresh_token, expiresAt: Date.now() + (response.data.expires_in * 1000), createdAt: Date.now() });
    setSessionCookie(res, sessionId);
    return res.redirect(`${getFrontendUrl()}/home`);
  } catch (error) {
    console.error('Spotify token exchange failed:', error.response?.data || error.message);
    return redirectWithError(res, error.response?.data?.error_description || error.response?.data?.error || 'Failed to obtain Spotify access token');
  }
});

router.get('/token', (req, res) => {
  const session = getSession(req);
  if (!session?.accessToken) return res.status(401).json({ message: 'Spotify login required.' });
  return res.json({ access_token: session.accessToken, expires_at: session.expiresAt });
});

router.post('/refresh', async (req, res) => {
  const sessionId = readCookie(req, SESSION_COOKIE);
  const session = sessions.get(sessionId);
  if (!session?.refreshToken) return res.status(401).json({ message: 'Spotify login required.' });
  try {
    const response = await spotifyTokenApi.post('/token', querystring.stringify({
      grant_type: 'refresh_token',
      refresh_token: session.refreshToken,
    }), { headers: { Authorization: getAuthHeader() } });
    if (!response.data?.access_token) return res.status(401).json({ message: 'Spotify session expired. Please log in again.' });
    session.accessToken = response.data.access_token;
    session.expiresAt = Date.now() + (response.data.expires_in * 1000);
    if (response.data.refresh_token) session.refreshToken = response.data.refresh_token;
    return res.json({ access_token: session.accessToken, expires_at: session.expiresAt });
  } catch (error) {
    console.error('Spotify token refresh failed:', error.response?.data || error.message);
    return res.status(401).json({ message: 'Spotify session expired. Please log in again.' });
  }
});

router.post('/logout', (req, res) => {
  const sessionId = readCookie(req, SESSION_COOKIE);
  if (sessionId) sessions.delete(sessionId);
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
  return res.status(204).end();
});

module.exports = { router, getSession, readCookie };
