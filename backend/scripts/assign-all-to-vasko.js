require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

(async () => {
  const { data: brand } = await supabase.from('qa_brands').select('id, name').eq('slug', 'vasko').single();
  const { data: branches } = await supabase.from('branches').select('id, name').eq('is_active', true);
  console.log(`Assigning ${branches.length} branches to ${brand.name}...`);
  const rows = branches.map((b) => ({ brand_id: brand.id, branch_id: b.id }));
  const { error } = await supabase.from('qa_brand_branches').upsert(rows, { onConflict: 'brand_id,branch_id' });
  if (error) { console.error(error); process.exit(1); }

  const { count } = await supabase
    .from('qa_brand_branches')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', brand.id);
  console.log(`Vasko now has ${count} branches assigned.`);
})().catch((e) => { console.error(e); process.exit(1); });
