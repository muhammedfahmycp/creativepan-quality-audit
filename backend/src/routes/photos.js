const express = require('express');
const multer = require('multer');
const supabase = require('../utils/database');
const logger = require('../utils/logger');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

const BUCKET = 'qa-photos';

// POST /api/quality/audits/:auditId/responses/:responseId/photos  (multipart "photo")
router.post(
  '/audits/:auditId/responses/:responseId/photos',
  requireAuth,
  upload.single('photo'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded (field "photo")' });

    const { auditId, responseId } = req.params;
    const { data: audit } = await supabase
      .from('qa_audits')
      .select('id, auditor_id, status')
      .eq('id', auditId)
      .maybeSingle();
    if (!audit) return res.status(404).json({ error: 'Audit not found' });
    if (audit.auditor_id !== req.user.id) return res.status(403).json({ error: 'Not your audit' });
    if (!['in_progress', 'edits_requested'].includes(audit.status)) {
      return res.status(409).json({ error: `Cannot upload in status ${audit.status}` });
    }

    const { data: response } = await supabase
      .from('qa_audit_responses')
      .select('id, audit_id')
      .eq('id', responseId)
      .maybeSingle();
    if (!response || response.audit_id !== auditId) {
      return res.status(404).json({ error: 'Response not found for audit' });
    }

    const ext = (req.file.mimetype === 'image/png' ? 'png' : 'jpg');
    const filename = `${Date.now()}.${ext}`;
    const objectPath = `${auditId}/${responseId}/${filename}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });
    if (upErr) {
      logger.error('Photo upload failed', { message: upErr.message, objectPath });
      return res.status(500).json({ error: upErr.message });
    }

    const storage_path = `${BUCKET}/${objectPath}`;
    const { data: row, error: insErr } = await supabase
      .from('qa_audit_photos')
      .insert({
        response_id: responseId,
        audit_id: auditId,
        storage_path,
        file_name: req.file.originalname || filename,
        file_size_bytes: req.file.size,
        mime_type: req.file.mimetype,
        uploaded_by: req.user.id,
      })
      .select()
      .single();
    if (insErr) {
      await supabase.storage.from(BUCKET).remove([objectPath]);
      return res.status(500).json({ error: insErr.message });
    }
    res.status(201).json({ photo: row });
  }
);

// DELETE /api/quality/photos/:photoId
router.delete('/photos/:photoId', requireAuth, async (req, res) => {
  const { data: photo } = await supabase
    .from('qa_audit_photos')
    .select('id, audit_id, storage_path')
    .eq('id', req.params.photoId)
    .maybeSingle();
  if (!photo) return res.status(404).json({ error: 'Not found' });

  const { data: audit } = await supabase
    .from('qa_audits')
    .select('auditor_id, status')
    .eq('id', photo.audit_id)
    .maybeSingle();
  if (!audit) return res.status(404).json({ error: 'Audit not found' });
  if (audit.auditor_id !== req.user.id) return res.status(403).json({ error: 'Not your audit' });
  if (!['in_progress', 'edits_requested'].includes(audit.status)) {
    return res.status(409).json({ error: `Cannot delete photo in status ${audit.status}` });
  }

  const objectPath = photo.storage_path.replace(/^qa-photos\//, '');
  await supabase.storage.from(BUCKET).remove([objectPath]);
  const { error } = await supabase.from('qa_audit_photos').delete().eq('id', photo.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// Signed-URL helper so the frontend can actually render private photos
// GET /api/quality/photos/:photoId/signed-url
router.get('/photos/:photoId/signed-url', requireAuth, async (req, res) => {
  const { data: photo } = await supabase
    .from('qa_audit_photos')
    .select('storage_path')
    .eq('id', req.params.photoId)
    .maybeSingle();
  if (!photo) return res.status(404).json({ error: 'Not found' });
  const objectPath = photo.storage_path.replace(/^qa-photos\//, '');
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(objectPath, 60 * 60);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ url: data.signedUrl });
});

module.exports = router;
