const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const trackSchema = require('./track');

const RoomSchema = new Schema(
  {
    room_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    title: {
      type: String,
      trim: true,
      maxlength: 48,
      default: 'Untitled room'
    },
    collectionId: {
      type: String,
      trim: true,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    currentTrackId: {
      type: String,
      default: null
    },
    playback: {
      isPlaying: { type: Boolean, default: false },
      positionMs: { type: Number, default: 0 },
      updatedAt: { type: Date, default: Date.now }
    },
    addedTracks: [trackSchema]
  },
  {
    toJSON: { getters: true },
    id: false
  }
);

const Room = mongoose.model('Room', RoomSchema);

module.exports = Room;
