const config = require('../config');

async function sendBotMessage(conversationId, content) {
  const fetch = (await import('node-fetch')).default;
  const res = await fetch(
    `${config.chatServiceUrl}/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service-Key': config.internalServiceKey,
        'X-Service-User-Id': config.botUserId,
      },
      body: JSON.stringify({ text: content }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to send bot message: ${res.status} ${err}`);
  }

  return res.json();
}

async function fetchConversationHistory(conversationId, limit) {
  const fetch = (await import('node-fetch')).default;
  const maxMessages = limit || config.maxHistoryMessages;

  const res = await fetch(
    `${config.chatServiceUrl}/conversations/${conversationId}/messages?limit=${maxMessages}`,
    {
      headers: {
        'X-Internal-Service-Key': config.internalServiceKey,
        'X-Service-User-Id': config.botUserId,
      },
    }
  );

  if (!res.ok) {
    console.error('Failed to fetch conversation history:', res.status);
    return [];
  }

  const data = await res.json();
  // Normalize production format to what claude.js expects
  const messages = Array.isArray(data) ? data : (data.messages || []);
  return messages.map(m => ({
    id: m.id,
    conversationId: m.conversation_id || m.conversationId,
    senderId: m.sender_id || m.senderId,
    content: m.original_text || m.content || m.body,
    type: m.type || 'text',
    createdAt: m.created_at || m.createdAt,
  }));
}

module.exports = { sendBotMessage, fetchConversationHistory };
