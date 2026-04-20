require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function listAll(bucket, prefix = '') {
  const all = [];
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error) throw error;
  for (const item of data) {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) {
      // folder — recurse
      const children = await listAll(bucket, path);
      all.push(...children);
    } else {
      all.push(path);
    }
  }
  return all;
}

async function main() {
  const bucket = 'qa-photos';
  const files = await listAll(bucket);
  console.log(`Found ${files.length} files in ${bucket}:`);
  files.forEach(f => console.log(`  ${f}`));
  if (files.length === 0) return;
  const { error } = await supabase.storage.from(bucket).remove(files);
  if (error) {
    console.error('Remove failed:', error.message);
    process.exit(1);
  }
  console.log(`Removed ${files.length} files.`);
}

main().catch(e => { console.error(e); process.exit(1); });
