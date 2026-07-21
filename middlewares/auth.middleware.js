const User = require('../models/user');
const { verifyAccessToken } = require('../services/token.service');

const bearerToken = header => String(header || '').startsWith('Bearer ') ? String(header).slice(7) : null;

const authenticate = async (req, res, next) => {
  try {
    const token = bearerToken(req.headers.authorization);
    if (!token) return res.status(401).json({ message: 'Access token is required.' });
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user || user.isBlocked) return res.status(401).json({ message: 'Account is unavailable.' });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: 'Access token is invalid or expired.' });
  }
};

const optionalAuthenticateSocket = async socket => {
  const token = socket.handshake.auth?.token || bearerToken(socket.handshake.headers.authorization);
  if (!token) return null;
  const payload = verifyAccessToken(token);
  const user = await User.findById(payload.sub);
  if (!user || user.isBlocked) throw new Error('Account is unavailable.');
  return user;
};

module.exports = { authenticate, optionalAuthenticateSocket };
