const router = require('express').Router();
const authService = require('../../services/auth.service');
const { authenticate } = require('../../middlewares/auth.middleware');

const REFRESH_COOKIE = 'pulseroom_refresh';
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/api/auth',
  maxAge: 30 * 24 * 60 * 60 * 1000
});
const clearCookieOptions = () => {
  const { maxAge, ...options } = cookieOptions();
  return options;
};
const readCookie = (req, name) => {
  const part = String(req.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : null;
};
const meta = req => ({ userAgent: req.get('user-agent') || '', ip: req.ip });
const respond = (res, result, status = 200) => {
  res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions());
  return res.status(status).json({ user: result.user, accessToken: result.accessToken });
};
const handle = handler => async (req, res) => {
  try { await handler(req, res); }
  catch (error) { res.status(error.status || 500).json({ message: error.status ? error.message : 'Authentication request failed.' }); }
};

router.post('/register', handle(async (req, res) => respond(res, await authService.register(req.body, meta(req)), 201)));
router.post('/login', handle(async (req, res) => respond(res, await authService.login(req.body, meta(req)))));
router.post('/refresh-token', handle(async (req, res) => respond(res, await authService.refresh(readCookie(req, REFRESH_COOKIE)))));
router.post('/logout', handle(async (req, res) => {
  await authService.logout(readCookie(req, REFRESH_COOKIE));
  res.clearCookie(REFRESH_COOKIE, clearCookieOptions());
  res.status(204).end();
}));
router.get('/me', authenticate, (req, res) => res.json({ user: req.user.toPublicJSON() }));

module.exports = router;
