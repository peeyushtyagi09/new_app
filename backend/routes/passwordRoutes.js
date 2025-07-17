const express = require('express');
const User = require('../models/User');
const BlockedUser = require('../models/BlockedUser');
const router = express.Router();

const PASSWORD = '0928';
const MAX_ATTEMPTS = 3;

// Helper to get device/browser info from request
function getDeviceInfo(req) {
  return {
    deviceFingerprint: req.headers['x-device-fingerprint'] || '',
    browserInfo: req.headers['user-agent'] || ''
  };
}

// Utility: block user/device/browser
async function blockUserOrDevice({ email, deviceFingerprint, browserInfo, reason }) {
  try {
    // Only add to BlockedUser if not already blocked
    const alreadyBlocked = await BlockedUser.findOne({
      $or: [
        email ? { email } : null,
        deviceFingerprint ? { deviceFingerprint } : null,
        browserInfo ? { browserInfo } : null
      ].filter(Boolean)
    });
    if (!alreadyBlocked) {
      await BlockedUser.create({ email, deviceFingerprint, browserInfo, reason });
    }
  } catch (err) {
    // Log error but don't throw
    console.error('Error blocking user/device:', err);
  }
}

// Check password and track attempts
router.post('/check', async (req, res) => {
  try {
    const { password, email } = req.body;
    const { deviceFingerprint, browserInfo } = getDeviceInfo(req);

    // Check if blocked
    let blocked = await BlockedUser.findOne({
      $or: [
        email ? { email } : null,
        deviceFingerprint ? { deviceFingerprint } : null,
        browserInfo ? { browserInfo } : null
      ].filter(Boolean)
    });
    if (blocked) {
      return res.status(403).json({ message: 'NO ATTEMPTS LEFT', blocked: true });
    }

    // Check password
    if (password === PASSWORD) {
      // Reset attempts if user exists
      if (email) {
        await User.updateOne({ email }, { $set: { attempts: 0, isBlocked: false, blockReason: null } });
      }
      return res.json({ success: true });
    }

    // Increment attempts
    let user = email ? await User.findOne({ email }) : null;
    if (user) {
      user.attempts = (user.attempts || 0) + 1;
      if (user.attempts >= MAX_ATTEMPTS) {
        user.isBlocked = true;
        user.blockReason = 'Too many failed attempts';
        await blockUserOrDevice({ email, deviceFingerprint, browserInfo, reason: user.blockReason });
      }
      await user.save();
      if (user.isBlocked) {
        return res.status(403).json({ message: 'NO ATTEMPTS LEFT', blocked: true });
      }
      return res.status(401).json({ message: 'Incorrect password', attempts: user.attempts });
    } else {
      // No email: block by device/browser after 3 attempts (track in BlockedUser)
      if (!deviceFingerprint && !browserInfo) {
        // Can't track attempts, so just return error
        return res.status(401).json({ message: 'Incorrect password', attempts: 1 });
      }
      // Use req.session if available, otherwise fallback to in-memory (not recommended for production)
      let session = req.session;
      if (!session) {
        // fallback: attach to req (not persistent, but prevents crash)
        if (!req._tempSession) req._tempSession = {};
        session = req._tempSession;
      }
      session.attempts = session.attempts || {};
      const key = `${deviceFingerprint}|${browserInfo}`;
      session.attempts[key] = (session.attempts[key] || 0) + 1;
      if (session.attempts[key] >= MAX_ATTEMPTS) {
        await blockUserOrDevice({ deviceFingerprint, browserInfo, reason: 'Too many failed attempts (no email)' });
        return res.status(403).json({ message: 'NO ATTEMPTS LEFT', blocked: true });
      }
      return res.status(401).json({ message: 'Incorrect password', attempts: session.attempts[key] });
    }
  } catch (err) {
    console.error('Error in /check:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Check if blocked (for frontend to call before showing password modal)
router.get('/check-blocked', async (req, res) => {
  try {
    const email = req.query.email;
    const { deviceFingerprint, browserInfo } = getDeviceInfo(req);
    const blocked = await BlockedUser.findOne({
      $or: [
        email ? { email } : null,
        deviceFingerprint ? { deviceFingerprint } : null,
        browserInfo ? { browserInfo } : null
      ].filter(Boolean)
    });
    if (blocked) {
      return res.json({ blocked: true });
    }
    return res.json({ blocked: false });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;