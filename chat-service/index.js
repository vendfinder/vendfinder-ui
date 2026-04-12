/**
 * VendFinder Chat Service
 * Real-time multilingual chat with automatic translation
 */

const express = require('express');
const http = require('http');
const { Pool } = require('pg');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const promClient = require('prom-client');
// Translation service will be initialized after Redis is set up
let translationService = null;
let translationEnabled = false;

const app = express();
const server = http.createServer(app);

// ============================================
// Prometheus Metrics Setup
// ============================================
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register, prefix: 'vendfinder_' });

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

const chatMessagesSentTotal = new promClient.Counter({
  name: 'vendfinder_chat_messages_sent_total',
  help: 'Total chat messages sent',
  registers: [register]
});

const activeWebSocketConnections = new promClient.Gauge({
  name: 'vendfinder_active_websocket_connections',
  help: 'Number of active WebSocket connections',
  registers: [register]
});

// Configuration
const PORT = process.env.PORT || 3006;
const JWT_SECRET = process.env.JWT_SECRET || 'vendfinder-secret-key';
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://vendfinder:vendfinder@localhost:5432/chat_db';
const REDIS_URL = process.env.REDIS_URL;
const VENDOR_SERVICE_URL = process.env.VENDOR_SERVICE_URL || 'http://vendor-service:3001';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3004';
const BOT_USER_ID = process.env.BOT_USER_ID || '00000000-0000-0000-0000-000000000001';
const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY || '';

// Database connection
const pool = new Pool({ connectionString: DATABASE_URL });

// Redis for pub/sub (optional - falls back to in-memory for single instance)
let redis = null;
let redisSub = null;
if (REDIS_URL) {
  redis = new Redis(REDIS_URL);
  redisSub = new Redis(REDIS_URL);
  console.log('Redis connected for pub/sub');
}

// Initialize translation service
translationService = require('./lib/translation.js')(redis);
translationEnabled = translationService.init();

// Add compatibility functions for the expected interface
async function detectLanguage(text) {
  // Basic language detection - fallback to English
  return translationService.detectSourceLocale(text) || 'en';
}

async function translateText(text, fromLang, toLang) {
  if (!translationEnabled) return text;
  // Use cachedTranslate if available
  return translationService.cachedTranslate ?
    translationService.cachedTranslate(text, fromLang, toLang) : text;
}

async function translateToMultiple(text, fromLang, toLangs) {
  if (!translationEnabled) return {};
  const translations = {};
  for (const lang of toLangs) {
    try {
      translations[lang] = await translateText(text, fromLang, lang);
    } catch (err) {
      translations[lang] = text; // fallback to original
    }
  }
  return translations;
}

function getSupportedLanguages() {
  return translationService.ALL_LOCALES || ['en-US', 'es-MX', 'zh-CN', 'fr-FR', 'de-DE'];
}

// In-memory connections map (userId -> Set of WebSocket connections)
const connections = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Request logger and metrics
app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds + nanoseconds / 1e9;
    const normalizedPath = req.path.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id');
    httpRequestsTotal.inc({ method: req.method, path: normalizedPath, status: res.statusCode });
    httpRequestDuration.observe({ method: req.method, path: normalizedPath }, duration);
  });
  console.log(`[HTTP] ${req.method} ${req.path}`);
  next();
});

// Health check & Metrics
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'chat-service' });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Translation service initialized after Redis setup above

// Run schema on startup
async function initDatabase() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('Database schema initialized');
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
  }
}

