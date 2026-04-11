require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { generateToken, authMiddleware } = require('./auth');
const { verifyGoogleToken, verifyAppleToken } = require('./oauth-verifier');
const promClient = require('prom-client');

// KYC (Know Your Customer) modules
const { initializeBucket, testConnection } = require('./spaces');
const { initializeVision } = require('./ocr');
const kycRoutes = require('./routes/kyc');

const app = express();
const PORT = process.env.PORT || 3004;
const SALT_ROUNDS = 10;

// TOS version tracking - bump version when TOS changes to re-prompt acceptance
const TOS_VERSIONS = {
  buyer: 'buyer-v1',
  seller: 'seller-v1',
  admin: 'buyer-v1'
};

// Inter-service URLs for subscription status lookup
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3007';
const VENDOR_SERVICE_URL = process.env.VENDOR_SERVICE_URL || 'http://vendor-service:3001';
const SLACK_SIGNUP_WEBHOOK_URL = process.env.SLACK_SIGNUP_WEBHOOK_URL;

// Helper: fetch subscription status for seller users
async function getSellerSubscriptionStatus(userId) {
  try {
    const fetch = (await import('node-fetch')).default;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const vendorRes = await fetch(`${VENDOR_SERVICE_URL}/vendors/by-user/${userId}`, { signal: controller.signal });
    if (vendorRes.ok) {
      const vendor = await vendorRes.json();
      const subRes = await fetch(`${ORDER_SERVICE_URL}/subscriptions/vendor/${vendor.id}/status`, { signal: controller.signal });
      if (subRes.ok) {
        const subData = await subRes.json();
        clearTimeout(timeout);
        return subData.status;
      }
    }
    clearTimeout(timeout);
  } catch (err) {
    console.error('Failed to fetch subscription status:', err);
  }
  return null;
}

// ============================================
// Structured Logger for Loki
// ============================================
const logger = {
  log(level, message, context = {}) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      service: 'user-service',
      msg: message,
      ...context
    }));
  },
  info(message, context = {}) { this.log('info', message, context); },
  warn(message, context = {}) { this.log('warn', message, context); },
  error(message, context = {}) { this.log('error', message, context); },
  userAction(action, userId, userEmail, userName, details = {}) {
    this.log('info', `${userName}: ${action}`, {
      action,
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      ...details
    });
  }
};

// ============================================
// Prometheus Metrics Setup
// ============================================
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register, prefix: 'vendfinder_' });

// HTTP metrics
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register]
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.5, 1, 5],
  registers: [register]
});

// Business metrics
const authAttemptsTotal = new promClient.Counter({
  name: 'vendfinder_auth_attempts_total',
  help: 'Total authentication attempts',
  labelNames: ['status'],
  registers: [register]
});

const usersRegisteredTotal = new promClient.Counter({
  name: 'vendfinder_users_registered_total',
  help: 'Total users registered',
  labelNames: ['role'],
  registers: [register]
});

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://vendfinder:vendfinder_pass@user-db:5432/user_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const fs = require('fs');
const path = require('path');

