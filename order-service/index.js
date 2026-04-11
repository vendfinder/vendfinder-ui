const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const Redis = require('ioredis');
const logger = require('./logger');
const { register, httpRequestsTotal, httpRequestDuration } = require('./metrics');
const { authMiddleware } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection pool
const dbUrl = process.env.DATABASE_URL || 'postgresql://vendfinder:vendfinder_pass@order-db:5432/order_db';
const pool = new Pool({
  connectionString: dbUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ...(dbUrl.includes('sslmode=') && { ssl: { rejectUnauthorized: false } }),
});

// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error', { error: err.message }));

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

// Stripe webhook needs raw body - mount BEFORE json middleware
const webhooksRouter = require('./routes/webhooks')(pool, redis);
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }), webhooksRouter);

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
      service: 'order-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      redis: redisStatus,
    });
  } catch (error) {
    res.status(503).json({
      service: 'order-service',
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

// Routes (all require auth except webhooks)
const checkoutRouter = require('./routes/checkout')(pool, redis);
const ordersRouter = require('./routes/orders')(pool, redis);
const disputesRouter = require('./routes/disputes')(pool, redis);
const payoutsRouter = require('./routes/payouts')(pool, redis);
const payoutMethodsRouter = require('./routes/payout-methods')(pool);
const statsRouter = require('./routes/stats')(pool, redis);
const publicStatsRouter = require('./routes/stats').publicStats(pool);

app.use('/checkout', authMiddleware, checkoutRouter);
app.use('/', authMiddleware, ordersRouter);
app.use('/', authMiddleware, disputesRouter);
app.use('/me/payouts', authMiddleware, payoutsRouter);
app.use('/me/payout-methods', authMiddleware, payoutMethodsRouter);
app.use('/me/stats', authMiddleware, statsRouter);
app.use('/sellers', publicStatsRouter);

// Start server
async function start() {
  try {
    await runMigrations();

    // Start payout worker (processes escrow releases + PayPal payouts)
    const startPayoutWorker = require('./payout-worker');
    startPayoutWorker(pool);

    app.listen(PORT, () => {
      logger.info(`Order service listening on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start', { error: err.message });
    process.exit(1);
  }
}

start();
