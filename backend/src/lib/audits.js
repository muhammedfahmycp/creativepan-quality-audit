const supabase = require('../utils/database');

function calculateScores(responses) {
  let total_max_score = 0;
  let total_awarded_score = 0;
  for (const r of responses) {
    if (!r.is_applicable) continue;
    total_max_score += r.max_score_snapshot || 0;
    total_awarded_score += r.awarded_score || 0;
  }
  const score_percentage =
    total_max_score > 0 ? Number(((total_awarded_score / total_max_score) * 100).toFixed(2)) : 0;
  return { total_max_score, total_awarded_score, score_percentage };
}

async function loadAuditWithResponses(auditId) {
  const { data: audit, error } = await supabase
    .from('qa_audits')
    .select('*')
    .eq('id', auditId)
    .maybeSingle();
  if (error) throw error;
  if (!audit) return null;

  const { data: responses, error: rErr } = await supabase
    .from('qa_audit_responses')
    .select('*')
    .eq('audit_id', auditId);
  if (rErr) throw rErr;

  const { data: photos, error: pErr } = await supabase
    .from('qa_audit_photos')
    .select('*')
    .eq('audit_id', auditId);
  if (pErr) throw pErr;

  return { audit, responses, photos };
}

module.exports = { calculateScores, loadAuditWithResponses };