// Auto-run migrations on startup
async function runMigrations() {
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
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found, skipping');
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const { rows } = await client.query(
        'SELECT id FROM _migrations WHERE name = $1',
        [file]
      );
      if (rows.length > 0) {
        console.log(`Migration ${file} already applied, skipping`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`Applying migration ${file}...`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`Applied migration ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Failed to apply migration ${file}:`, err.message);
        throw err;
      }
    }
    console.log('All migrations applied successfully');
  } finally {
    client.release();
  }
}

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Stripe webhook — must be before express.json() for raw body
app.post('/auth/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const Stripe = require('stripe');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (webhookSecret) {
      const sig = req.headers['stripe-signature'];
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.user_id;
        if (userId) {
          const isActive = subscription.status === 'active';
          await pool.query(
            `UPDATE users SET
              subscription_status = $1,
              subscription_current_period_end = to_timestamp($2),
              seller_fee_paid = $3
            WHERE id = $4`,
            [subscription.status, subscription.current_period_end, isActive, userId]
          );
          console.log(`Subscription ${event.type} for user ${userId}: ${subscription.status}`);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subId = invoice.subscription;
        if (subId) {
          // Mark user's subscription as past_due
          await pool.query(
            "UPDATE users SET subscription_status = 'past_due' WHERE stripe_subscription_id = $1",
            [subId]
          );
          console.log(`Payment failed for subscription ${subId}`);
        }
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object;
        const subId = invoice.subscription;
        if (subId) {
          const subscription = await stripe.subscriptions.retrieve(subId);
          const userId = subscription.metadata?.user_id;
          if (userId) {
            await pool.query(
              `UPDATE users SET
                subscription_status = 'active',
                subscription_current_period_end = to_timestamp($1),
                seller_fee_paid = TRUE
              WHERE id = $2`,
              [subscription.current_period_end, userId]
            );
            console.log(`Invoice paid, subscription renewed for user ${userId}`);
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  res.json({ received: true });
});

app.use(express.json());

// Request logging and metrics middleware
app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds + nanoseconds / 1e9;
    const durationMs = Math.round(duration * 1000);
    // Normalize path: replace UUIDs
    const normalizedPath = req.path
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id');
    httpRequestsTotal.inc({ method: req.method, path: normalizedPath, status: res.statusCode });
    httpRequestDuration.observe({ method: req.method, path: normalizedPath }, duration);
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${durationMs}ms`);
  });
  next();
});

// ============================================
// Health Check & Metrics
// ============================================
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      service: 'user-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      service: 'user-service',
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// ============================================
// HELPERS
// ============================================

// Serialize a DB row into a consistent user object for API responses
function serializeUser(row) {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    role: row.role,
    displayName: row.display_name || null,
    avatarUrl: row.avatar_url || null,
    bannerUrl: row.banner_url || null,
    bio: row.bio || null,
    location: row.location || null,
    verified: row.verified || false,
    sellerLevel: row.seller_level || 0,
    profileViews: row.profile_views || 0,
    followingCount: row.following_count || 0,
    followersCount: row.followers_count || 0,
    socialInstagram: row.social_instagram || null,
    socialTwitter: row.social_twitter || null,
    socialWebsite: row.social_website || null,
    trialEndsAt: row.trial_ends_at || null,
    sellerFeePaid: row.seller_fee_paid || false,
    sellerFeePaidAt: row.seller_fee_paid_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Full SELECT for user profile queries
const USER_SELECT_FIELDS = `id, email, password_hash, username, role, is_active, created_at, updated_at,
  tos_accepted_at, tos_version, auth_provider, auth_provider_id, avatar_url, banner_url,
  display_name, bio, location, verified, seller_level, profile_views,
  following_count, followers_count, social_instagram, social_twitter, social_website,
  trial_ends_at, seller_fee_paid, seller_fee_paid_at`;

// ============================================
// AUTH ROUTES
// ============================================

// POST /auth/register - Register new user
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, username, role = 'buyer', tosAccepted } = req.body;

    // Validate required fields
    if (!email || !password || !username) {
      return res.status(400).json({
        error: 'Email, password, and username are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Require TOS acceptance
    if (!tosAccepted) {
      return res.status(400).json({
        error: 'You must accept the Terms of Service to create an account',
        code: 'TOS_NOT_ACCEPTED'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters',
        code: 'WEAK_PASSWORD'
      });
    }

    // Validate username length
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({
        error: 'Username must be between 3 and 30 characters',
        code: 'INVALID_USERNAME'
      });
    }

    // Validate role
    const validRoles = ['buyer', 'seller', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: `Role must be one of: ${validRoles.join(', ')}`,
        code: 'INVALID_ROLE'
      });
    }

    // Check if email already exists
    const existingEmail = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (existingEmail.rows.length > 0) {
      return res.status(409).json({
        error: 'Email already registered',
        code: 'EMAIL_EXISTS'
      });
    }

    // Check if username already exists
    const existingUsername = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username.toLowerCase()]
    );
    if (existingUsername.rows.length > 0) {
      return res.status(409).json({
        error: 'Username already taken',
        code: 'USERNAME_EXISTS'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user with TOS acceptance
    const tosVersion = TOS_VERSIONS[role] || TOS_VERSIONS.buyer;
    const isSeller = role === 'seller';
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, username, role, tos_accepted_at, tos_version, trial_ends_at)
       VALUES ($1, $2, $3, $4, NOW(), $5, ${isSeller ? "NOW() + INTERVAL '7 days'" : 'NULL'})
       RETURNING ${USER_SELECT_FIELDS}`,
      [email.toLowerCase(), passwordHash, username.toLowerCase(), role, tosVersion]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    // Track successful registration
    usersRegisteredTotal.inc({ role: user.role });

    // Structured log for Loki
    logger.userAction('registered', user.id, user.email, user.username, { role: user.role });

    // Fire-and-forget: send welcome email
    try {
      const fetch = (await import('node-fetch')).default;
      await fetch(`${EMAIL_SERVICE_URL}/emails/welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, username: user.username, role: user.role })
      });
      logger.info('Welcome email sent', { userId: user.id });
    } catch (emailErr) {
      logger.error('Failed to send welcome email', { error: emailErr.message, userId: user.id });
    }

    // Fire-and-forget: Slack signup notification
    if (SLACK_SIGNUP_WEBHOOK_URL) {
      try {
        const fetch = (await import('node-fetch')).default;
        const isSeller = user.role === 'seller';
        await fetch(SLACK_SIGNUP_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attachments: [{
              color: isSeller ? '#10b981' : '#3c7cfb',
              blocks: [
                { type: 'header', text: { type: 'plain_text', text: `${isSeller ? '\uD83C\uDFEA' : '\uD83D\uDECD\uFE0F'} New ${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Signup` } },
                { type: 'section', fields: [
                  { type: 'mrkdwn', text: `*Username:*\n${user.username}` },
                  { type: 'mrkdwn', text: `*Email:*\n${user.email}` },
                  { type: 'mrkdwn', text: `*Role:*\n${user.role}` },
                  ...(isSeller && req.body.region ? [{ type: 'mrkdwn', text: `*Region:*\n${req.body.region}` }] : [])
                ]},
                { type: 'context', elements: [{ type: 'mrkdwn', text: `Signed up at ${new Date().toISOString()}` }] }
              ]
            }]
          })
        });
        logger.info('Slack signup notification sent', { userId: user.id });
      } catch (slackErr) {
        logger.error('Failed to send Slack notification', { error: slackErr.message, userId: user.id });
      }
    }

    const serialized = serializeUser(user);
    serialized.tosAccepted = user.tos_version === TOS_VERSIONS[user.role];

    res.status(201).json({
      message: 'User registered successfully',
      user: serialized,
      token
    });
  } catch (error) {
    logger.error('Registration failed', { error: error.message });
    res.status(500).json({
      error: 'Failed to register user',
      code: 'REGISTRATION_ERROR'
    });
  }
});

// POST /auth/login - Login user
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Find user by email
    const result = await pool.query(
      `SELECT ${USER_SELECT_FIELDS} FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      authAttemptsTotal.inc({ status: 'failure' });
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = result.rows[0];

    // Check if account is disabled
    if (user.is_active === false) {
      authAttemptsTotal.inc({ status: 'disabled' });
      return res.status(403).json({
        error: 'Account is disabled. Please contact support.',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      authAttemptsTotal.inc({ status: 'failure' });
      return res.status(401).json({
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const token = generateToken(user);

    // Track successful login
    authAttemptsTotal.inc({ status: 'success' });

    // Structured log for Loki
    logger.userAction('login', user.id, user.email, user.username, { role: user.role });

    // For sellers, include subscription status
    let subscriptionStatus = null;
    if (user.role === 'seller') {
      subscriptionStatus = await getSellerSubscriptionStatus(user.id);
    }

    const serialized = serializeUser(user);
    serialized.tosAccepted = user.tos_version === TOS_VERSIONS[user.role];
    serialized.subscriptionStatus = subscriptionStatus;

    res.json({
      message: 'Login successful',
      user: serialized,
      token
    });
  } catch (error) {
    logger.error('Login failed', { error: error.message, email: req.body?.email });
    authAttemptsTotal.inc({ status: 'error' });
    res.status(500).json({
      error: 'Failed to login',
      code: 'LOGIN_ERROR'
    });
  }
});

// POST /auth/oauth - OAuth login (Google / Apple)
app.post('/auth/oauth', async (req, res) => {
  try {
    const { provider, token, name } = req.body;

    if (!provider || !token) {
      return res.status(400).json({
        error: 'Provider and token are required',
        code: 'MISSING_FIELDS'
      });
    }

    if (!['google', 'apple'].includes(provider)) {
      return res.status(400).json({
        error: 'Provider must be "google" or "apple"',
        code: 'INVALID_PROVIDER'
      });
    }

    // Verify the OAuth token with the provider
    let oauthUser;
    try {
      if (provider === 'google') {
        oauthUser = await verifyGoogleToken(token);
      } else {
        oauthUser = await verifyAppleToken(token);
      }
    } catch (verifyError) {
      logger.error('OAuth token verification failed', { provider, error: verifyError.message });
      return res.status(401).json({
        error: 'Invalid or expired OAuth token',
        code: 'INVALID_OAUTH_TOKEN'
      });
    }

    const email = oauthUser.email.toLowerCase();
    const displayName = oauthUser.name || name || email.split('@')[0];
    const username = displayName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || email.split('@')[0].replace(/[^a-z0-9]/g, '');

    // Check if user exists by email
    const existingUser = await pool.query(
      `SELECT ${USER_SELECT_FIELDS} FROM users WHERE email = $1`,
      [email]
    );

    let user;

    if (existingUser.rows.length > 0) {
      // Existing user — link OAuth provider if not already linked
      user = existingUser.rows[0];

      if (user.is_active === false) {
        return res.status(403).json({
          error: 'Account is disabled. Please contact support.',
          code: 'ACCOUNT_DISABLED'
        });
      }

      // Link the OAuth provider to the existing account
      if (user.auth_provider === 'email' || user.auth_provider !== provider) {
        await pool.query(
          'UPDATE users SET auth_provider = $1, auth_provider_id = $2, avatar_url = COALESCE(avatar_url, $3), updated_at = NOW() WHERE id = $4',
          [provider, oauthUser.providerId, oauthUser.avatarUrl, user.id]
        );
      }

      logger.userAction('oauth login', user.id, user.email, user.username, { provider });
    } else {
      // New user — create account
      // Generate a unique username
      let finalUsername = username;
      let suffix = 1;
      while (true) {
        const usernameCheck = await pool.query('SELECT id FROM users WHERE username = $1', [finalUsername]);
        if (usernameCheck.rows.length === 0) break;
        finalUsername = `${username}${suffix++}`;
      }

      const tosVersion = TOS_VERSIONS.buyer;
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, username, role, auth_provider, auth_provider_id, avatar_url, display_name, tos_accepted_at, tos_version)
         VALUES ($1, NULL, $2, 'buyer', $3, $4, $5, $6, NOW(), $7)
         RETURNING ${USER_SELECT_FIELDS}`,
        [email, finalUsername, provider, oauthUser.providerId, oauthUser.avatarUrl, displayName, tosVersion]
      );

      user = result.rows[0];

      // Track registration
      usersRegisteredTotal.inc({ role: 'buyer' });
      logger.userAction('oauth registered', user.id, user.email, user.username, { provider });

      // Fire-and-forget: Slack notification
      if (SLACK_SIGNUP_WEBHOOK_URL) {
        try {
          const fetch = (await import('node-fetch')).default;
          await fetch(SLACK_SIGNUP_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              attachments: [{
                color: '#3c7cfb',
                blocks: [
                  { type: 'header', text: { type: 'plain_text', text: `\uD83D\uDD11 New OAuth Signup (${provider})` } },
                  { type: 'section', fields: [
                    { type: 'mrkdwn', text: `*Username:*\n${user.username}` },
                    { type: 'mrkdwn', text: `*Email:*\n${user.email}` },
                    { type: 'mrkdwn', text: `*Provider:*\n${provider}` }
                  ]}
                ]
              }]
            })
          });
        } catch (slackErr) {
          logger.error('Failed to send Slack notification', { error: slackErr.message });
        }
      }
    }

    const jwtToken = generateToken(user);

    // Track successful auth
    authAttemptsTotal.inc({ status: 'success' });

    // For sellers, include subscription status
    let subscriptionStatus = null;
    if (user.role === 'seller') {
      subscriptionStatus = await getSellerSubscriptionStatus(user.id);
    }

    const serialized = serializeUser(user);
    serialized.tosAccepted = user.tos_version === TOS_VERSIONS[user.role];
    serialized.subscriptionStatus = subscriptionStatus;

    res.json({
      message: 'OAuth login successful',
      user: serialized,
      token: jwtToken
    });
  } catch (error) {
    logger.error('OAuth login failed', { error: error.message });
    authAttemptsTotal.inc({ status: 'error' });
    res.status(500).json({
      error: 'Failed to process OAuth login',
      code: 'OAUTH_ERROR'
    });
  }
});

// GET /auth/me - Get current user (requires JWT)
app.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${USER_SELECT_FIELDS} FROM users WHERE id = $1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];

    // Check if account is disabled
    if (user.is_active === false) {
      return res.status(403).json({
        error: 'Account is disabled. Please contact support.',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // For sellers, include subscription status
    let subscriptionStatus = null;
    if (user.role === 'seller') {
      subscriptionStatus = await getSellerSubscriptionStatus(user.id);
    }

    const serialized = serializeUser(user);
    serialized.isActive = user.is_active !== false;
    serialized.tosAccepted = user.tos_version === TOS_VERSIONS[user.role];
    serialized.subscriptionStatus = subscriptionStatus;

    res.json(serialized);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      code: 'FETCH_ERROR'
    });
  }
});

// DELETE /auth/account - Delete user account (App Store requirement, requires JWT)
app.delete('/auth/account', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Verify user exists
    const userResult = await pool.query('SELECT id, email, username, role FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];

    // Delete user record (cascade will handle related data)
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    logger.userAction('deleted account', userId, user.email, user.username);

    res.json({
      message: 'Account deleted successfully',
      code: 'ACCOUNT_DELETED'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      error: 'Failed to delete account',
      code: 'DELETE_ERROR'
    });
  }
});

// POST /auth/accept-tos - Accept Terms of Service (requires JWT)
app.post('/auth/accept-tos', authMiddleware, async (req, res) => {
  try {
    const userRole = req.user.role;
    const tosVersion = TOS_VERSIONS[userRole] || TOS_VERSIONS.buyer;

    const result = await pool.query(
      `UPDATE users SET tos_accepted_at = NOW(), tos_version = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, username, role, tos_accepted_at, tos_version`,
      [tosVersion, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = result.rows[0];
    logger.userAction('accepted TOS', user.id, user.email, user.username, { tosVersion });

    res.json({
      message: 'Terms of Service accepted',
      tosAccepted: true,
      tosVersion: user.tos_version
    });
  } catch (error) {
    logger.error('Accept TOS error', { error: error.message, userId: req.user.userId });
    res.status(500).json({
      error: 'Failed to accept Terms of Service',
      code: 'TOS_ERROR'
    });
  }
});

// ============================================
// USER ROUTES
// ============================================

// Helper function to get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        error: 'Invalid user ID format',
        code: 'INVALID_ID'
      });
    }

    const result = await pool.query(
      `SELECT ${USER_SELECT_FIELDS} FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json(serializeUser(result.rows[0]));
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      code: 'FETCH_ERROR'
    });
  }
};

// GET /auth/users/:id - Get user by ID (alias for internal service calls)
app.get('/auth/users/:id', getUserById);

// GET /users/:id - Get user by ID
app.get('/users/:id', getUserById);

// PUT /users/:id - Update user profile (requires JWT, must be owner or admin)
app.put('/users/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, displayName, bio, location, socialInstagram, socialTwitter, socialWebsite, avatarUrl, bannerUrl } = req.body;

    // Check if user is updating their own profile or is admin
    if (req.user.userId !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'You can only update your own profile',
        code: 'FORBIDDEN'
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username) {
      // Check if username is taken by another user
      const existingUsername = await pool.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username.toLowerCase(), id]
      );
      if (existingUsername.rows.length > 0) {
        return res.status(409).json({
          error: 'Username already taken',
          code: 'USERNAME_EXISTS'
        });
      }
      updates.push(`username = $${paramCount++}`);
      values.push(username.toLowerCase());
    }

    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Invalid email format',
          code: 'INVALID_EMAIL'
        });
      }
      // Check if email is taken by another user
      const existingEmail = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email.toLowerCase(), id]
      );
      if (existingEmail.rows.length > 0) {
        return res.status(409).json({
          error: 'Email already registered',
          code: 'EMAIL_EXISTS'
        });
      }
      updates.push(`email = $${paramCount++}`);
      values.push(email.toLowerCase());
    }

    // Profile fields (allow setting to empty string to clear)
    if (displayName !== undefined) {
      updates.push(`display_name = $${paramCount++}`);
      values.push(displayName || null);
    }
    if (bio !== undefined) {
      updates.push(`bio = $${paramCount++}`);
      values.push(bio || null);
    }
    if (location !== undefined) {
      updates.push(`location = $${paramCount++}`);
      values.push(location || null);
    }
    if (socialInstagram !== undefined) {
      updates.push(`social_instagram = $${paramCount++}`);
      values.push(socialInstagram || null);
    }
    if (socialTwitter !== undefined) {
      updates.push(`social_twitter = $${paramCount++}`);
      values.push(socialTwitter || null);
    }
    if (socialWebsite !== undefined) {
      updates.push(`social_website = $${paramCount++}`);
      values.push(socialWebsite || null);
    }
    if (avatarUrl !== undefined) {
      updates.push(`avatar_url = $${paramCount++}`);
      values.push(avatarUrl || null);
    }
    if (bannerUrl !== undefined) {
      updates.push(`banner_url = $${paramCount++}`);
      values.push(bannerUrl || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update',
        code: 'NO_UPDATES'
      });
    }

    // Add updated_at
    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING ${USER_SELECT_FIELDS}
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      message: 'User updated successfully',
      user: serializeUser(result.rows[0])
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      error: 'Failed to update user',
      code: 'UPDATE_ERROR'
    });
  }
});

