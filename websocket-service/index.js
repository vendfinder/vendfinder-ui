const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');
const cors = require('cors');
const logger = require('./logger');
const { register, wsConnectionsTotal, wsEventsTotal } = require('./metrics');
const { verifyToken } = require('./auth');

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3006;
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

// Redis clients
const pubClient = new Redis(REDIS_URL);
const subClient = pubClient.duplicate();
const redis = new Redis(REDIS_URL);

// Subscriber for chat-service events
const chatSub = new Redis(REDIS_URL);

pubClient.on('error', (err) => logger.error('Redis pub error', { error: err.message }));
subClient.on('error', (err) => logger.error('Redis sub error', { error: err.message }));

// Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  adapter: createAdapter(pubClient, subClient),
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'websocket-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount,
    redis: redis.status === 'ready' ? 'connected' : 'disconnected',
  });
});

// Metrics
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Socket.io authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }

  const user = await verifyToken(token);
  if (!user) {
    return next(new Error('Invalid token'));
  }

  socket.user = user;
  next();
});

// Track user → socket mapping
const userSockets = new Map(); // userId → Set<socketId>

io.on('connection', async (socket) => {
  const userId = socket.user.userId;
  logger.info('Client connected', { userId, socketId: socket.id });

  // Track socket
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId).add(socket.id);

  // Join user room
  socket.join(`user:${userId}`);

  // Mark online in Redis
  await redis.sadd('presence:online', userId);
  wsConnectionsTotal.inc();

  // Broadcast presence
  io.emit('presence:update', { userId, status: 'online' });

  // Send current unread counts
  const unreadData = await redis.hgetall(`unread:${userId}`);
  if (unreadData && Object.keys(unreadData).length > 0) {
    const totalUnread = Object.values(unreadData).reduce((sum, v) => sum + parseInt(v, 10), 0);
    socket.emit('unread:update', { counts: unreadData, total: totalUnread });
  }

  // Join conversation room
  socket.on('conversation:join', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
    wsEventsTotal.inc({ event: 'conversation:join' });
  });

  // Leave conversation room
  socket.on('conversation:leave', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
    wsEventsTotal.inc({ event: 'conversation:leave' });
  });

  // Typing indicators
  socket.on('typing:start', (conversationId) => {
    socket.to(`conversation:${conversationId}`).emit('typing:start', {
      conversationId,
      userId,
      username: socket.user.username,
    });
    wsEventsTotal.inc({ event: 'typing:start' });
  });

  socket.on('typing:stop', (conversationId) => {
    socket.to(`conversation:${conversationId}`).emit('typing:stop', {
      conversationId,
      userId,
    });
    wsEventsTotal.inc({ event: 'typing:stop' });
  });

  // Mark as read (forward to participants)
  socket.on('message:read', ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('read:update', {
      conversationId,
      userId,
      readAt: new Date().toISOString(),
    });
    wsEventsTotal.inc({ event: 'message:read' });
  });

  // Disconnect
  socket.on('disconnect', async () => {
    const sockets = userSockets.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        userSockets.delete(userId);
        await redis.srem('presence:online', userId);
        io.emit('presence:update', { userId, status: 'offline' });
      }
    }
    wsConnectionsTotal.dec();
    logger.info('Client disconnected', { userId, socketId: socket.id });
  });
});

// Subscribe to chat-service and order-service Redis events
chatSub.subscribe('chat:new_message', 'chat:read_update', 'chat:offer_update', 'chat:message_translated', 'order:shipped', (err) => {
  if (err) {
    logger.error('Failed to subscribe to events', { error: err.message });
  } else {
    logger.info('Subscribed to chat and order events');
  }
});

chatSub.on('message', (channel, message) => {
  try {
    const data = JSON.parse(message);

    switch (channel) {
      case 'chat:new_message': {
        // Broadcast to conversation room
        io.to(`conversation:${data.conversationId}`).emit('message:new', data);
        wsEventsTotal.inc({ event: 'message:new' });
        break;
      }
      case 'chat:read_update': {
        io.to(`conversation:${data.conversationId}`).emit('read:update', data);
        wsEventsTotal.inc({ event: 'read:update' });
        break;
      }
      case 'chat:offer_update': {
        io.to(`conversation:${data.conversationId}`).emit('offer:update', data);
        wsEventsTotal.inc({ event: 'offer:update' });
        break;
      }
      case 'chat:message_translated': {
        io.to(`conversation:${data.conversationId}`).emit('message:translated', data);
        wsEventsTotal.inc({ event: 'message:translated' });
        break;
      }
      case 'order:shipped': {
        // Notify the buyer that their order has shipped
        io.to(`user:${data.buyerId}`).emit('order:shipped', data);
        wsEventsTotal.inc({ event: 'order:shipped' });
        break;
      }
    }
  } catch (err) {
    logger.error('Failed to process Redis message', { channel, error: err.message });
  }
});

// Start server
httpServer.listen(PORT, () => {
  logger.info(`WebSocket service listening on port ${PORT}`);
});
