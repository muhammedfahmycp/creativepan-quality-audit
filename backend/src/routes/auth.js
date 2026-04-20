const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const supabase = require('../utils/database');
const logger = require('../utils/logger');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function issueToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function publicUser(u) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, avatar_url: u.avatar_url };
}

// POST /api/auth/google — verify Google ID token and issue our JWT
router.post('/google', async (req, res) => {
  const { idToken } = req.body || {};
  if (!idToken) return res.status(400).json({ error: 'Missing idToken' });

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    logger.warn('Google token verify failed', { message: err.message });
    return res.status(401).json({ error: 'Invalid Google token' });
  }

  const email = String(payload.email || '').toLowerCase();
  const googleId = payload.sub;
  const name = payload.name || payload.email;
  const picture = payload.picture || null;

  if (!payload.email_verified) {
    return res.status(401).json({ error: 'Email not verified by Google' });
  }

  const { data: user, error } = await supabase
    .from('qa_users')
    .select('*')
    .ilike('email', email)
    .maybeSingle();
  if (error) {
    logger.error('qa_users lookup failed', { message: error.message });
    return res.status(500).json({ error: 'Login failed' });
  }
  if (!user) return res.status(403).json({ error: 'Not authorized. Contact your administrator.' });
  if (!user.is_active) return res.status(403).json({ error: 'Account disabled' });

  // Backfill google_id / avatar / name on first login (or if updated)
  const updates = {};
  if (!user.google_id) updates.google_id = googleId;
  else if (user.google_id !== googleId) {
    logger.warn('Google ID mismatch — rejecting', { email, expected: user.google_id, got: googleId });
    return res.status(403).json({ error: 'Google account does not match registered user' });
  }
  if (picture && user.avatar_url !== picture) updates.avatar_url = picture;
  if (name && user.name !== name) updates.name = name;

  let fresh = user;
  if (Object.keys(updates).length > 0) {
    const { data: updated, error: upErr } = await supabase
      .from('qa_users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (upErr) logger.warn('qa_users update failed', { message: upErr.message });
    else fresh = updated;
  }

  const token = issueToken(fresh);
  res.json({ token, user: publicUser(fresh) });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