// GET /users/:id/verification - Public badge/verification data (no auth)
app.get('/users/:id/verification', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT subscription_status, subscription_tier, subscription_current_period_end, verified, kyc_status FROM users WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.json({ tier: null, subscriptionActive: false, verified: false, kycVerified: false });
    }
    const user = result.rows[0];
    const now = new Date();
    const periodEnd = user.subscription_current_period_end ? new Date(user.subscription_current_period_end) : null;
    const subscriptionActive = user.subscription_status === 'active' && periodEnd && now < periodEnd;
    res.json({
      userId: id,
      tier: user.subscription_tier || null,
      subscriptionActive: !!subscriptionActive,
      verified: !!user.verified,
      kycVerified: user.kyc_status === 'verified',
    });
  } catch (error) {
    console.error('Verification lookup error:', error);
    res.status(500).json({ error: 'Failed to fetch verification' });
  }
});

// GET /users/by-username/:username - Public profile lookup by username
app.get('/users/by-username/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const result = await pool.query(
      `SELECT ${USER_SELECT_FIELDS} FROM users WHERE username = $1 AND is_active = true`,
      [username.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Increment profile views
    await pool.query(
      'UPDATE users SET profile_views = profile_views + 1 WHERE id = $1',
      [result.rows[0].id]
    );

    const serialized = serializeUser(result.rows[0]);
    serialized.profileViews = (result.rows[0].profile_views || 0) + 1;
    // Don't expose email on public profiles
    delete serialized.email;

    res.json(serialized);
  } catch (error) {
    console.error('Get user by username error:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      code: 'FETCH_ERROR'
    });
  }
});

