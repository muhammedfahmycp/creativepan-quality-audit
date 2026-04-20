const express = require('express');
const supabase = require('../utils/database');
const logger = require('../utils/logger');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getCurrentTemplate, getFormForBrand } = require('../lib/templates');
const { calculateScores, loadAuditWithResponses } = require('../lib/audits');

const router = express.Router();

const AUDITOR = requireRole('quality_auditor');
const REVIEWER = requireRole('quality_manager', 'top_management');

// GET /api/quality/audits?brand_id=&month=&status=&auditor_id=&mine=1
router.get('/', requireAuth, async (req, res) => {
  let q = supabase.from('qa_audits').select('*').order('created_at', { ascending: false });
  const { brand_id, month, status, auditor_id, mine } = req.query;
  if (brand_id) q = q.eq('brand_id', brand_id);
  if (month) q = q.eq('month', month);
  if (status) q = q.eq('status', status);
  if (auditor_id) q = q.eq('auditor_id', auditor_id);
  if (mine === '1') q = q.eq('auditor_id', req.user.id);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ audits: data });
});

// POST /api/quality/audits  { branch_id, brand_id, month }
router.post('/', requireAuth, AUDITOR, async (req, res) => {
  const { branch_id, brand_id, month } = req.body || {};
  if (!branch_id || !brand_id || !month) {
    return res.status(400).json({ error: 'branch_id, brand_id, month required' });
  }
  if (!/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ error: 'month must be YYYY-MM' });

  // Validate brand-branch mapping
  const { data: link } = await supabase
    .from('qa_brand_branches')
    .select('brand_id')
    .eq('brand_id', brand_id)
    .eq('branch_id', branch_id)
    .maybeSingle();
  if (!link) return res.status(400).json({ error: 'Branch not assigned to this brand' });

  // Refuse duplicate for same brand+branch+month
  const { data: existing } = await supabase
    .from('qa_audits')
    .select('id, status, auditor_id')
    .eq('brand_id', brand_id)
    .eq('branch_id', branch_id)
    .eq('month', month)
    .maybeSingle();
  if (existing) {
    return res.status(409).json({ error: 'Audit already started for this branch and month', audit_id: existing.id });
  }

  const form = await getFormForBrand(brand_id);
  if (!form) return res.status(400).json({ error: 'Brand has no current template' });

  const now = new Date().toISOString();
  const { data: audit, error } = await supabase
    .from('qa_audits')
    .insert({
      branch_id,
      brand_id,
      template_id: form.template.id,
      month,
      status: 'in_progress',
      auditor_id: req.user.id,
      auditor_name: req.user.name,
      started_at: now,
      total_max_score: 0,
      total_awarded_score: 0,
      score_percentage: 0,
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  // Pre-create responses, one per point, all unanswered.
  const rows = [];
  for (const section of form.sections) {
    for (const p of section.points) {
      rows.push({
        audit_id: audit.id,
        point_id: p.id,
        is_applicable: true,
        awarded_score: null,
        max_score_snapshot: p.max_score,
      });
    }
  }
  if (rows.length > 0) {
    const { error: rErr } = await supabase.from('qa_audit_responses').insert(rows);
    if (rErr) {
      // Roll back the audit — we don't want orphaned empties
      await supabase.from('qa_audits').delete().eq('id', audit.id);
      return res.status(500).json({ error: rErr.message });
    }
  }

  const full = await loadAuditWithResponses(audit.id);
  res.status(201).json(full);
});

// GET /api/quality/audits/:auditId
router.get('/:auditId', requireAuth, async (req, res) => {
  try {
    const full = await loadAuditWithResponses(req.params.auditId);
    if (!full) return res.status(404).json({ error: 'Not found' });
    res.json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/quality/audits/:auditId  { responses: [{ point_id, is_applicable, awarded_score, comments }] }
router.patch('/:auditId', requireAuth, async (req, res) => {
  const { data: audit, error: aErr } = await supabase
    .from('qa_audits')
    .select('*')
    .eq('id', req.params.auditId)
    .maybeSingle();
  if (aErr) return res.status(500).json({ error: aErr.message });
  if (!audit) return res.status(404).json({ error: 'Not found' });
  if (audit.auditor_id !== req.user.id) return res.status(403).json({ error: 'Not your audit' });
  if (!['in_progress', 'edits_requested'].includes(audit.status)) {
    return res.status(409).json({ error: `Cannot edit audit in status ${audit.status}` });
  }

  const responses = Array.isArray(req.body?.responses) ? req.body.responses : [];
  if (responses.length === 0) return res.json({ ok: true });

  const updates = [];
  for (const r of responses) {
    if (!r.point_id) continue;
    const patch = {};
    if (r.is_applicable != null) patch.is_applicable = !!r.is_applicable;
    if (Object.prototype.hasOwnProperty.call(r, 'awarded_score')) patch.awarded_score = r.awarded_score;
    if (Object.prototype.hasOwnProperty.call(r, 'comments')) patch.comments = r.comments;
    if (Object.keys(patch).length === 0) continue;
    updates.push(
      supabase
        .from('qa_audit_responses')
        .update(patch)
        .eq('audit_id', req.params.auditId)
        .eq('point_id', r.point_id)
    );
  }
  const results = await Promise.all(updates);
  const err = results.find((r) => r.error)?.error;
  if (err) return res.status(500).json({ error: err.message });

  // If this audit was in edits_requested, bump back to in_progress on save
  if (audit.status === 'edits_requested') {
    await supabase.from('qa_audits').update({ status: 'in_progress' }).eq('id', audit.id);
  }

  res.json({ ok: true });
});

// DELETE /api/quality/audits/:auditId  — owner only, must be in_progress
router.delete('/:auditId', requireAuth, async (req, res) => {
  const { data: audit } = await supabase
    .from('qa_audits')
    .select('id, auditor_id, status')
    .eq('id', req.params.auditId)
    .maybeSingle();
  if (!audit) return res.status(404).json({ error: 'Not found' });
  if (audit.auditor_id !== req.user.id) return res.status(403).json({ error: 'Not your audit' });
  if (audit.status !== 'in_progress') {
    return res.status(409).json({ error: 'Only in-progress audits can be deleted' });
  }

  // Best-effort storage cleanup
  const { data: photos } = await supabase
    .from('qa_audit_photos')
    .select('storage_path')
    .eq('audit_id', audit.id);
  const paths = (photos || []).map((p) => p.storage_path).filter(Boolean);
  if (paths.length > 0) {
    const stripped = paths.map((p) => p.replace(/^qa-photos\//, ''));
    await supabase.storage.from('qa-photos').remove(stripped);
  }

  await supabase.from('qa_audit_photos').delete().eq('audit_id', audit.id);
  await supabase.from('qa_audit_responses').delete().eq('audit_id', audit.id);
  const { error } = await supabase.from('qa_audits').delete().eq('id', audit.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// POST /api/quality/audits/:auditId/submit
router.post('/:auditId/submit', requireAuth, async (req, res) => {
  const full = await loadAuditWithResponses(req.params.auditId);
  if (!full) return res.status(404).json({ error: 'Not found' });
  const { audit, responses } = full;
  if (audit.auditor_id !== req.user.id) return res.status(403).json({ error: 'Not your audit' });
  if (!['in_progress', 'edits_requested'].includes(audit.status)) {
    return res.status(409).json({ error: `Cannot submit audit in status ${audit.status}` });
  }
  const unanswered = responses.filter((r) => r.is_applicable && r.awarded_score == null);
  if (unanswered.length > 0) {
    return res.status(400).json({
      error: `${unanswered.length} unanswered point(s)`,
      unanswered_point_ids: unanswered.map((r) => r.point_id),
    });
  }
  const scores = calculateScores(responses);
  const { data, error } = await supabase
    .from('qa_audits')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      ...scores,
    })
    .eq('id', audit.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ audit: data });
});

// POST /api/quality/audits/:auditId/approve
router.post('/:auditId/approve', requireAuth, REVIEWER, async (req, res) => {
  const { data: audit } = await supabase
    .from('qa_audits')
    .select('*')
    .eq('id', req.params.auditId)
    .maybeSingle();
  if (!audit) return res.status(404).json({ error: 'Not found' });
  if (audit.status !== 'submitted') {
    return res.status(409).json({ error: `Cannot approve audit in status ${audit.status}` });
  }
  const { data, error } = await supabase
    .from('qa_audits')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      reviewed_by: req.user.id,
    })
    .eq('id', audit.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  // TODO: POST to KPI /api/achievements/store — deferred until KPI endpoint verified
  logger.info('Audit approved (KPI push deferred)', { audit_id: audit.id });

  res.json({ audit: data });
});

// POST /api/quality/audits/:auditId/request-edit  { manager_comments }
router.post('/:auditId/request-edit', requireAuth, REVIEWER, async (req, res) => {
  const { manager_comments } = req.body || {};
  if (!manager_comments) return res.status(400).json({ error: 'manager_comments required' });
  const { data: audit } = await supabase
    .from('qa_audits')
    .select('*')
    .eq('id', req.params.auditId)
    .maybeSingle();
  if (!audit) return res.status(404).json({ error: 'Not found' });
  if (audit.status !== 'submitted') {
    return res.status(409).json({ error: `Cannot request edits in status ${audit.status}` });
  }
  const { data, error } = await supabase
    .from('qa_audits')
    .update({
      status: 'edits_requested',
      edit_requested_at: new Date().toISOString(),
      reviewed_by: req.user.id,
      manager_comments,
    })
    .eq('id', audit.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ audit: data });
});

module.exports = router;
