const jwt = require('jsonwebtoken');
const supabase = require('../utils/database');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { data: user, error } = await supabase
    .from('qa_users')
    .select('id, email, name, role, avatar_url, is_active')
    .eq('id', payload.sub)
    .maybeSingle();
  if (error) return res.status(500).json({ error: 'Auth lookup failed' });
  if (!user || !user.is_active) return res.status(401).json({ error: 'User inactive or not found' });

  req.user = user;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    // top_management is a super-role: bypasses role gates (ownership checks still apply)
    if (req.user.role === 'top_management') return next();
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
