const crypto = require('crypto');

const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const decode = value => JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
const secret = () => process.env.JWT_ACCESS_SECRET || process.env.SESSION_SECRET || 'pulseroom-development-secret-change-me';
const signature = value => crypto.createHmac('sha256', secret()).update(value).digest('base64url');

const signAccessToken = user => {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({ sub: user._id.toString(), role: user.role, iat: now, exp: now + ACCESS_TTL_SECONDS });
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${signature(unsigned)}`;
};

const verifyAccessToken = token => {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new Error('Malformed access token');
  const unsigned = `${parts[0]}.${parts[1]}`;
  const expected = Buffer.from(signature(unsigned));
  const supplied = Buffer.from(parts[2]);
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) throw new Error('Invalid access token');
  const payload = decode(parts[1]);
  if (!payload.sub || payload.exp <= Math.floor(Date.now() / 1000)) throw new Error('Expired access token');
  return payload;
};

const createRefreshToken = () => crypto.randomBytes(48).toString('base64url');
const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');

module.exports = { ACCESS_TTL_SECONDS, REFRESH_TTL_MS, signAccessToken, verifyAccessToken, createRefreshToken, hashToken };
