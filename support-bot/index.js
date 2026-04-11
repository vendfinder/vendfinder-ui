const express = require('express');
const Redis = require('ioredis');
const config = require('./config');
const { processMessage } = require('./lib/claude');
const { sendBotMessage, fetchConversationHistory } = require('./lib/chat');
const { notifySlack, notifyEscalation } = require('./lib/slack');
const { fetchContext } = require('./lib/context');

const app = express();
app.use(express.json());

// Redis connections (separate for subscriber and general use)
const subscriber = new Redis(config.redisUrl);
const redis = new Redis(config.redisUrl);

subscriber.on('connect', () => console.log('Redis subscriber connected'));
subscriber.on('error', (err) => console.error('Redis subscriber error:', err.message));
redis.on('connect', () => console.log('Redis client connected'));
redis.on('error', (err) => console.error('Redis client error:', err.message));

// Track active processing to prevent concurrent responses per conversation
const processing = new Set();

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'support-bot',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    redis: subscriber.status === 'ready' ? 'connected' : 'disconnected',
  });
});

// Metrics endpoint (basic)
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.end('# support_bot_up 1\n');
});

// Subscribe to new messages
subscriber.subscribe('chat:new_message', (err) => {
  if (err) {
    console.error('Failed to subscribe to chat:new_message:', err.message);
    process.exit(1);
  }
  console.log('Subscribed to chat:new_message');
});

subscriber.on('message', async (channel, rawData) => {
  if (channel !== 'chat:new_message') return;

  let message;
  try {
    message = JSON.parse(rawData);
  } catch {
    return;
  }

  // Ignore messages from the bot itself
  if (message.senderId === config.botUserId) return;

  // Check if this is a support conversation
  const isSupport = await redis.sismember('support:conversations', message.conversationId);
  if (!isSupport) return;

  // Prevent concurrent processing for same conversation
  if (processing.has(message.conversationId)) return;
  processing.add(message.conversationId);

  try {
    console.log(`Processing support message in conversation ${message.conversationId}`);

    // Small delay for natural feel
    await new Promise((r) => setTimeout(r, config.responseDelayMs));

    // Fetch conversation history for context
    const history = await fetchConversationHistory(message.conversationId);

    // Fetch additional context (product/order if available)
    const context = await fetchContext(message.conversationId, message.senderId, redis);

    // Process with Claude
    const result = await processMessage(history, context, message.senderId);

    // Send bot response
    if (result.response) {
      await sendBotMessage(message.conversationId, result.response);
    }

    // Notify Slack
    await notifySlack({
      conversationId: message.conversationId,
      userId: message.senderId,
      userMessage: message.content,
      botResponse: result.response,
      category: context.category || 'general',
      escalated: result.escalated,
    });

    // Handle escalation
    if (result.escalated && result.escalation) {
      await notifyEscalation({
        conversationId: message.conversationId,
        userId: message.senderId,
        reason: result.escalation.reason,
        priority: result.escalation.priority,
        category: result.escalation.category,
      });
    }
  } catch (err) {
    console.error('Error processing support message:', err);
  } finally {
    processing.delete(message.conversationId);
  }
});

// Start server
app.listen(config.port, () => {
  console.log(`Support bot service listening on port ${config.port}`);
});