// ============================================
// SELLER STATUS & FEE ENDPOINTS
// ============================================

const TIER_CONFIG = {
  standard: {
    priceCents: 10000,
    label: 'Standard',
    freeFeaturedSlots: 0,
    freeFeaturedDuration: 0,
    support: 'standard',
    analytics: 'basic',
    bulkUpload: false,
  },
  pro: {
    priceCents: 29900,
    label: 'Pro',
    freeFeaturedSlots: 2,
    freeFeaturedDuration: 1,
    support: 'priority',
    analytics: 'advanced',
    bulkUpload: false,
  },
  enterprise: {
    priceCents: 79900,
    label: 'Enterprise',
    freeFeaturedSlots: 5,
    freeFeaturedDuration: 3,
    support: 'dedicated',
    analytics: 'advanced',
    bulkUpload: true,
  },
};

// GET /auth/subscription-tiers — public tier config
app.get('/auth/subscription-tiers', (req, res) => {
  res.json({ tiers: TIER_CONFIG });
});

// GET /auth/seller-status — Check seller subscription status (platform-managed 30-day cycle)
app.get('/auth/seller-status', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT role, subscription_status, subscription_current_period_end, subscription_tier, free_featured_slots_used FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (user.role !== 'seller') {
      return res.json({ role: user.role || 'buyer', canList: false });
    }

    const now = new Date();
    const periodEnd = user.subscription_current_period_end ? new Date(user.subscription_current_period_end) : null;
    const isActive = user.subscription_status === 'active' && periodEnd && now < periodEnd;
    const daysRemaining = periodEnd ? Math.max(0, Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24))) : 0;
    const renewalSoon = isActive && daysRemaining <= 10;
    const tier = user.subscription_tier || 'standard';
    const tierBenefits = TIER_CONFIG[tier] || TIER_CONFIG.standard;
    const freeFeaturedSlotsRemaining = Math.max(0, (tierBenefits.freeFeaturedSlots || 0) - (user.free_featured_slots_used || 0));

    res.json({
      role: 'seller',
      canList: !!isActive,
      subscriptionStatus: user.subscription_status || null,
      daysRemaining: isActive ? daysRemaining : 0,
      renewalSoon,
      periodEnd: user.subscription_current_period_end,
      tier,
      tierBenefits,
      freeFeaturedSlotsRemaining,
    });
  } catch (error) {
    console.error('Seller status error:', error);
    res.status(500).json({ error: 'Failed to check seller status' });
  }
});

// POST /auth/seller-fee — Create Stripe Checkout for tier-based payment (30-day access)
app.post('/auth/seller-fee', authMiddleware, async (req, res) => {
  try {
    const { tier = 'standard' } = req.body;
    const tierConfig = TIER_CONFIG[tier];
    if (!tierConfig) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'alipay'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `VendFinder ${tierConfig.label} Seller — 30 Days`,
            description: `${tierConfig.label} tier seller access for 30 days. Auto-billed every 30 days.`,
          },
          unit_amount: tierConfig.priceCents,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'https://vendfinder.com'}/dashboard?seller_activated=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://vendfinder.com'}/dashboard/selling`,
      metadata: {
        user_id: req.user.userId,
        type: 'seller_fee',
        tier,
      },
    });

    res.json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Seller fee checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /auth/seller-fee/confirm — Confirm payment and activate 30-day seller access
app.post('/auth/seller-fee/confirm', authMiddleware, async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    if (session.metadata.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Session does not belong to this user' });
    }

    const tier = session.metadata.tier || 'standard';
    if (!TIER_CONFIG[tier]) {
      return res.status(400).json({ error: 'Invalid tier in session' });
    }

    const { rows: [currentUser] } = await pool.query(
      'SELECT subscription_current_period_end, subscription_status FROM users WHERE id = $1',
      [req.user.userId]
    );

    const now = new Date();
    let startFrom = now;
    if (currentUser?.subscription_status === 'active' && currentUser?.subscription_current_period_end) {
      const currentEnd = new Date(currentUser.subscription_current_period_end);
      if (currentEnd > now) {
        startFrom = currentEnd;
      }
    }

    const newPeriodEnd = new Date(startFrom);
    newPeriodEnd.setDate(newPeriodEnd.getDate() + 30);

    // Upgrade buyer to seller and activate subscription (reset free slot usage on new cycle)
    await pool.query(
      `UPDATE users SET
        role = 'seller',
        seller_fee_paid = TRUE, seller_fee_paid_at = NOW(),
        subscription_status = 'active',
        subscription_current_period_end = $1,
        subscription_tier = $2,
        free_featured_slots_used = 0,
        free_featured_slots_cycle_start = NOW()
      WHERE id = $3`,
      [newPeriodEnd.toISOString(), tier, req.user.userId]
    );

    res.json({ success: true, message: `Seller access activated (${TIER_CONFIG[tier].label} tier)`, periodEnd: newPeriodEnd, tier });
  } catch (error) {
    console.error('Seller fee confirm error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// ============================================
// KYC ENDPOINTS
// ============================================

const KYC_GRACE_DAYS = 14;
const KYC_THRESHOLD_30D_CENTS = 1_000_000; // $10,000
const KYC_THRESHOLD_LIFETIME_CENTS = 5_000_000; // $50,000
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

async function sendKycSlackAlert(title, user, details) {
  if (!process.env.SLACK_SIGNUP_WEBHOOK_URL) return;
  try {
    const fetch = (await import('node-fetch')).default;
    await fetch(process.env.SLACK_SIGNUP_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [{
          color: '#a855f7',
          blocks: [
            { type: 'header', text: { type: 'plain_text', text: `🆔 ${title}` } },
            {
              type: 'section', fields: [
                { type: 'mrkdwn', text: `*User:*\n${user.username} (${user.email})` },
                { type: 'mrkdwn', text: `*User ID:*\n\`${user.id}\`` },
                ...Object.entries(details).map(([k, v]) => ({ type: 'mrkdwn', text: `*${k}:*\n${v}` })),
              ],
            },
            { type: 'context', elements: [{ type: 'mrkdwn', text: `At ${new Date().toISOString()}` }] },
          ],
        }],
      }),
    });
  } catch (err) {
    console.error('KYC Slack alert failed:', err.message);
  }
}

// GET /auth/kyc-status — check current user's KYC status
app.get('/auth/kyc-status', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT kyc_status, kyc_required_at, kyc_submitted_at, kyc_verified_at FROM users WHERE id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = result.rows[0];
    const now = new Date();
    let daysRemaining = 0;
    let gracePeriodExpired = false;
    if (user.kyc_status === 'required' && user.kyc_required_at) {
      const requiredAt = new Date(user.kyc_required_at);
      const msSince = now.getTime() - requiredAt.getTime();
      const daysSince = Math.floor(msSince / (1000 * 60 * 60 * 24));
      daysRemaining = Math.max(0, KYC_GRACE_DAYS - daysSince);
      gracePeriodExpired = daysSince >= KYC_GRACE_DAYS;
    }
    res.json({
      status: user.kyc_status || 'not_required',
      requiredAt: user.kyc_required_at,
      submittedAt: user.kyc_submitted_at,
      verifiedAt: user.kyc_verified_at,
      daysRemaining,
      gracePeriodExpired,
    });
  } catch (error) {
    console.error('KYC status error:', error);
    res.status(500).json({ error: 'Failed to fetch KYC status' });
  }
});

