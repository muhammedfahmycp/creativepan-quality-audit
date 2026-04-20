require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function probe(table) {
  const { data, error } = await supabase.from(table).select('*').limit(1);
  if (error) {
    if (error.code === '42P01' || /does not exist|Could not find the table|schema cache/i.test(error.message)) {
      return { exists: false };
    }
    return { exists: false, error: error.message };
  }
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
  const cols = data && data.length > 0 ? Object.keys(data[0]) : [];
  return { exists: true, count, cols };
}

async function main() {
  const tables = [
    'qa_brands', 'qa_form_templates', 'qa_form_sections', 'qa_form_points',
    'qa_audits', 'qa_audit_responses', 'qa_audit_photos',
    'qa_users', 'qa_user_roles',
  ];
  for (const t of tables) {
    const r = await probe(t);
    if (!r.exists) { console.log(`[missing] ${t}`); continue; }
    console.log(`[${t}] rows=${r.count} cols=[${r.cols.join(', ')}]`);
  }

  const { data: qaUsers } = await supabase.from('qa_users').select('*');
  console.log('\nqa_users rows:');
  (qaUsers || []).forEach(u => console.log(`  ${u.email} — ${u.name} — ${u.role} — active=${u.is_active}`));
}

main().catch(e => { console.error(e); process.exit(1); });
