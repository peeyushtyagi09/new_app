const mongoose = require('mongoose');

const blockedUserSchema = new mongoose.Schema({
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: null,
  },
  deviceFingerprint: {
    type: String,
    trim: true,
    default: null,
  },
  browserInfo: {
    type: String,
    trim: true,
    default: null,
  },
  blockedAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
});

// Prevent model overwrite in development or hot-reload
module.exports = mongoose.models.BlockedUser || mongoose.model('BlockedUser', blockedUserSchema);