// POST /auth/kyc-submit — submit KYC business info
app.post('/auth/kyc-submit', authMiddleware, async (req, res) => {
  try {
    const { business_name, business_address, tax_id, country } = req.body;
    if (!business_name || !business_address || !tax_id || !country) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (country.length < 2 || country.length > 10) {
      return res.status(400).json({ error: 'Invalid country code' });
    }

    const result = await pool.query(
      `UPDATE users SET
        kyc_status = 'submitted', kyc_submitted_at = NOW(),
        kyc_business_name = $1, kyc_business_address = $2,
        kyc_tax_id = $3, kyc_country = $4
      WHERE id = $5 AND kyc_status IN ('required', 'rejected')
      RETURNING id, email, username`,
      [business_name, business_address, tax_id, country.toUpperCase(), req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'KYC is not required or already submitted' });
    }

    const user = result.rows[0];
    sendKycSlackAlert('KYC Submitted for Review', user, {
      'Business Name': business_name,
      'Business Address': business_address,
      'Tax ID': tax_id,
      'Country': country.toUpperCase(),
    }).catch(() => {});

    res.json({ status: 'submitted', submittedAt: new Date() });
  } catch (error) {
    console.error('KYC submit error:', error);
    res.status(500).json({ error: 'Failed to submit KYC' });
  }
});

// GET /users/me/kyc-status — API gateway compatible KYC status endpoint
app.get('/users/me/kyc-status', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT kyc_status, kyc_required_at, kyc_submitted_at, kyc_verified_at FROM users WHERE id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = result.rows[0];
    const now = new Date();
    let daysRemaining = 0;
    let gracePeriodExpired = false;
    if (user.kyc_status === 'required' && user.kyc_required_at) {
      const requiredAt = new Date(user.kyc_required_at);
      const msSince = now.getTime() - requiredAt.getTime();
      const daysSince = Math.floor(msSince / (1000 * 60 * 60 * 24));
      daysRemaining = Math.max(0, KYC_GRACE_DAYS - daysSince);
      gracePeriodExpired = daysSince >= KYC_GRACE_DAYS;
    }
    res.json({
      status: user.kyc_status || 'not_required',
      requiredAt: user.kyc_required_at,
      submittedAt: user.kyc_submitted_at,
      verifiedAt: user.kyc_verified_at,
      daysRemaining,
      gracePeriodExpired,
    });
  } catch (error) {
    console.error('KYC status error:', error);
    res.status(500).json({ error: 'Failed to fetch KYC status' });
  }
});

// POST /users/me/kyc-submit — API gateway compatible KYC submit endpoint
app.post('/users/me/kyc-submit', authMiddleware, async (req, res) => {
  try {
    const { business_name, business_address, tax_id, country } = req.body;
    if (!business_name || !business_address || !tax_id || !country) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const countryPattern = /^[A-Z]{2,3}$/i;
    if (!countryPattern.test(country)) {
      return res.status(400).json({ error: 'Invalid country code' });
    }
    if (country.length < 2 || country.length > 10) {
      return res.status(400).json({ error: 'Invalid country code' });
    }

    const result = await pool.query(
      `UPDATE users SET
        kyc_status = 'submitted', kyc_submitted_at = NOW(),
        kyc_business_name = $1, kyc_business_address = $2,
        kyc_tax_id = $3, kyc_country = $4
      WHERE id = $5 AND kyc_status IN ('required', 'rejected')
      RETURNING id, email, username`,
      [business_name, business_address, tax_id, country.toUpperCase(), req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'KYC is not required or already submitted' });
    }

    const user = result.rows[0];
    sendKycSlackAlert('KYC Submitted for Review', user, {
      'Business Name': business_name,
      'Business Address': business_address,
      'Tax ID': tax_id,
      'Country': country.toUpperCase(),
    }).catch(() => {});

    res.json({ status: 'submitted', submittedAt: new Date() });
  } catch (error) {
    console.error('KYC submit error:', error);
    res.status(500).json({ error: 'Failed to submit KYC' });
  }
});

// POST /auth/kyc-check — service-to-service endpoint triggered by order-service
app.post('/auth/kyc-check', async (req, res) => {
  try {
    const token = req.headers['x-service-token'];
    if (!INTERNAL_SERVICE_TOKEN || token !== INTERNAL_SERVICE_TOKEN) {
      return res.status(401).json({ error: 'Service auth required' });
    }
    const { user_id, lifetime_cents, revenue_30d_cents } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    const { rows: [user] } = await pool.query(
      'SELECT id, email, username, kyc_status FROM users WHERE id = $1',
      [user_id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.kyc_status !== 'not_required') {
      return res.json({ skipped: true, status: user.kyc_status });
    }

    const lifetime = parseInt(lifetime_cents || 0);
    const revenue30d = parseInt(revenue_30d_cents || 0);
    const triggered = lifetime >= KYC_THRESHOLD_LIFETIME_CENTS || revenue30d >= KYC_THRESHOLD_30D_CENTS;

    if (triggered) {
      await pool.query(
        `UPDATE users SET kyc_status = 'required', kyc_required_at = NOW() WHERE id = $1 AND kyc_status = 'not_required'`,
        [user_id]
      );
      sendKycSlackAlert('KYC Required — Seller Crossed Threshold', user, {
        'Lifetime Sales': `$${(lifetime / 100).toLocaleString()}`,
        '30-Day Sales': `$${(revenue30d / 100).toLocaleString()}`,
      }).catch(() => {});
    }

    res.json({ status: triggered ? 'required' : 'not_required', triggered });
  } catch (error) {
    console.error('KYC check error:', error);
    res.status(500).json({ error: 'Failed to check KYC' });
  }
});

// ============================================
// TOKEN VERIFICATION (for other services)
// ============================================
app.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        valid: false,
        error: 'Token is required'
      });
    }

    const { verifyToken } = require('./auth');
    const decoded = verifyToken(token);

    // Check if user is still active
    const result = await pool.query(
      'SELECT is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length > 0 && result.rows[0].is_active === false) {
      return res.status(403).json({
        valid: false,
        error: 'Account is disabled',
        code: 'ACCOUNT_DISABLED'
      });
    }

    res.json({
      valid: true,
      userId: decoded.userId,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role
    });
  } catch (error) {
    res.status(401).json({
      valid: false,
      error: error.message
    });
  }
});

// ============================================
// WISHLIST ROUTES
// ============================================

// GET /wishlist - Get user's wishlist (requires JWT)
app.get('/wishlist', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, product_id, product_name, product_image_url, product_price,
              vendor_id, vendor_name, created_at
       FROM wishlists
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.userId]
    );

    res.json({
      items: result.rows.map(item => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        productImageUrl: item.product_image_url,
        productPrice: item.product_price,
        vendorId: item.vendor_id,
        vendorName: item.vendor_name,
        createdAt: item.created_at
      })),
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Get wishlist error', { error: error.message, userId: req.user.userId });
    res.status(500).json({
      error: 'Failed to fetch wishlist',
      code: 'FETCH_ERROR'
    });
  }
});

