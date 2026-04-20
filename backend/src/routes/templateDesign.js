const express = require('express');
const supabase = require('../utils/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { getCurrentTemplate } = require('../lib/templates');

const router = express.Router();

const EDITOR = requireRole('top_management', 'quality_manager');

// POST /api/quality/brands/:brandId/sections  { title }
router.post('/brands/:brandId/sections', requireAuth, EDITOR, async (req, res) => {
  const { title } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  const template = await getCurrentTemplate(req.params.brandId);
  if (!template) return res.status(404).json({ error: 'No current template' });

  const { count } = await supabase
    .from('qa_form_sections')
    .select('*', { count: 'exact', head: true })
    .eq('template_id', template.id);

  const { data, error } = await supabase
    .from('qa_form_sections')
    .insert({ template_id: template.id, title, sort_order: count || 0 })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ section: data });
});

// PUT /api/quality/sections/:sectionId  { title }
router.put('/sections/:sectionId', requireAuth, EDITOR, async (req, res) => {
  const { title } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  const { data, error } = await supabase
    .from('qa_form_sections')
    .update({ title })
    .eq('id', req.params.sectionId)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ section: data });
});

// DELETE /api/quality/sections/:sectionId
router.delete('/sections/:sectionId', requireAuth, EDITOR, async (req, res) => {
  // Points are not cascade-deleted by FK in current schema — delete explicitly
  await supabase.from('qa_form_points').delete().eq('section_id', req.params.sectionId);
  const { error } = await supabase.from('qa_form_sections').delete().eq('id', req.params.sectionId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// PUT /api/quality/brands/:brandId/sections/reorder  { order: [sectionId, ...] }
router.put('/brands/:brandId/sections/reorder', requireAuth, EDITOR, async (req, res) => {
  const { order } = req.body || {};
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order array required' });
  const updates = order.map((id, idx) =>
    supabase.from('qa_form_sections').update({ sort_order: idx }).eq('id', id)
  );
  const results = await Promise.all(updates);
  const err = results.find((r) => r.error)?.error;
  if (err) return res.status(500).json({ error: err.message });
  res.json({ ok: true });
});

// POST /api/quality/sections/:sectionId/points  { description, max_score }
router.post('/sections/:sectionId/points', requireAuth, EDITOR, async (req, res) => {
  const { description, max_score } = req.body || {};
  if (!description || max_score == null) {
    return res.status(400).json({ error: 'description and max_score required' });
  }
  const { count } = await supabase
    .from('qa_form_points')
    .select('*', { count: 'exact', head: true })
    .eq('section_id', req.params.sectionId);

  const { data, error } = await supabase
    .from('qa_form_points')
    .insert({
      section_id: req.params.sectionId,
      description,
      max_score,
      sort_order: count || 0,
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ point: data });
});

// PUT /api/quality/points/:pointId  { description?, max_score? }
router.put('/points/:pointId', requireAuth, EDITOR, async (req, res) => {
  const patch = {};
  if (req.body?.description != null) patch.description = req.body.description;
  if (req.body?.max_score != null) patch.max_score = req.body.max_score;
  if (Object.keys(patch).length === 0) return res.status(400).json({ error: 'No fields to update' });
  const { data, error } = await supabase
    .from('qa_form_points')
    .update(patch)
    .eq('id', req.params.pointId)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ point: data });
});

// DELETE /api/quality/points/:pointId
router.delete('/points/:pointId', requireAuth, EDITOR, async (req, res) => {
  const { error } = await supabase.from('qa_form_points').delete().eq('id', req.params.pointId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// PUT /api/quality/sections/:sectionId/points/reorder  { order: [...] }
router.put('/sections/:sectionId/points/reorder', requireAuth, EDITOR, async (req, res) => {
  const { order } = req.body || {};
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order array required' });
  const updates = order.map((id, idx) =>
    supabase.from('qa_form_points').update({ sort_order: idx }).eq('id', id)
  );
  const results = await Promise.all(updates);
  const err = results.find((r) => r.error)?.error;
  if (err) return res.status(500).json({ error: err.message });
  res.json({ ok: true });
});

module.exports = router;
