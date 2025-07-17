const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const BlockedUser = require('../models/BlockedUser');
const router = express.Router();

// Helper: Check if user is blocked
async function isUserBlocked(email) {
  const user = await User.findOne({ email });
  return user && user.isBlocked;
}

// Signup (email/password)
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required.' });

    // Check if user is blocked
    if (await isUserBlocked(email)) {
      return res.status(403).json({ message: 'User is blocked.' });
    }

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: 'User already exists.' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hash });

    req.login(user, err => {
      if (err)
        return res.status(500).json({ message: 'Login after signup failed.' });
      return res.status(201).json({ message: 'Signup successful', user: { email: user.email } });
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Signup failed.' });
  }
});

// Login (email/password)
router.post('/login', async (req, res, next) => {
  // Check if user is blocked before authenticating
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required.' });
  if (await isUserBlocked(email)) {
    return res.status(403).json({ message: 'User is blocked.' });
  }
  passport.authenticate('local', (err, user, info) => {
    if (err) return res.status(500).json({ message: 'Login failed.' });
    if (!user) return res.status(401).json({ message: info && info.message ? info.message : 'Authentication failed.' });
    req.login(user, err => {
      if (err) return res.status(500).json({ message: 'Login failed.' });
      return res.json({ message: 'Login successful', user: { email: user.email } });
    });
  })(req, res, next);
});

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: '/login',
  session: true
}), (req, res) => {
  // Redirect to chat or frontend home after successful login
  res.redirect('http://localhost:5173/chat');
});

// Logout
router.post('/logout', (req, res) => {
  // Support both callback and promise-based logout (for newer express-session)
  if (typeof req.logout === 'function') {
    // Newer express-session uses a callback
    req.logout(function(err) {
      if (err) {
        return res.status(500).json({ message: 'Logout failed.' });
      }
      res.json({ message: 'Logged out' });
    });
  } else {
    // Fallback for older versions
    req.session.destroy(() => {
      res.json({ message: 'Logged out' });
    });
  }
});

module.exports = router;