// POST /wishlist - Add item to wishlist (requires JWT)
app.post('/wishlist', authMiddleware, async (req, res) => {
  try {
    const { productId, productName, productImageUrl, productPrice, vendorId, vendorName } = req.body;

    if (!productId) {
      return res.status(400).json({
        error: 'Product ID is required',
        code: 'MISSING_PRODUCT_ID'
      });
    }

    // Validate UUID format for productId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(productId)) {
      return res.status(400).json({
        error: 'Invalid product ID format',
        code: 'INVALID_PRODUCT_ID'
      });
    }

    const result = await pool.query(
      `INSERT INTO wishlists (user_id, product_id, product_name, product_image_url, product_price, vendor_id, vendor_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, product_id) DO NOTHING
       RETURNING id, product_id, product_name, product_image_url, product_price, vendor_id, vendor_name, created_at`,
      [req.user.userId, productId, productName, productImageUrl, productPrice, vendorId, vendorName]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({
        error: 'Item already in wishlist',
        code: 'ALREADY_EXISTS'
      });
    }

    const item = result.rows[0];
    logger.userAction('added to wishlist', req.user.userId, req.user.email, req.user.username, { productId, productName });

    res.status(201).json({
      message: 'Item added to wishlist',
      item: {
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        productImageUrl: item.product_image_url,
        productPrice: item.product_price,
        vendorId: item.vendor_id,
        vendorName: item.vendor_name,
        createdAt: item.created_at
      }
    });
  } catch (error) {
    logger.error('Add to wishlist error', { error: error.message, userId: req.user.userId });
    res.status(500).json({
      error: 'Failed to add item to wishlist',
      code: 'ADD_ERROR'
    });
  }
});

// DELETE /wishlist/:productId - Remove item from wishlist (requires JWT)
app.delete('/wishlist/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(productId)) {
      return res.status(400).json({
        error: 'Invalid product ID format',
        code: 'INVALID_PRODUCT_ID'
      });
    }

    const result = await pool.query(
      'DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2 RETURNING id, product_name',
      [req.user.userId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Item not found in wishlist',
        code: 'NOT_FOUND'
      });
    }

    logger.userAction('removed from wishlist', req.user.userId, req.user.email, req.user.username, { productId, productName: result.rows[0].product_name });

    res.json({
      message: 'Item removed from wishlist',
      productId
    });
  } catch (error) {
    logger.error('Remove from wishlist error', { error: error.message, userId: req.user.userId });
    res.status(500).json({
      error: 'Failed to remove item from wishlist',
      code: 'REMOVE_ERROR'
    });
  }
});

// GET /wishlist/check/:productId - Check if product is in wishlist (requires JWT)
app.get('/wishlist/check/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(productId)) {
      return res.status(400).json({
        error: 'Invalid product ID format',
        code: 'INVALID_PRODUCT_ID'
      });
    }

    const result = await pool.query(
      'SELECT id FROM wishlists WHERE user_id = $1 AND product_id = $2',
      [req.user.userId, productId]
    );

    res.json({
      inWishlist: result.rows.length > 0
    });
  } catch (error) {
    logger.error('Check wishlist error', { error: error.message, userId: req.user.userId });
    res.status(500).json({
      error: 'Failed to check wishlist',
      code: 'CHECK_ERROR'
    });
  }
});

// ============================================
// PASSWORD RESET ROUTES
// ============================================

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://email-service:3009';
const crypto = require('crypto');

