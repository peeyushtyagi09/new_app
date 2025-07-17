const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+@.+\..+/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: function() {
      // Password is required if googleId is not present
      return !this.googleId;
    }
  },
  googleId: {
    type: String,
    required: function() {
      // googleId is required if password is not present
      return !this.password;
    }
  },
  attempts: {
    type: Number,
    default: 0,
    min: [0, 'Attempts cannot be negative']
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockReason: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);