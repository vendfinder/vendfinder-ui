const logger = require('./logger');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3004';

async function verifyToken(token) {
  try {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch(`${USER_SERVICE_URL}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.user || data;
  } catch (err) {
    logger.error('Token verification failed', { error: err.message });
    return null;
  }
}

module.exports = { verifyToken };
