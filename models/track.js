const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const trackSchema = new Schema(
  {
    info: {
      type: String,
      required: true
    },
    spotifyId: {
      type: String,
      required: true
    },
    metadata: {
      id: String,
      name: String,
      artists: [String],
      duration_ms: Number,
      image: String,
      uri: String,
      source: { type: String, default: 'spotify' }
    },
    played: {
      type: Boolean,
      default: false
    },
    progress: {
      type: Number,
      default: 0,
      required: false
    },
    nowPlaying: {
      type: Boolean,
      default: false
    },
    likes: []
  },
  {
    toJSON: { getters: true },
    id: false
  }
);

module.exports = trackSchema;