// POST /auth/forgot-password - Request password reset
app.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        code: 'MISSING_EMAIL'
      });
    }

    // Find user by email
    const userResult = await pool.query(
      'SELECT id, email, username FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // Always return success to prevent email enumeration
    if (userResult.rows.length === 0) {
      logger.info('Password reset requested for non-existent email', { email });
      return res.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    const user = userResult.rows[0];

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Invalidate any existing tokens for this user
    await pool.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
      [user.id]
    );

    // Save new token
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, resetToken, expiresAt]
    );

    // Send email via email-service
    try {
      const fetch = (await import('node-fetch')).default;
      await fetch(`${EMAIL_SERVICE_URL}/emails/password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          resetToken,
          username: user.username
        })
      });
      logger.info('Password reset email sent', { userId: user.id, email: user.email });
    } catch (emailError) {
      logger.error('Failed to send password reset email', { error: emailError.message, userId: user.id });
      // Don't fail the request, token is saved
    }

    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    logger.error('Forgot password error', { error: error.message });
    res.status(500).json({
      error: 'Failed to process password reset request',
      code: 'RESET_REQUEST_ERROR'
    });
  }
});

// POST /auth/reset-password - Reset password with token
app.post('/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Token and new password are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters',
        code: 'WEAK_PASSWORD'
      });
    }

    // Find valid token
    const tokenResult = await pool.query(
      `SELECT prt.id, prt.user_id, u.email, u.username
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token = $1
         AND prt.expires_at > NOW()
         AND prt.used_at IS NULL`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Invalid or expired reset token',
        code: 'INVALID_TOKEN'
      });
    }

    const tokenRecord = tokenResult.rows[0];

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, tokenRecord.user_id]
    );

    // Mark token as used
    await pool.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
      [tokenRecord.id]
    );

    logger.userAction('password reset', tokenRecord.user_id, tokenRecord.email, tokenRecord.username);

    res.json({
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    logger.error('Reset password error', { error: error.message });
    res.status(500).json({
      error: 'Failed to reset password',
      code: 'RESET_ERROR'
    });
  }
});

// ============================================
// BUYER INTERESTS ROUTES
// ============================================

// GET /users/interests - Get user's shopping interests (requires JWT)
app.get('/users/interests', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT category FROM buyer_interests WHERE user_id = $1 ORDER BY created_at',
      [req.user.userId]
    );

    res.json({
      interests: result.rows.map(row => row.category)
    });
  } catch (error) {
    logger.error('Get interests error', { error: error.message, userId: req.user.userId });
    res.status(500).json({
      error: 'Failed to fetch interests',
      code: 'FETCH_ERROR'
    });
  }
});

// PUT /users/interests - Update user's interests (requires JWT)
app.put('/users/interests', authMiddleware, async (req, res) => {
  try {
    const { interests } = req.body;

    if (!Array.isArray(interests)) {
      return res.status(400).json({
        error: 'Interests must be an array',
        code: 'INVALID_INTERESTS'
      });
    }

    // Limit to reasonable number of interests
    if (interests.length > 20) {
      return res.status(400).json({
        error: 'Maximum 20 interests allowed',
        code: 'TOO_MANY_INTERESTS'
      });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete existing interests
      await client.query('DELETE FROM buyer_interests WHERE user_id = $1', [req.user.userId]);

      // Insert new interests
      if (interests.length > 0) {
        const values = interests.map((category, i) => `($1, $${i + 2})`).join(', ');
        await client.query(
          `INSERT INTO buyer_interests (user_id, category) VALUES ${values}`,
          [req.user.userId, ...interests]
        );
      }

      await client.query('COMMIT');

      logger.userAction('updated interests', req.user.userId, req.user.email, req.user.username, { count: interests.length });

      res.json({
        message: 'Interests updated successfully',
        interests
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Update interests error', { error: error.message, userId: req.user.userId });
    res.status(500).json({
      error: 'Failed to update interests',
      code: 'UPDATE_ERROR'
    });
  }
});

// POST /users/interests - Add interests (bulk, for onboarding) (requires JWT)
app.post('/users/interests', authMiddleware, async (req, res) => {
  try {
    const { interests } = req.body;

    if (!Array.isArray(interests) || interests.length === 0) {
      return res.status(400).json({
        error: 'Interests array is required',
        code: 'INVALID_INTERESTS'
      });
    }

    // Check current count
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM buyer_interests WHERE user_id = $1',
      [req.user.userId]
    );
    const currentCount = parseInt(countResult.rows[0].count);

    if (currentCount + interests.length > 20) {
      return res.status(400).json({
        error: 'Maximum 20 interests allowed',
        code: 'TOO_MANY_INTERESTS'
      });
    }

    // Insert new interests (ignore duplicates)
    const values = interests.map((_, i) => `($1, $${i + 2})`).join(', ');
    await pool.query(
      `INSERT INTO buyer_interests (user_id, category) VALUES ${values} ON CONFLICT (user_id, category) DO NOTHING`,
      [req.user.userId, ...interests]
    );

    // Fetch all interests
    const result = await pool.query(
      'SELECT category FROM buyer_interests WHERE user_id = $1 ORDER BY created_at',
      [req.user.userId]
    );

    logger.userAction('added interests', req.user.userId, req.user.email, req.user.username, { added: interests.length });

    res.status(201).json({
      message: 'Interests added successfully',
      interests: result.rows.map(row => row.category)
    });
  } catch (error) {
    logger.error('Add interests error', { error: error.message, userId: req.user.userId });
    res.status(500).json({
      error: 'Failed to add interests',
      code: 'ADD_ERROR'
    });
  }
});

// ============================================
// SELLER FEE / TRIAL ROUTES
// ============================================

// Stripe instance for seller fee payments
const Stripe = require('stripe');
const sellerFeeStripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-04-10',
});

const SELLER_FEE_AMOUNT = 10000; // $100 in cents
const SELLER_FEE_CURRENCY = 'usd';

// GET /auth/seller-status — check trial/fee status (authenticated)
app.get('/auth/seller-status', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT role, trial_ends_at, seller_fee_paid, seller_fee_paid_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    const user = result.rows[0];

    if (user.role !== 'seller') {
      return res.status(400).json({ error: 'User is not a seller', code: 'NOT_SELLER' });
    }

    const now = new Date();
    const trialEndsAt = user.trial_ends_at ? new Date(user.trial_ends_at) : null;
    const trialActive = trialEndsAt ? now < trialEndsAt : false;
    const trialDaysRemaining = trialActive
      ? Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24))
      : 0;
    const sellerFeePaid = user.seller_fee_paid || false;
    const canList = trialActive || sellerFeePaid;

    res.json({
      role: user.role,
      trialEndsAt: user.trial_ends_at,
      trialActive,
      trialDaysRemaining,
      sellerFeePaid,
      canList,
    });
  } catch (error) {
    logger.error('Seller status check failed', { error: error.message, userId: req.user.userId });
    res.status(500).json({ error: 'Failed to check seller status', code: 'STATUS_ERROR' });
  }
});

// POST /auth/seller-fee — create Stripe Checkout Session for $100 listing fee (authenticated)
app.post('/auth/seller-fee', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Verify user is a seller
    const userResult = await pool.query('SELECT role, seller_fee_paid FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }
    if (userResult.rows[0].role !== 'seller') {
      return res.status(400).json({ error: 'User is not a seller', code: 'NOT_SELLER' });
    }
    if (userResult.rows[0].seller_fee_paid) {
      return res.status(400).json({ error: 'Seller fee already paid', code: 'ALREADY_PAID' });
    }

    const successUrl = process.env.SELLER_FEE_SUCCESS_URL || 'http://localhost:3000/dashboard/settings?seller_fee=success&session_id={CHECKOUT_SESSION_ID}';
    const cancelUrl = process.env.SELLER_FEE_CANCEL_URL || 'http://localhost:3000/dashboard/settings?seller_fee=cancelled';

    const session = await sellerFeeStripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: SELLER_FEE_CURRENCY,
          product_data: {
            name: 'VendFinder Seller Listing Fee',
            description: 'One-time fee to continue listing on VendFinder after your 7-day free trial.',
          },
          unit_amount: SELLER_FEE_AMOUNT,
        },
        quantity: 1,
      }],
      metadata: {
        userId,
        type: 'seller_listing_fee',
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    logger.info('Seller fee checkout session created', { userId, sessionId: session.id });

    res.json({ checkoutUrl: session.url });
  } catch (error) {
    logger.error('Failed to create seller fee checkout', { error: error.message, userId: req.user.userId });
    res.status(500).json({ error: 'Failed to create checkout session', code: 'CHECKOUT_ERROR' });
  }
});

// POST /auth/seller-fee/confirm — confirm Stripe payment and activate seller (authenticated)
app.post('/auth/seller-fee/confirm', authMiddleware, async (req, res) => {
  try {
    const { session_id } = req.body;
    const userId = req.user.userId;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required', code: 'MISSING_SESSION_ID' });
    }

    // Retrieve the Checkout Session from Stripe
    const session = await sellerFeeStripe.checkout.sessions.retrieve(session_id);

    // Verify it belongs to this user
    if (session.metadata.userId !== userId) {
      return res.status(403).json({ error: 'Session does not belong to this user', code: 'SESSION_MISMATCH' });
    }

    // Verify the session is paid
    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        error: 'Payment not completed',
        code: 'PAYMENT_INCOMPLETE',
        paymentStatus: session.payment_status,
      });
    }

    // Update user record
    const result = await pool.query(
      `UPDATE users SET seller_fee_paid = TRUE, seller_fee_paid_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, username, role, seller_fee_paid, seller_fee_paid_at`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    const user = result.rows[0];
    logger.userAction('seller fee paid', user.id, user.email, user.username, {
      sessionId: session_id,
      amount: SELLER_FEE_AMOUNT,
    });

    res.json({
      message: 'Seller fee confirmed successfully',
      sellerFeePaid: true,
      sellerFeePaidAt: user.seller_fee_paid_at,
    });
  } catch (error) {
    logger.error('Seller fee confirmation failed', { error: error.message, userId: req.user.userId });
    res.status(500).json({ error: 'Failed to confirm seller fee', code: 'CONFIRM_ERROR' });
  }
});

// ============================================
// STORIES
// ============================================

// GET /stories — Feed of active stories grouped by user
app.get('/stories', authMiddleware, async (req, res) => {
  try {
    const viewerId = req.user.userId;

    const { rows } = await pool.query(`
      SELECT
        s.id,
        s.user_id,
        s.media_url,
        s.media_type,
        s.text_overlay,
        s.text_position,
        s.view_count,
        s.created_at,
        s.expires_at,
        u.username,
        u.display_name,
        u.avatar_url,
        CASE WHEN sv.id IS NOT NULL THEN true ELSE false END AS viewed
      FROM stories s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN story_views sv ON sv.story_id = s.id AND sv.viewer_id = $1
      WHERE s.expires_at > NOW()
      ORDER BY u.id, s.created_at ASC
    `, [viewerId]);

    // Group by user
    const groupMap = new Map();
    for (const row of rows) {
      const uid = row.user_id;
      if (!groupMap.has(uid)) {
        groupMap.set(uid, {
          userId: uid,
          username: row.username,
          displayName: row.display_name || row.username,
          avatarUrl: row.avatar_url || null,
          stories: [],
          hasUnviewed: false,
        });
      }
      const group = groupMap.get(uid);
      const story = {
        id: row.id,
        userId: row.user_id,
        username: row.username,
        displayName: row.display_name || row.username,
        avatarUrl: row.avatar_url || null,
        mediaUrl: row.media_url,
        mediaType: row.media_type,
        textOverlay: row.text_overlay || null,
        textPosition: row.text_position || null,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        viewCount: row.view_count,
        viewed: row.viewed,
      };
      group.stories.push(story);
      if (!row.viewed) group.hasUnviewed = true;
    }

    // Current user's group first, then others sorted by most recent story
    const groups = Array.from(groupMap.values());
    groups.sort((a, b) => {
      if (a.userId === viewerId) return -1;
      if (b.userId === viewerId) return 1;
      const aLatest = a.stories[a.stories.length - 1]?.createdAt || '';
      const bLatest = b.stories[b.stories.length - 1]?.createdAt || '';
      return new Date(bLatest) - new Date(aLatest);
    });

    res.json({ groups });
  } catch (error) {
    logger.error('Failed to fetch story feed', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch stories', code: 'STORIES_FETCH_ERROR' });
  }
});

// GET /stories/user/:userId — Single user's active stories
app.get('/stories/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Check for viewer auth (optional)
    let viewerId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const { verifyToken } = require('./auth');
        const decoded = verifyToken(authHeader.split(' ')[1]);
        viewerId = decoded.userId;
      } catch {
        // Not authenticated, that's fine
      }
    }

    const { rows } = await pool.query(`
      SELECT
        s.id,
        s.user_id,
        s.media_url,
        s.media_type,
        s.text_overlay,
        s.text_position,
        s.view_count,
        s.created_at,
        s.expires_at,
        u.username,
        u.display_name,
        u.avatar_url
        ${viewerId ? `, CASE WHEN sv.id IS NOT NULL THEN true ELSE false END AS viewed` : ''}
      FROM stories s
      JOIN users u ON u.id = s.user_id
      ${viewerId ? `LEFT JOIN story_views sv ON sv.story_id = s.id AND sv.viewer_id = $2` : ''}
      WHERE s.user_id = $1 AND s.expires_at > NOW()
      ORDER BY s.created_at ASC
    `, viewerId ? [userId, viewerId] : [userId]);

    const stories = rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      username: row.username,
      displayName: row.display_name || row.username,
      avatarUrl: row.avatar_url || null,
      mediaUrl: row.media_url,
      mediaType: row.media_type,
      textOverlay: row.text_overlay || null,
      textPosition: row.text_position || null,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      viewCount: row.view_count,
      viewed: row.viewed || false,
    }));

    res.json({ stories });
  } catch (error) {
    logger.error('Failed to fetch user stories', { error: error.message, userId: req.params.userId });
    res.status(500).json({ error: 'Failed to fetch stories', code: 'STORIES_FETCH_ERROR' });
  }
});

// POST /stories — Create a new story
app.post('/stories', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { mediaUrl, mediaType, textOverlay, textPosition } = req.body;

    if (!mediaUrl || typeof mediaUrl !== 'string') {
      return res.status(400).json({ error: 'mediaUrl is required', code: 'MISSING_MEDIA_URL' });
    }
    if (!mediaUrl.startsWith('https://')) {
      return res.status(400).json({ error: 'mediaUrl must be a valid HTTPS URL', code: 'INVALID_MEDIA_URL' });
    }

    const validMediaTypes = ['image'];
    const safeMediaType = validMediaTypes.includes(mediaType) ? mediaType : 'image';

    const validPositions = ['top', 'center', 'bottom'];
    const safePosition = validPositions.includes(textPosition) ? textPosition : 'center';

    const safeTextOverlay = textOverlay && typeof textOverlay === 'string'
      ? textOverlay.slice(0, 200)
      : null;

    const { rows } = await pool.query(`
      INSERT INTO stories (user_id, media_url, media_type, text_overlay, text_position)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, mediaUrl, safeMediaType, safeTextOverlay, safePosition]);

    const story = rows[0];

    // Fetch user info for response
    const userResult = await pool.query(
      'SELECT username, display_name, avatar_url FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0];

    res.status(201).json({
      id: story.id,
      userId: story.user_id,
      username: user?.username,
      displayName: user?.display_name || user?.username,
      avatarUrl: user?.avatar_url || null,
      mediaUrl: story.media_url,
      mediaType: story.media_type,
      textOverlay: story.text_overlay || null,
      textPosition: story.text_position || null,
      createdAt: story.created_at,
      expiresAt: story.expires_at,
      viewCount: story.view_count,
      viewed: false,
    });

    logger.userAction('created story', userId, req.user.email || '', user?.username || '', {
      storyId: story.id,
    });
  } catch (error) {
    logger.error('Failed to create story', { error: error.message, userId: req.user.userId });
    res.status(500).json({ error: 'Failed to create story', code: 'STORY_CREATE_ERROR' });
  }
});

