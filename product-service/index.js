const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const Redis = require('ioredis');
const logger = require('./logger');
const { register, httpRequestsTotal, httpRequestDuration } = require('./metrics');
const { authMiddleware, optionalAuth } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection pool
const dbUrl = process.env.DATABASE_URL || 'postgresql://vendfinder:vendfinder_pass@product-db:5432/product_db';
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
      service: 'product-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      redis: redisStatus,
    });
  } catch (error) {
    res.status(503).json({
      service: 'product-service',
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

// Routes
const productsRouter = require('./routes/products')(pool, redis);
const asksRouter = require('./routes/asks')(pool, redis);
const bidsRouter = require('./routes/bids')(pool, redis);
const favoritesRouter = require('./routes/favorites')(pool, redis);
const salesHistoryRouter = require('./routes/sales-history')(pool, redis);
const priceAlertsRouter = require('./routes/price-alerts')(pool, redis);
const featuredRouter = require('./routes/featured')(pool, redis);
const sponsoredRouter = require('./routes/sponsored')(pool, redis);
const reportsRouter = require('./routes/reports')(pool);

// Featured product slots (must be mounted BEFORE products router to avoid :id conflict)
app.use('/featured', featuredRouter);
app.use('/sponsored', sponsoredRouter);
app.use('/reports', reportsRouter);
app.use('/me/reports', reportsRouter);

// Public routes (optional auth for personalization)
app.get('/categories', (req, res, next) => productsRouter.handle(req, res, next));
app.use('/', productsRouter);

// Ask/bid routes mounted under products
app.use('/', asksRouter);

// Bid routes
app.use('/', bidsRouter);

// Favorite routes
app.use('/', favoritesRouter);

// Sales history and market data routes
app.use('/', salesHistoryRouter);

// Internal routes (service-to-service, no auth)
const internalSalesRouter = require('./routes/internal-sales')(pool);
app.use('/internal', internalSalesRouter);

// Price alerts routes
app.use('/', priceAlertsRouter);

// Start server
async function start() {
  try {
    await runMigrations();
    app.listen(PORT, () => {
      logger.info(`Product service listening on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start', { error: err.message });
    process.exit(1);
  }
}

start();
