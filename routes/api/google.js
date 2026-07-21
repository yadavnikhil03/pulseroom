const crypto = require('crypto');
const router = require('express').Router();
const { OAuth2Client } = require('google-auth-library');
const User = require('../../models/user');
const { REFRESH_TTL_MS, signAccessToken, createRefreshToken, hashToken } = require('../../services/token.service');
const RefreshToken = require('../../models/refreshToken');

const sessions = new Map();
const SESSION_COOKIE = 'pulseroom_google_state';

const getClientId = () => (process.env.GOOGLE_CLIENT_ID || '').trim();
const getClientSecret = () => (process.env.GOOGLE_CLIENT_SECRET || '').trim();
const getRedirectUri = req => {
  const prod = process.env.GOOGLE_REDIRECT_URI || '';
  if (prod) return prod.trim();
  return `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
};
const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

const readCookie = (req, name) => {
  const header = req.headers.cookie || '';
  const value = header.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`));
  return value ? decodeURIComponent(value.slice(name.length + 1)) : null;
};

const setStateCookie = (res, state) => {
  const productionAttributes = process.env.NODE_ENV === 'production'
    ? 'SameSite=None; Secure'
    : 'SameSite=Lax';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(state)}; Path=/api/auth/google; HttpOnly; ${productionAttributes}; Max-Age=600`);
};

const clearStateCookie = res => {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/api/auth/google; Max-Age=0; HttpOnly; SameSite=Lax`);
};

const redirectWithError = (res, message) => {
  return res.redirect(`${getFrontendUrl()}/login?error=${encodeURIComponent(message)}`);
};

const issueSession = async (user) => {
  const refreshToken = createRefreshToken();
  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    userAgent: '',
    ip: '',
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS)
  });
  user.lastLoginAt = new Date();
  await user.save();
  return { user: user.toPublicJSON(), accessToken: signAccessToken(user), refreshToken };
};

// Login endpoint — redirects to Google
router.get('/login', (req, res) => {
  const clientId = getClientId();
  const clientSecret = getClientSecret();
  if (!clientId || !clientSecret) {
    return res.status(500).send('Google credentials are missing. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.');
  }

  const oauth2Client = new OAuth2Client(clientId, clientSecret, getRedirectUri(req));
  const state = crypto.randomBytes(24).toString('hex');
  sessions.set(state, { state, createdAt: Date.now() });

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    state,
    prompt: 'select_account'
  });

  setStateCookie(res, state);
  return res.redirect(authUrl);
});

// Callback endpoint — handles Google's redirect
router.get('/callback', async (req, res) => {
  const pending = req.query.state && sessions.get(req.query.state);
  if (!pending || Date.now() - pending.createdAt > 10 * 60 * 1000) {
    return redirectWithError(res, 'Google login expired. Please try again.');
  }
  sessions.delete(req.query.state);
  clearStateCookie(res);

  if (req.query.error) {
    return redirectWithError(res, `Google login failed: ${req.query.error}`);
  }

  try {
    const clientId = getClientId();
    const clientSecret = getClientSecret();
    const oauth2Client = new OAuth2Client(clientId, clientSecret, getRedirectUri(req));

    const { tokens } = await oauth2Client.getToken(req.query.code);
    if (!tokens?.id_token) {
      return redirectWithError(res, 'Failed to obtain Google ID token');
    }

    // Verify the ID token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      return redirectWithError(res, 'Google account has no email');
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || email.split('@')[0];
    const avatarUrl = payload.picture || '';

    // Find or create user by email
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name,
        email,
        passwordHash: 'google_oauth',
        passwordSalt: 'google_oauth',
        avatarUrl,
        googleId,
        role: 'listener'
      });
      await user.save();
    } else if (!user.googleId) {
      // Link Google account to existing PulseRoom account
      user.googleId = googleId;
      if (avatarUrl) user.avatarUrl = avatarUrl;
      await user.save();
    }

    // Issue JWT + refresh token
    const session = await issueSession(user);

    // Redirect to frontend with tokens in URL hash (frontend picks them up)
    return res.redirect(
      `${getFrontendUrl()}/home?google_auth=1&accessToken=${encodeURIComponent(session.accessToken)}&refreshToken=${encodeURIComponent(session.refreshToken)}`
    );
  } catch (error) {
    console.error('Google callback error:', error.message);
    return redirectWithError(res, error.message || 'Google authentication failed');
  }
});

module.exports = router;
