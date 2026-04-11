const logger = require('./logger');

const DEFAULT_BLOCKLIST = [
  'venmo',
  'cashapp',
  'paypal me',
  'text me at',
  'my email is',
  'whatsapp',
  'telegram me',
];

let redis = null;

function init(redisClient) {
  redis = redisClient;
}

async function ensureBlocklist() {
  if (!redis) return;
  const exists = await redis.exists('chat:blocklist');
  if (!exists) {
    if (DEFAULT_BLOCKLIST.length > 0) {
      await redis.sadd('chat:blocklist', ...DEFAULT_BLOCKLIST);
    }
    logger.info('Initialized default blocklist', { count: DEFAULT_BLOCKLIST.length });
  }
}

async function checkMessage(text) {
  const lower = text.toLowerCase();

  // Check Redis blocklist
  if (redis) {
    const blocklist = await redis.smembers('chat:blocklist');
    for (const term of blocklist) {
      if (lower.includes(term.toLowerCase())) {
        return { flagged: true, term };
      }
    }
  } else {
    // Fallback to default list
    for (const term of DEFAULT_BLOCKLIST) {
      if (lower.includes(term)) {
        return { flagged: true, term };
      }
    }
  }

  return { flagged: false };
}

module.exports = { init, ensureBlocklist, checkMessage };
