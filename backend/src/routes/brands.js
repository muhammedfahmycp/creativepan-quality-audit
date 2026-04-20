const express = require('express');
const supabase = require('../utils/database');
const { requireAuth } = require('../middleware/auth');
const { getFormForBrand } = require('../lib/templates');

const router = express.Router();

// GET /api/quality/brands
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('qa_brands')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ brands: data });
});

// GET /api/quality/brands/:brandId/form
router.get('/:brandId/form', requireAuth, async (req, res) => {
  try {
    const form = await getFormForBrand(req.params.brandId);
    if (!form) return res.status(404).json({ error: 'No published template for this brand' });
    res.json(form);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quality/brands/:brandId/branches?month=YYYY-MM
router.get('/:brandId/branches', requireAuth, async (req, res) => {
  const { brandId } = req.params;
  const month = req.query.month;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'month=YYYY-MM required' });
  }

  const { data: assigns, error: aErr } = await supabase
    .from('qa_brand_branches')
    .select('branch_id')
    .eq('brand_id', brandId);
  if (aErr) return res.status(500).json({ error: aErr.message });

  const branchIds = (assigns || []).map((a) => a.branch_id);
  if (branchIds.length === 0) return res.json({ branches: [] });

  const { data: branches, error: bErr } = await supabase
    .from('branches')
    .select('id, name, email, area_id, is_active')
    .in('id', branchIds)
    .eq('is_active', true)
    .order('name', { ascending: true });
  if (bErr) return res.status(500).json({ error: bErr.message });

  const { data: audits, error: auErr } = await supabase
    .from('qa_audits')
    .select('id, branch_id, status, auditor_id, auditor_name, score_percentage, submitted_at, approved_at')
    .eq('brand_id', brandId)
    .eq('month', month)
    .in('branch_id', branchIds);
  if (auErr) return res.status(500).json({ error: auErr.message });

  const auditByBranch = new Map();
  for (const a of audits) auditByBranch.set(a.branch_id, a);

  res.json({
    branches: branches.map((b) => ({ ...b, audit: auditByBranch.get(b.id) || null })),
  });
});

module.exports = router;
