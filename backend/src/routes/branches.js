const express = require('express');
const supabase = require('../utils/database');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const ADMIN = requireRole('top_management');

// GET /api/quality/branches — all active branches, with their brand assignments
router.get('/', requireAuth, async (req, res) => {
  const { data: branches, error } = await supabase
    .from('branches')
    .select('id, name, email, area_id, is_active')
    .eq('is_active', true)
    .order('name', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });

  const { data: assignments } = await supabase
    .from('qa_brand_branches')
    .select('branch_id, brand_id');
  const byBranch = new Map();
  for (const a of assignments || []) {
    if (!byBranch.has(a.branch_id)) byBranch.set(a.branch_id, []);
    byBranch.get(a.branch_id).push(a.brand_id);
  }
  res.json({
    branches: branches.map((b) => ({ ...b, brand_ids: byBranch.get(b.id) || [] })),
  });
});

// POST /api/quality/branches/:branchId/assign  { brand_id }
router.post('/:branchId/assign', requireAuth, ADMIN, async (req, res) => {
  const { brand_id } = req.body || {};
  if (!brand_id) return res.status(400).json({ error: 'brand_id required' });
  const { error } = await supabase
    .from('qa_brand_branches')
    .insert({ branch_id: req.params.branchId, brand_id, created_by: req.user.id });
  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Already assigned' });
    return res.status(500).json({ error: error.message });
  }
  res.status(201).json({ ok: true });
});

// DELETE /api/quality/branches/:branchId/assign/:brandId
router.delete('/:branchId/assign/:brandId', requireAuth, ADMIN, async (req, res) => {
  const { error } = await supabase
    .from('qa_brand_branches')
    .delete()
    .eq('branch_id', req.params.branchId)
    .eq('brand_id', req.params.brandId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

module.exports = router;
