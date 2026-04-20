// Dev helper: mint a JWT for a qa_users row so we can curl protected routes.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/mint-jwt.js <email>');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

(async () => {
  const { data: user, error } = await supabase
    .from('qa_users')
    .select('*')
    .ilike('email', email)
    .maybeSingle();
  if (error || !user) {
    console.error('User not found:', email);
    process.exit(1);
  }
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  console.log(token);
})();