// JWT verification middleware
function authenticateToken(req, res, next) {
  // Internal service-to-service auth (for support bot)
  const internalKey = req.headers['x-internal-service-key'];
  if (internalKey && INTERNAL_SERVICE_KEY && internalKey === INTERNAL_SERVICE_KEY) {
    const serviceUserId = req.headers['x-service-user-id'];
    if (serviceUserId) {
      req.user = { userId: serviceUserId, userType: 'user', isService: true };
      return next();
    }
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

// Helper: Get user's language preference
async function getUserLanguage(userId, userType) {
  const result = await pool.query(
    'SELECT preferred_language FROM user_language_preferences WHERE user_id = $1 AND user_type = $2',
    [userId, userType]
  );
  return result.rows[0]?.preferred_language || 'en';
}

// Helper: Get vendor ID for a user (if they have a vendor profile)
async function getVendorIdForUser(userId) {
  try {
    const response = await fetch(`${VENDOR_SERVICE_URL}/vendors/by-user/${userId}`);
    if (response.ok) {
      const vendor = await response.json();
      return vendor.id || null;
    }
  } catch (error) {
    console.error('Error fetching vendor for user:', error.message);
  }
  return null;
}

// Helper: Check if vendor has active subscription
async function checkVendorSubscription(vendorId) {
  try {
    const response = await fetch(`${VENDOR_SERVICE_URL}/vendors/${vendorId}/subscription-status`);
    if (!response.ok) return false;
    const data = await response.json();
    return data.subscriptionActive === true;
  } catch (error) {
    console.error('Subscription check failed for vendor:', vendorId, error.message);
    return false;
  }
}

// Helper: Get vendor name by vendor ID
async function getVendorName(vendorId) {
  try {
    console.log(`[getVendorName] Fetching vendor ${vendorId}`);
    const response = await fetch(`${VENDOR_SERVICE_URL}/vendors/${vendorId}`);
    if (response.ok) {
      const vendor = await response.json();
      const name = vendor.name || vendor.business_name || 'Vendor';
      console.log(`[getVendorName] Found: ${name}`);
      return name;
    } else {
      console.log(`[getVendorName] Failed: ${response.status}`);
    }
  } catch (error) {
    console.error('[getVendorName] Error:', error.message);
  }
  return 'Vendor';
}

// Helper: Get user name by user ID
async function getUserName(userId) {
  try {
    console.log(`[getUserName] Fetching user ${userId}`);
    const response = await fetch(`${USER_SERVICE_URL}/users/${userId}`);
    if (response.ok) {
      const user = await response.json();
      const name = user.username || user.name || user.email?.split('@')[0] || 'User';
      console.log(`[getUserName] Found: ${name}`);
      return name;
    } else {
      console.log(`[getUserName] Failed: ${response.status}`);
    }
  } catch (error) {
    console.error('[getUserName] Error:', error.message);
  }
  return 'User';
}

// Helper: Get participant name based on type
async function getParticipantName(participantId, participantType) {
  console.log(`[getParticipantName] id=${participantId}, type=${participantType}`);
  if (participantType === 'vendor') {
    return await getVendorName(participantId);
  } else {
    return await getUserName(participantId);
  }
}

// Helper: Broadcast message to user's connections
function broadcastToUser(userId, userType, message) {
  const key = `${userType}:${userId}`;
  const userConnections = connections.get(key);

  if (userConnections) {
    const messageStr = JSON.stringify(message);
    userConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  // If Redis is available, publish for multi-instance support
  if (redis) {
    redis.publish(`chat:${key}`, JSON.stringify(message));
  }
}

// ==================== REST API ====================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'chat-service' });
});

// Get supported languages
app.get('/languages', (req, res) => {
  res.json(getSupportedLanguages());
});

// Get user's language preference
app.get('/language-preferences', authenticateToken, async (req, res) => {
  try {
    const { userId, userType } = req.user;
    const language = await getUserLanguage(userId, userType || 'user');
    res.json({ preferredLanguage: language, autoTranslate: true });
  } catch (error) {
    console.error('Error getting language preference:', error);
    res.status(500).json({ error: 'Failed to get language preference' });
  }
});

// Set user's language preference
app.put('/language-preferences', authenticateToken, async (req, res) => {
  try {
    const { userId, userType } = req.user;
    const { preferredLanguage, autoTranslate = true } = req.body;
    const type = userType || 'user';

    await pool.query(`
      INSERT INTO user_language_preferences (user_id, user_type, preferred_language, auto_translate)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, user_type)
      DO UPDATE SET preferred_language = $3, auto_translate = $4, updated_at = NOW()
    `, [userId, type, preferredLanguage, autoTranslate]);

    res.json({ success: true, preferredLanguage, autoTranslate });
  } catch (error) {
    console.error('Error setting language preference:', error);
    res.status(500).json({ error: 'Failed to set language preference' });
  }
});

// Get user's conversations
app.get('/conversations', authenticateToken, async (req, res) => {
  console.log('[ROUTE] GET /conversations - handler started');
  try {
    const { userId, userType } = req.user;
    const type = userType || 'user';
    console.log(`[ROUTE] User: ${userId}, type: ${type}`);

    // Also get vendor_id if user has a vendor profile
    const vendorId = await getVendorIdForUser(userId);

    // Build query to include conversations where user is participant as user OR as vendor
    let query = `
      SELECT
        c.*,
        (SELECT COUNT(*) FROM messages m
         WHERE m.conversation_id = c.id
         AND m.sender_id != $1
         AND m.read_at IS NULL) as unread_count,
        (SELECT json_build_object(
          'id', m.id,
          'original_text', m.original_text,
          'translations', m.translations,
          'sender_id', m.sender_id,
          'created_at', m.created_at,
          'media_url', m.media_url,
          'media_type', m.media_type
        ) FROM messages m
         WHERE m.conversation_id = c.id
         ORDER BY m.created_at DESC LIMIT 1) as last_message
      FROM conversations c
      WHERE (c.participant1_id = $1 AND c.participant1_type = $2)
         OR (c.participant2_id = $1 AND c.participant2_type = $2)
    `;
    const params = [userId, type];

    // If user has a vendor profile, also include conversations where their vendor_id is a participant
    if (vendorId) {
      query += `
         OR (c.participant1_id = $3 AND c.participant1_type = 'vendor')
         OR (c.participant2_id = $3 AND c.participant2_type = 'vendor')
      `;
      params.push(vendorId);
    }

    query += ` ORDER BY c.updated_at DESC`;

    const result = await pool.query(query, params);
    console.log(`[GET /conversations] Found ${result.rows.length} conversations, enriching with names...`);

    // Enrich conversations with participant names
    const enrichedConversations = await Promise.all(
      result.rows.map(async (conv) => {
        // Determine which participant is "the other party" from current user's perspective
        const isParticipant1 = conv.participant1_id === userId || conv.participant1_id === vendorId;

        // Get names for both participants
        const participant1Name = await getParticipantName(conv.participant1_id, conv.participant1_type);
        const participant2Name = await getParticipantName(conv.participant2_id, conv.participant2_type);

        return {
          ...conv,
          participant1Name,
          participant2Name,
          // Also provide a convenient "otherParticipantName" for the UI
          otherParticipantName: isParticipant1 ? participant2Name : participant1Name,
          otherParticipantType: isParticipant1 ? conv.participant2_type : conv.participant1_type
        };
      })
    );

    res.json(enrichedConversations);
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Get or create conversation with a vendor/user
app.post('/conversations', authenticateToken, async (req, res) => {
  try {
    const { userId, userType } = req.user;
    const { participantId, participantType, productId } = req.body;
    const myType = userType || 'user';

    // Check if conversation already exists
    let result = await pool.query(`
      SELECT * FROM conversations
      WHERE ((participant1_id = $1 AND participant1_type = $2 AND participant2_id = $3 AND participant2_type = $4)
          OR (participant1_id = $3 AND participant1_type = $4 AND participant2_id = $1 AND participant2_type = $2))
        AND ($5::uuid IS NULL OR product_id = $5)
    `, [userId, myType, participantId, participantType, productId || null]);

    if (result.rows.length > 0) {
      return res.json(result.rows[0]);
    }

    // Create new conversation
    result = await pool.query(`
      INSERT INTO conversations (participant1_id, participant1_type, participant2_id, participant2_type, product_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, myType, participantId, participantType, productId || null]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get messages in a conversation
app.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userType } = req.user;
    const type = userType || 'user';
    const { limit = 50, before } = req.query;

    // Also get vendor_id if user has a vendor profile
    const vendorId = await getVendorIdForUser(userId);

    // Verify user is participant (by user_id or vendor_id)
    let convQuery = `
      SELECT * FROM conversations WHERE id = $1
      AND ((participant1_id = $2 AND participant1_type = $3)
        OR (participant2_id = $2 AND participant2_type = $3)
    `;
    let convParams = [id, userId, type];

    if (vendorId) {
      convQuery += `
        OR (participant1_id = $4 AND participant1_type = 'vendor')
        OR (participant2_id = $4 AND participant2_type = 'vendor')
      `;
      convParams.push(vendorId);
    }
    convQuery += `)`;

    const convResult = await pool.query(convQuery, convParams);

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    let query = `
      SELECT * FROM messages
      WHERE conversation_id = $1
    `;
    const params = [id];

    if (before) {
      query += ` AND created_at < $2`;
      params.push(before);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    res.json(result.rows.reverse());
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send a message (REST fallback)
app.post('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userType } = req.user;
    const type = userType || 'user';
    const { text, mediaUrl, mediaType } = req.body;

    console.log('[POST /messages] Request:', { conversationId: id, userId, userType, type, text: text?.substring(0, 50) });

    // Also get vendor_id if user has a vendor profile
    const vendorId = await getVendorIdForUser(userId);
    console.log('[POST /messages] Vendor lookup result:', { userId, vendorId });

    // Verify user is participant (by user_id or vendor_id)
    let convQuery = `
      SELECT * FROM conversations WHERE id = $1
      AND ((participant1_id = $2 AND participant1_type = $3)
        OR (participant2_id = $2 AND participant2_type = $3)
    `;
    let convParams = [id, userId, type];

    if (vendorId) {
      convQuery += `
        OR (participant1_id = $4 AND participant1_type = 'vendor')
        OR (participant2_id = $4 AND participant2_type = 'vendor')
      `;
      convParams.push(vendorId);
    }
    convQuery += `)`;

    console.log('[POST /messages] Checking participant, params:', convParams);
    const convResult = await pool.query(convQuery, convParams);
    console.log('[POST /messages] Conv query result rows:', convResult.rows.length);

    if (convResult.rows.length === 0) {
      console.log('[POST /messages] NOT FOUND - user not participant');
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conversation = convResult.rows[0];
    console.log('[POST /messages] Found conversation:', { p1: conversation.participant1_id, p1t: conversation.participant1_type, p2: conversation.participant2_id, p2t: conversation.participant2_type });

    // Determine if user is sending as vendor or user
    // If the conversation has their vendor_id as a participant, send as vendor
    let senderId = userId;
    let senderType = type;
    if (vendorId && (conversation.participant1_id === vendorId || conversation.participant2_id === vendorId)) {
      senderId = vendorId;
      senderType = 'vendor';
    }

    // Detect language
    const detectedLang = await detectLanguage(text);

    // Get recipient info
    const recipientId = conversation.participant1_id === senderId
      ? conversation.participant2_id
      : conversation.participant1_id;
    const recipientType = conversation.participant1_id === senderId
      ? conversation.participant2_type
      : conversation.participant1_type;

    // Determine the vendor participant in this conversation (if any)
    let vendorParticipantId = null;
    if (senderType === 'vendor') {
      vendorParticipantId = senderId;
    } else {
      const otherType = conversation.participant1_id === senderId
        ? conversation.participant2_type : conversation.participant1_type;
      if (otherType === 'vendor') {
        vendorParticipantId = conversation.participant1_id === senderId
          ? conversation.participant2_id : conversation.participant1_id;
      }
    }

    // Translate only if vendor has active subscription (or no vendor in conversation)
    let translations = {};
    if (vendorParticipantId) {
      const hasSubscription = await checkVendorSubscription(vendorParticipantId);
      if (hasSubscription) {
        const recipientLang = await getUserLanguage(recipientId, recipientType);
        translations = await translateToMultiple(text, detectedLang, [recipientLang, 'en']);
      } else {
        console.log(`[Translation] Skipping - vendor ${vendorParticipantId} has no active subscription`);
      }
    } else {
      // No vendor in conversation (user-to-user) - translate normally
      const recipientLang = await getUserLanguage(recipientId, recipientType);
      translations = await translateToMultiple(text, detectedLang, [recipientLang, 'en']);
    }

    // Store message
    const result = await pool.query(`
      INSERT INTO messages (conversation_id, sender_id, sender_type, original_text, original_language, translations, media_url, media_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [id, senderId, senderType, text || '', detectedLang, JSON.stringify(translations), mediaUrl || null, mediaType || null]);

    const message = result.rows[0];

    // Update conversation timestamp
    await pool.query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [id]);

    // Broadcast to recipient
    broadcastToUser(recipientId, recipientType, {
      type: 'message',
      conversationId: id,
      message
    });

    // If recipient is the support bot, also publish to chat:new_message for the bot service
    if (redis && recipientId === BOT_USER_ID) {
      const isSupport = await redis.sismember('support:conversations', id);
      if (isSupport) {
        await redis.publish('chat:new_message', JSON.stringify({
          id: message.id,
          conversationId: id,
          senderId: message.sender_id,
          content: message.original_text,
          type: 'text',
          createdAt: message.created_at,
        }));
      }
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Create support conversation with the AI bot
app.post('/conversations/support', authenticateToken, async (req, res) => {
  try {
    const { userId, userType } = req.user;
    const { message, category } = req.body;
    const myType = userType || 'user';

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check for existing support conversation with bot
    let result = await pool.query(`
      SELECT * FROM conversations
      WHERE ((participant1_id = $1 AND participant2_id = $2)
          OR (participant1_id = $2 AND participant2_id = $1))
        AND product_id IS NULL
      ORDER BY updated_at DESC LIMIT 1
    `, [userId, BOT_USER_ID]);

    let conversation;
    let isExisting = false;

    if (result.rows.length > 0) {
      conversation = result.rows[0];
      isExisting = true;
    } else {
      result = await pool.query(`
        INSERT INTO conversations (participant1_id, participant1_type, participant2_id, participant2_type)
        VALUES ($1, $2, $3, 'user')
        RETURNING *
      `, [userId, myType, BOT_USER_ID]);
      conversation = result.rows[0];
    }

    // Send initial message
    const msgResult = await pool.query(`
      INSERT INTO messages (conversation_id, sender_id, sender_type, original_text, original_language, translations)
      VALUES ($1, $2, $3, $4, 'en', '{}')
      RETURNING *
    `, [conversation.id, userId, myType, message.trim()]);

    const msg = msgResult.rows[0];

    // Publish to Redis for support bot
    if (redis) {
      await redis.sadd('support:conversations', conversation.id);
      await redis.hmset(`support:meta:${conversation.id}`, {
        category: category || 'general',
        userId,
      });
      await redis.publish('chat:new_message', JSON.stringify({
        id: msg.id,
        conversationId: conversation.id,
        senderId: msg.sender_id,
        content: msg.original_text,
        type: 'text',
        createdAt: msg.created_at,
      }));
    }

    console.log('Support conversation created', { conversationId: conversation.id, userId, category });

    res.status(201).json({
      id: conversation.id,
      existing: isExisting,
      message: {
        id: msg.id,
        conversationId: conversation.id,
        senderId: msg.sender_id,
        content: msg.original_text,
        type: 'text',
        createdAt: msg.created_at,
      },
    });
  } catch (error) {
    console.error('Error creating support conversation:', error);
    res.status(500).json({ error: 'Failed to create support conversation' });
  }
});

// Mark messages as read
app.post('/conversations/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userType } = req.user;
    const type = userType || 'user';

    await pool.query(`
      UPDATE messages SET read_at = NOW()
      WHERE conversation_id = $1
      AND sender_id != $2
      AND read_at IS NULL
    `, [id, userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// ==================== WebSocket ====================

const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  let userId = null;
  let userType = null;

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'auth':
          // Authenticate the connection
          try {
            const decoded = jwt.verify(message.token, JWT_SECRET);
            userId = decoded.userId;
            userType = decoded.userType || 'user';

            const key = `${userType}:${userId}`;
            if (!connections.has(key)) {
              connections.set(key, new Set());
            }
            connections.get(key).add(ws);

            ws.send(JSON.stringify({ type: 'auth_success' }));
            console.log(`User connected: ${key}`);
          } catch (error) {
            ws.send(JSON.stringify({ type: 'auth_error', error: 'Invalid token' }));
          }
          break;

        case 'message':
          // Send a message
          if (!userId) {
            ws.send(JSON.stringify({ type: 'error', error: 'Not authenticated' }));
            return;
          }

          const { conversationId, text, mediaUrl: wsMedUrl, mediaType: wsMedType } = message;

          // Verify user is participant
          const convResult = await pool.query(`
            SELECT * FROM conversations WHERE id = $1
            AND ((participant1_id = $2 AND participant1_type = $3)
              OR (participant2_id = $2 AND participant2_type = $3))
          `, [conversationId, userId, userType]);

          if (convResult.rows.length === 0) {
            ws.send(JSON.stringify({ type: 'error', error: 'Conversation not found' }));
            return;
          }

          const conversation = convResult.rows[0];

          // Detect language
          const detectedLang = await detectLanguage(text);

          // Get recipient info
          const recipientId = conversation.participant1_id === userId
            ? conversation.participant2_id
            : conversation.participant1_id;
          const recipientType = conversation.participant1_id === userId
            ? conversation.participant2_type
            : conversation.participant1_type;

          // Determine the vendor participant in this conversation (if any)
          let wsVendorParticipantId = null;
          if (userType === 'vendor') {
            wsVendorParticipantId = userId;
          } else if (recipientType === 'vendor') {
            wsVendorParticipantId = recipientId;
          }

          // Translate only if vendor has active subscription (or no vendor in conversation)
          let translations = {};
          if (wsVendorParticipantId) {
            const hasSubscription = await checkVendorSubscription(wsVendorParticipantId);
            if (hasSubscription) {
              const recipientLang = await getUserLanguage(recipientId, recipientType);
              translations = await translateToMultiple(text, detectedLang, [recipientLang, 'en']);
            } else {
              console.log(`[Translation] Skipping WS - vendor ${wsVendorParticipantId} has no active subscription`);
            }
          } else {
            const recipientLang = await getUserLanguage(recipientId, recipientType);
            translations = await translateToMultiple(text, detectedLang, [recipientLang, 'en']);
          }

          // Store message
          const result = await pool.query(`
            INSERT INTO messages (conversation_id, sender_id, sender_type, original_text, original_language, translations, media_url, media_type)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
          `, [conversationId, userId, userType, text || '', detectedLang, JSON.stringify(translations), wsMedUrl || null, wsMedType || null]);

          const newMessage = result.rows[0];

          // Send confirmation to sender
          ws.send(JSON.stringify({
            type: 'message_sent',
            message: newMessage
          }));

          // Broadcast to recipient
          broadcastToUser(recipientId, recipientType, {
            type: 'message',
            conversationId,
            message: newMessage
          });
          break;

        case 'typing':
          // Broadcast typing indicator
          if (!userId) return;

          const typingConv = await pool.query(`SELECT * FROM conversations WHERE id = $1`, [message.conversationId]);
          if (typingConv.rows.length === 0) return;

          const conv = typingConv.rows[0];
          const targetId = conv.participant1_id === userId ? conv.participant2_id : conv.participant1_id;
          const targetType = conv.participant1_id === userId ? conv.participant2_type : conv.participant1_type;

          broadcastToUser(targetId, targetType, {
            type: 'typing',
            conversationId: message.conversationId,
            isTyping: message.isTyping
          });
          break;

        case 'read':
          // Mark messages as read
          if (!userId) return;

          await pool.query(`
            UPDATE messages SET read_at = NOW()
            WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL
          `, [message.conversationId, userId]);

          // Notify sender their messages were read
          const readConv = await pool.query(`SELECT * FROM conversations WHERE id = $1`, [message.conversationId]);
          if (readConv.rows.length > 0) {
            const c = readConv.rows[0];
            const senderId = c.participant1_id === userId ? c.participant2_id : c.participant1_id;
            const senderType = c.participant1_id === userId ? c.participant2_type : c.participant1_type;

            broadcastToUser(senderId, senderType, {
              type: 'messages_read',
              conversationId: message.conversationId
            });
          }
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ type: 'error', error: 'Failed to process message' }));
    }
  });

  ws.on('close', () => {
    if (userId) {
      const key = `${userType}:${userId}`;
      const userConnections = connections.get(key);
      if (userConnections) {
        userConnections.delete(ws);
        if (userConnections.size === 0) {
          connections.delete(key);
        }
      }
      console.log(`User disconnected: ${key}`);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Redis pub/sub for multi-instance support
if (redisSub) {
  redisSub.psubscribe('chat:*', (err) => {
    if (err) console.error('Redis subscribe error:', err);
  });

  redisSub.on('pmessage', (pattern, channel, message) => {
    const [, type, id] = channel.split(':');
    const key = `${type}:${id}`;
    const userConnections = connections.get(key);

    if (userConnections) {
      userConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    }
  });
}

// ==================== Offer/Counter-Offer Support ====================

// Migration for offer-related schema additions
async function runOfferMigrations() {
  try {
    // Add type column to messages table if not exists
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'messages' AND column_name = 'type'
        ) THEN
          ALTER TABLE messages ADD COLUMN type VARCHAR(20) DEFAULT 'text';
        END IF;
      END $$;
    `);

    // Add metadata column to messages table if not exists
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'messages' AND column_name = 'metadata'
        ) THEN
          ALTER TABLE messages ADD COLUMN metadata JSONB DEFAULT '{}';
        END IF;
      END $$;
    `);

    // Create offers table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS offers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL,
        message_id UUID,
        sender_id UUID NOT NULL,
        proposed_price DECIMAL(12,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','countered','expired','cancelled')),
        counter_offer_id UUID,
        expires_at TIMESTAMPTZ NOT NULL,
        resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create index on offers(conversation_id)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_offers_conversation_id ON offers(conversation_id);
    `);

    // Create partial index on offers(status) where status='pending'
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_offers_status_pending ON offers(status) WHERE status = 'pending';
    `);

    console.log('Offer migrations completed');
  } catch (error) {
    console.error('Failed to run offer migrations:', error.message);
  }
}

// POST /conversations/:id/offers - Create a new offer
app.post('/conversations/:id/offers', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userType } = req.user;
    const type = userType || 'user';
    const { price, expiresInHours = 24 } = req.body;

    if (!price || isNaN(price) || Number(price) <= 0) {
      return res.status(400).json({ error: 'Valid price is required' });
    }

    // Also get vendor_id if user has a vendor profile
    const vendorId = await getVendorIdForUser(userId);

    // Verify user is participant (by user_id or vendor_id)
    let convQuery = `
      SELECT * FROM conversations WHERE id = $1
      AND ((participant1_id = $2 AND participant1_type = $3)
        OR (participant2_id = $2 AND participant2_type = $3)
    `;
    let convParams = [id, userId, type];

    if (vendorId) {
      convQuery += `
        OR (participant1_id = $4 AND participant1_type = 'vendor')
        OR (participant2_id = $4 AND participant2_type = 'vendor')
      `;
      convParams.push(vendorId);
    }
    convQuery += `)`;

    const convResult = await pool.query(convQuery, convParams);

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conversation = convResult.rows[0];

    // Determine sender identity (user or vendor)
    let senderId = userId;
    let senderType = type;
    if (vendorId && (conversation.participant1_id === vendorId || conversation.participant2_id === vendorId)) {
      senderId = vendorId;
      senderType = 'vendor';
    }

    // Calculate expiration
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    const proposedPrice = parseFloat(price).toFixed(2);

    // Create the offer row first to get its ID
    const offerResult = await pool.query(`
      INSERT INTO offers (conversation_id, sender_id, proposed_price, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id, senderId, proposedPrice, expiresAt]);

    const offer = offerResult.rows[0];

    // Create message with type='offer'
    const metadata = {
      offerId: offer.id,
      proposedPrice: proposedPrice,
      status: 'pending',
      expiresAt: expiresAt.toISOString()
    };

    const msgResult = await pool.query(`
      INSERT INTO messages (conversation_id, sender_id, sender_type, original_text, original_language, translations, type, metadata)
      VALUES ($1, $2, $3, $4, 'en', '{}', 'offer', $5)
      RETURNING *
    `, [id, senderId, senderType, `Offer: $${proposedPrice}`, JSON.stringify(metadata)]);

    const message = msgResult.rows[0];

    // Update message_id on the offer
    await pool.query('UPDATE offers SET message_id = $1 WHERE id = $2', [message.id, offer.id]);
    offer.message_id = message.id;

    // Update conversation timestamp
    await pool.query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [id]);

    // Determine recipient and broadcast
    const recipientId = conversation.participant1_id === senderId
      ? conversation.participant2_id
      : conversation.participant1_id;
    const recipientType = conversation.participant1_id === senderId
      ? conversation.participant2_type
      : conversation.participant1_type;

    broadcastToUser(recipientId, recipientType, {
      type: 'offer',
      conversationId: id,
      message,
      offer
    });

    res.status(201).json({ offer, message });
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({ error: 'Failed to create offer' });
  }
});

// PATCH /offers/:offerId - Accept, decline, or counter an offer
app.patch('/offers/:offerId', authenticateToken, async (req, res) => {
  try {
    const { offerId } = req.params;
    const { userId, userType } = req.user;
    const type = userType || 'user';
    const { action, counterPrice } = req.body;

    // Validate action
    if (!['accept', 'decline', 'counter'].includes(action)) {
      return res.status(400).json({ error: 'Action must be one of: accept, decline, counter' });
    }

    if (action === 'counter' && (!counterPrice || isNaN(counterPrice) || Number(counterPrice) <= 0)) {
      return res.status(400).json({ error: 'Valid counterPrice is required for counter action' });
    }

    // Fetch the offer
    const offerResult = await pool.query('SELECT * FROM offers WHERE id = $1', [offerId]);
    if (offerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    const offer = offerResult.rows[0];

    if (offer.status !== 'pending') {
      return res.status(400).json({ error: `Offer is already ${offer.status}` });
    }

    // Also get vendor_id if user has a vendor profile
    const vendorId = await getVendorIdForUser(userId);

    // Verify user is participant in the conversation
    let convQuery = `
      SELECT * FROM conversations WHERE id = $1
      AND ((participant1_id = $2 AND participant1_type = $3)
        OR (participant2_id = $2 AND participant2_type = $3)
    `;
    let convParams = [offer.conversation_id, userId, type];

    if (vendorId) {
      convQuery += `
        OR (participant1_id = $4 AND participant1_type = 'vendor')
        OR (participant2_id = $4 AND participant2_type = 'vendor')
      `;
      convParams.push(vendorId);
    }
    convQuery += `)`;

    const convResult = await pool.query(convQuery, convParams);

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conversation = convResult.rows[0];

    // Determine sender identity (user or vendor)
    let senderId = userId;
    let senderType = type;
    if (vendorId && (conversation.participant1_id === vendorId || conversation.participant2_id === vendorId)) {
      senderId = vendorId;
      senderType = 'vendor';
    }

    // Determine recipient for broadcast
    const recipientId = conversation.participant1_id === senderId
      ? conversation.participant2_id
      : conversation.participant1_id;
    const recipientType = conversation.participant1_id === senderId
      ? conversation.participant2_type
      : conversation.participant1_type;

    let newStatus;
    let responseOffer;

    if (action === 'accept') {
      newStatus = 'accepted';
      await pool.query(
        'UPDATE offers SET status = $1, resolved_at = NOW() WHERE id = $2',
        [newStatus, offerId]
      );

      // Create system message
      const formattedPrice = parseFloat(offer.proposed_price).toFixed(2);
      await pool.query(`
        INSERT INTO messages (conversation_id, sender_id, sender_type, original_text, original_language, translations, type, metadata)
        VALUES ($1, $2, $3, $4, 'en', '{}', 'system', $5)
      `, [offer.conversation_id, senderId, senderType, `Offer accepted - $${formattedPrice}`, JSON.stringify({ offerId, action: 'accepted' })]);

      // Update conversation timestamp
      await pool.query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [offer.conversation_id]);

      broadcastToUser(recipientId, recipientType, {
        type: 'offer_update',
        conversationId: offer.conversation_id,
        offerId,
        status: newStatus
      });

    } else if (action === 'decline') {
      newStatus = 'declined';
      await pool.query(
        'UPDATE offers SET status = $1, resolved_at = NOW() WHERE id = $2',
        [newStatus, offerId]
      );

      // Create system message
      await pool.query(`
        INSERT INTO messages (conversation_id, sender_id, sender_type, original_text, original_language, translations, type, metadata)
        VALUES ($1, $2, $3, $4, 'en', '{}', 'system', $5)
      `, [offer.conversation_id, senderId, senderType, 'Offer declined', JSON.stringify({ offerId, action: 'declined' })]);

      // Update conversation timestamp
      await pool.query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [offer.conversation_id]);

      broadcastToUser(recipientId, recipientType, {
        type: 'offer_update',
        conversationId: offer.conversation_id,
        offerId,
        status: newStatus
      });

    } else if (action === 'counter') {
      newStatus = 'countered';

      // Update original offer status
      await pool.query(
        'UPDATE offers SET status = $1, resolved_at = NOW() WHERE id = $2',
        [newStatus, offerId]
      );

      // Create new counter offer
      const counterPriceFormatted = parseFloat(counterPrice).toFixed(2);
      const counterExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const counterOfferResult = await pool.query(`
        INSERT INTO offers (conversation_id, sender_id, proposed_price, expires_at)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [offer.conversation_id, senderId, counterPriceFormatted, counterExpiresAt]);

      responseOffer = counterOfferResult.rows[0];

      // Link counter_offer_id on original offer
      await pool.query('UPDATE offers SET counter_offer_id = $1 WHERE id = $2', [responseOffer.id, offerId]);

      // Create message for counter offer
      const counterMetadata = {
        offerId: responseOffer.id,
        originalOfferId: offerId,
        proposedPrice: counterPriceFormatted,
        status: 'pending',
        expiresAt: counterExpiresAt.toISOString()
      };

      const counterMsgResult = await pool.query(`
        INSERT INTO messages (conversation_id, sender_id, sender_type, original_text, original_language, translations, type, metadata)
        VALUES ($1, $2, $3, $4, 'en', '{}', 'offer', $5)
        RETURNING *
      `, [offer.conversation_id, senderId, senderType, `Offer: $${counterPriceFormatted}`, JSON.stringify(counterMetadata)]);

      const counterMessage = counterMsgResult.rows[0];

      // Update message_id on the counter offer
      await pool.query('UPDATE offers SET message_id = $1 WHERE id = $2', [counterMessage.id, responseOffer.id]);
      responseOffer.message_id = counterMessage.id;

      // Update conversation timestamp
      await pool.query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [offer.conversation_id]);

      broadcastToUser(recipientId, recipientType, {
        type: 'offer',
        conversationId: offer.conversation_id,
        message: counterMessage,
        offer: responseOffer
      });
    }

    const response = { success: true, status: newStatus };
    if (responseOffer) {
      response.offer = responseOffer;
    }
    res.json(response);
  } catch (error) {
    console.error('Error updating offer:', error);
    res.status(500).json({ error: 'Failed to update offer' });
  }
});

// Start server
async function start() {
  await initDatabase();
  await runOfferMigrations();

  server.listen(PORT, () => {
    console.log(`Chat service running on port ${PORT}`);
    console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
  });
}

start();
