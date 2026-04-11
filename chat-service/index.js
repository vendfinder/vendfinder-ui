const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const Redis = require('ioredis');
const logger = require('./logger');
const { register, httpRequestsTotal, httpRequestDuration } = require('./metrics');
const { authMiddleware } = require('./auth');
const flagging = require('./flagging');

const app = express();
const PORT = process.env.PORT || 3005;

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://vendfinder:vendfinder_pass@chat-db:5432/chat_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error', { error: err.message }));

// Initialize flagging with Redis
flagging.init(redis);

// Run migrations on startup
async function runMigrations() {
  const fs = require('fs');
  const path = require('path');
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      const { rows } = await client.query('SELECT id FROM _migrations WHERE name = $1', [file]);
      if (rows.length > 0) continue;

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      logger.info(`Applying migration ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        logger.info(`Applied migration ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error(`Migration ${file} failed`, { error: err.message });
        throw err;
      }
    }
  } finally {
    client.release();
  }
}

// Test database connection
pool.query('SELECT NOW()')
  .then(() => logger.info('Database connected'))
  .catch(err => logger.error('Database connection error', { error: err.message }));

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Request logging and metrics
app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds + nanoseconds / 1e9;
    const normalizedPath = req.path
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id');
    httpRequestsTotal.inc({ method: req.method, path: normalizedPath, status: res.statusCode });
    httpRequestDuration.observe({ method: req.method, path: normalizedPath }, duration);
  });
  next();
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    const redisStatus = redis.status === 'ready' ? 'connected' : 'disconnected';
    res.json({
      service: 'chat-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      redis: redisStatus,
    });
  } catch (error) {
    res.status(503).json({
      service: 'chat-service',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Routes (all require auth)
const conversationsRouter = require('./routes/conversations')(pool, redis);
const messagesRouter = require('./routes/messages')(pool, redis);
const offersRouter = require('./routes/offers')(pool, redis);
const reportsRouter = require('./routes/reports')(pool);

app.use('/conversations', authMiddleware, conversationsRouter);
app.use('/conversations/:id/messages', authMiddleware, messagesRouter);
app.use('/conversations/:id/offers', authMiddleware, offersRouter);
app.use('/offers', authMiddleware, offersRouter);
app.use('/messages/:id/report', authMiddleware, reportsRouter);

// Start server
async function start() {
  try {
    await runMigrations();
    await flagging.ensureBlocklist();
    app.listen(PORT, () => {
      logger.info(`Chat service listening on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start', { error: err.message });
    process.exit(1);
  }
}

start();
