const crypto = require('crypto');
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    passwordSalt: { type: String, required: true, select: false },
    role: { type: String, enum: ['listener', 'host', 'creator', 'admin'], default: 'listener' },
    avatarUrl: { type: String, default: '' },
    spotifyId: { type: String, unique: true, sparse: true },
    spotifyConnected: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

UserSchema.methods.setPassword = function setPassword(password) {
  this.passwordSalt = crypto.randomBytes(16).toString('hex');
  this.passwordHash = crypto.scryptSync(password, this.passwordSalt, 64).toString('hex');
};

UserSchema.methods.verifyPassword = function verifyPassword(password) {
  const candidate = crypto.scryptSync(password, this.passwordSalt, 64);
  const stored = Buffer.from(this.passwordHash, 'hex');
  return stored.length === candidate.length && crypto.timingSafeEqual(stored, candidate);
};

UserSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    avatarUrl: this.avatarUrl,
    spotifyConnected: this.spotifyConnected,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
