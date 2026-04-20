require('dotenv').config();
const { validateEnv } = require('./utils/env');
validateEnv();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./utils/logger');
const supabase = require('./utils/database');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'quality-audit', timestamp: new Date().toISOString() });
});

app.get('/health/db', async (req, res) => {
  const { error, count } = await supabase
    .from('qa_users')
    .select('*', { count: 'exact', head: true });
  if (error) {
    logger.error('DB health check failed', { message: error.message });
    return res.status(503).json({ status: 'error', message: error.message });
  }
  res.json({ status: 'ok', qa_users_count: count });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/quality/brands', require('./routes/brands'));
app.use('/api/quality', require('./routes/templateDesign'));
app.use('/api/quality/users', require('./routes/qaUsers'));
app.use('/api/quality/branches', require('./routes/branches'));
app.use('/api/quality/audits', require('./routes/audits'));
app.use('/api/quality', require('./routes/photos'));

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`Quality Audit API running on port ${PORT}`);
});