// DELETE /stories/:id — Delete own story
app.delete('/stories/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const storyId = req.params.id;

    const { rows } = await pool.query(
      'DELETE FROM stories WHERE id = $1 AND user_id = $2 RETURNING id',
      [storyId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Story not found or not yours', code: 'STORY_NOT_FOUND' });
    }

    res.json({ success: true });

    logger.userAction('deleted story', userId, req.user.email || '', '', { storyId });
  } catch (error) {
    logger.error('Failed to delete story', { error: error.message, userId: req.user.userId });
    res.status(500).json({ error: 'Failed to delete story', code: 'STORY_DELETE_ERROR' });
  }
});

// POST /stories/:id/view — Mark story as viewed
app.post('/stories/:id/view', authMiddleware, async (req, res) => {
  try {
    const viewerId = req.user.userId;
    const storyId = req.params.id;

    // Check story exists
    const storyCheck = await pool.query('SELECT id FROM stories WHERE id = $1', [storyId]);
    if (storyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Story not found', code: 'STORY_NOT_FOUND' });
    }

    // Upsert view record — RETURNING id tells us if a new row was inserted
    const viewResult = await pool.query(`
      INSERT INTO story_views (story_id, viewer_id)
      VALUES ($1, $2)
      ON CONFLICT (story_id, viewer_id) DO NOTHING
      RETURNING id
    `, [storyId, viewerId]);

    // Only update view_count if a new view was recorded
    if (viewResult.rows.length > 0) {
      await pool.query(`
        UPDATE stories SET view_count = view_count + 1 WHERE id = $1
      `, [storyId]);
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to mark story viewed', { error: error.message, storyId: req.params.id });
    res.status(500).json({ error: 'Failed to mark viewed', code: 'VIEW_ERROR' });
  }
});

// ============================================
// KYC Routes
// ============================================
// Make database pool available to KYC routes
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

// Temporary KYC status endpoint (routes/kyc.js missing in container)
app.get('/api/kyc/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userQuery = `
      SELECT kyc_status, kyc_required_at, kyc_submitted_at, kyc_verified_at, verified
      FROM users WHERE id = $1
    `;
    const { rows: [user] } = await pool.query(userQuery, [userId]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      kycStatus: user.kyc_status || 'not_started',
      kycRequired: !!user.kyc_required_at,
      kycSubmitted: !!user.kyc_submitted_at,
      kycVerified: !!user.kyc_verified_at,
      documents: [],
      extractedData: null,
      spacesConfigured: true // We configured this earlier
    });
  } catch (error) {
    console.error('Error fetching KYC status:', error);
    res.status(500).json({ error: 'Failed to fetch KYC status' });
  }
});

// Try to load KYC routes (will fail silently if missing)
try {
  app.use('/api/kyc', kycRoutes);
} catch (err) {
  console.warn('KYC routes not available:', err.message);
}

// ============================================
// 404 Handler
// ============================================
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'NOT_FOUND',
    path: req.path
  });
});

// ============================================
// Error Handler
// ============================================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// ============================================
// Start Server
// ============================================
async function start() {
  try {
    await runMigrations();
  } catch (err) {
    console.error('Migration failed, starting anyway:', err.message);
  }

  // Initialize KYC services
  console.log('Initializing KYC services...');

  // Initialize DigitalOcean Spaces
  try {
    const spacesInitialized = await initializeBucket();
    if (spacesInitialized) {
      await testConnection();
      console.log('✅ DigitalOcean Spaces initialized and tested successfully');
    } else {
      console.warn('⚠️  DigitalOcean Spaces not configured - document upload disabled');
    }
  } catch (error) {
    console.error('❌ DigitalOcean Spaces initialization failed:', error.message);
  }

  // Initialize Google Vision API
  try {
    const visionInitialized = initializeVision();
    if (visionInitialized) {
      console.log('✅ Google Vision API initialized successfully');
    } else {
      console.warn('⚠️  Google Vision API not configured - OCR processing disabled');
    }
  } catch (error) {
    console.error('❌ Google Vision API initialization failed:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`User Service running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`KYC endpoints available at: http://localhost:${PORT}/api/kyc/`);
  });
}

start();

module.exports = app;
