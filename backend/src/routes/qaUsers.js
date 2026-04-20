const express = require('express');
const supabase = require('../utils/database');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const ADMIN = requireRole('top_management');
const ROLES = new Set(['top_management', 'quality_manager', 'quality_auditor']);

// GET /api/quality/users — admin only
router.get('/', requireAuth, ADMIN, async (req, res) => {
  const { data, error } = await supabase
    .from('qa_users')
    .select('id, email, name, role, avatar_url, is_active, created_at')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ users: data });
});

// POST /api/quality/users — admin creates a new user
router.post('/', requireAuth, ADMIN, async (req, res) => {
  const { email, name, role } = req.body || {};
  if (!email || !name || !role) return res.status(400).json({ error: 'email, name, role required' });
  if (!ROLES.has(role)) return res.status(400).json({ error: 'Invalid role' });
  if (!/@creativepan\.com\.eg$/i.test(email)) {
    return res.status(400).json({ error: 'Email must be @creativepan.com.eg' });
  }

  const { data, error } = await supabase
    .from('qa_users')
    .insert({ email: email.toLowerCase(), name, role, is_active: true })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    return res.status(500).json({ error: error.message });
  }
  res.status(201).json({ user: data });
});

// PUT /api/quality/users/:userId/role  { role }
router.put('/:userId/role', requireAuth, ADMIN, async (req, res) => {
  const { role } = req.body || {};
  if (!ROLES.has(role)) return res.status(400).json({ error: 'Invalid role' });
  if (req.params.userId === req.user.id && role !== 'top_management') {
    return res.status(400).json({ error: 'You cannot demote yourself' });
  }
  const { data, error } = await supabase
    .from('qa_users')
    .update({ role })
    .eq('id', req.params.userId)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ user: data });
});

// DELETE /api/quality/users/:userId — soft delete (is_active=false)
router.delete('/:userId', requireAuth, ADMIN, async (req, res) => {
  if (req.params.userId === req.user.id) {
    return res.status(400).json({ error: 'You cannot deactivate yourself' });
  }
  const { data, error } = await supabase
    .from('qa_users')
    .update({ is_active: false })
    .eq('id', req.params.userId)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ user: data });
});

module.exports = router;
