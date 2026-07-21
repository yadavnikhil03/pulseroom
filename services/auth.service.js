const User = require('../models/user');
const RefreshToken = require('../models/refreshToken');
const { REFRESH_TTL_MS, signAccessToken, createRefreshToken, hashToken } = require('./token.service');

const normalizeEmail = email => String(email || '').trim().toLowerCase();
const publicUser = user => user.toPublicJSON();

const issueSession = async (user, meta = {}) => {
  const refreshToken = createRefreshToken();
  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    userAgent: meta.userAgent || '',
    ip: meta.ip || '',
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS)
  });
  user.lastLoginAt = new Date();
  await user.save();
  return { user: publicUser(user), accessToken: signAccessToken(user), refreshToken };
};

const register = async ({ name, email, password }, meta) => {
  const normalizedEmail = normalizeEmail(email);
  if (!String(name || '').trim() || !normalizedEmail || !password) {
    const error = new Error('Name, email and password are required.'); error.status = 400; throw error;
  }
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    const error = new Error('Enter a valid email address.'); error.status = 400; throw error;
  }
  if (String(password).length < 8) {
    const error = new Error('Password must be at least 8 characters.'); error.status = 400; throw error;
  }
  if (await User.exists({ email: normalizedEmail })) {
    const error = new Error('An account with this email already exists.'); error.status = 409; throw error;
  }
  const user = new User({ name: String(name).trim(), email: normalizedEmail, passwordHash: 'pending', passwordSalt: 'pending' });
  user.setPassword(password);
  await user.save();
  return issueSession(user, meta);
};

const login = async ({ email, password }, meta) => {
  const user = await User.findOne({ email: normalizeEmail(email) }).select('+passwordHash +passwordSalt');
  if (!user || !password || !user.verifyPassword(password)) {
    const error = new Error('Invalid email or password.'); error.status = 401; throw error;
  }
  if (user.isBlocked) { const error = new Error('This account is blocked.'); error.status = 403; throw error; }
  return issueSession(user, meta);
};

const refresh = async token => {
  const session = token && await RefreshToken.findOne({ tokenHash: hashToken(token), revokedAt: null, expiresAt: { $gt: new Date() } });
  if (!session) { const error = new Error('Refresh token is invalid or expired.'); error.status = 401; throw error; }
  const user = await User.findById(session.user);
  if (!user || user.isBlocked) { const error = new Error('Account is unavailable.'); error.status = 401; throw error; }
  session.revokedAt = new Date();
  await session.save();
  return issueSession(user);
};

const logout = async token => {
  if (!token) return;
  await RefreshToken.updateOne({ tokenHash: hashToken(token), revokedAt: null }, { revokedAt: new Date() });
};

module.exports = { register, login, refresh, logout };
