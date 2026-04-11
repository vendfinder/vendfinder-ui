const logger = require('./logger');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3004';

async function authMiddleware(req, res, next) {
  // Internal service-to-service auth (for support bot and other internal services)
  const internalKey = req.headers['x-internal-service-key'];
  if (internalKey && process.env.INTERNAL_SERVICE_KEY && internalKey === process.env.INTERNAL_SERVICE_KEY) {
    const serviceUserId = req.headers['x-service-user-id'];
    if (serviceUserId) {
      req.user = { userId: serviceUserId, isService: true };
      return next();
    }
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing', code: 'NO_AUTH_HEADER' });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Invalid authorization format', code: 'INVALID_AUTH_FORMAT' });
  }

  const token = authHeader.slice(7);
  if (!token) {
    return res.status(401).json({ error: 'Token not provided', code: 'NO_TOKEN' });
  }

  try {
    const fetch = (await import('node-fetch')).default;
    const verifyRes = await fetch(`${USER_SERVICE_URL}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    if (!verifyRes.ok) {
      const data = await verifyRes.json().catch(() => ({}));
      return res.status(401).json({ error: data.error || 'Invalid token', code: 'INVALID_TOKEN' });
    }

    const data = await verifyRes.json();
    req.user = data.user || data;
    next();
  } catch (err) {
    logger.error('Auth verification failed', { error: err.message });
    return res.status(503).json({ error: 'Authentication service unavailable', code: 'AUTH_UNAVAILABLE' });
  }
}

module.exports = { authMiddleware };
