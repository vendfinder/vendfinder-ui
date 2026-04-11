module.exports = {
  port: process.env.PORT || 3009,
  botUserId: process.env.BOT_USER_ID || '00000000-0000-0000-0000-000000000001',

  // Service URLs (internal cluster communication)
  chatServiceUrl: process.env.CHAT_SERVICE_URL || 'http://chat-service:3006',
  orderServiceUrl: process.env.ORDER_SERVICE_URL || 'http://order-service:3000',
  productServiceUrl: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3000',
  userServiceUrl: process.env.USER_SERVICE_URL || 'http://user-service:3004',

  // Auth
  internalServiceKey: process.env.INTERNAL_SERVICE_KEY || '',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://redis:6379',

  // Anthropic
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6-20250514',

  // Slack
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || '',

  // Bot behavior
  maxHistoryMessages: parseInt(process.env.MAX_HISTORY_MESSAGES) || 20,
  responseDelayMs: parseInt(process.env.RESPONSE_DELAY_MS) || 1000,
};
