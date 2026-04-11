const logger = require('./logger');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3004';

async function authMiddleware(req, res, next) {
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
      body: JSON.stringify({ token }),
    });

    if (!verifyRes.ok) {
      const data = await verifyRes.json().catch(() => ({}));
      return res.status(401).json({ error: data.error || 'Invalid token', code: 'INVALID_TOKEN' });
    }

    const data = await verifyRes.json();
    const user = data.user || data;
    req.user = { id: user.id || user.userId, email: user.email, username: user.username, role: user.role };
    next();
  } catch (err) {
    logger.error('Auth verification failed', { error: err.message });
    return res.status(503).json({ error: 'Authentication service unavailable', code: 'AUTH_UNAVAILABLE' });
  }
}

// Optional auth - sets req.user if token present, but doesn't block
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);
  try {
    const fetch = (await import('node-fetch')).default;
    const verifyRes = await fetch(`${USER_SERVICE_URL}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({ token }),
    });

    if (verifyRes.ok) {
      const data = await verifyRes.json();
      const user = data.user || data;
      req.user = { id: user.id || user.userId, email: user.email, username: user.username, role: user.role };
    }
  } catch (err) {
    logger.warn('Optional auth failed', { error: err.message });
  }
  next();
}

module.exports = { authMiddleware, optionalAuth };
