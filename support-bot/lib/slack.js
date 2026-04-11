const config = require('../config');

async function postToSlack(payload) {
  if (!config.slackWebhookUrl) {
    console.log('Slack webhook not configured, skipping notification');
    return;
  }

  try {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch(config.slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error('Slack notification failed:', res.status);
    }
  } catch (err) {
    console.error('Slack notification error:', err.message);
  }
}

async function notifySlack({ conversationId, userId, userMessage, botResponse, category, escalated }) {
  const categoryLabel = {
    order: 'Order Issue',
    return: 'Returns & Refunds',
    product: 'Product Question',
    account: 'Account Help',
    other: 'General',
    general: 'General',
  }[category] || 'General';

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: escalated ? 'ESCALATION — Support Conversation' : 'Support Conversation',
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Category:*\n${categoryLabel}` },
        { type: 'mrkdwn', text: `*User ID:*\n\`${userId.slice(0, 8)}...\`` },
        { type: 'mrkdwn', text: `*Conversation:*\n\`${conversationId.slice(0, 8)}...\`` },
        { type: 'mrkdwn', text: `*Status:*\n${escalated ? ':rotating_light: Escalated' : ':robot_face: Bot Handling'}` },
      ],
    },
    { type: 'divider' },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Customer:*\n>${userMessage.slice(0, 500)}` },
    },
  ];

  if (botResponse) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*VendBot:*\n>${botResponse.slice(0, 500)}` },
    });
  }

  blocks.push({
    type: 'context',
    elements: [
      { type: 'mrkdwn', text: `Conversation ID: \`${conversationId}\`` },
    ],
  });

  await postToSlack({ blocks });
}

async function notifyEscalation({ conversationId, userId, reason, priority, category }) {
  const priorityEmoji = {
    low: ':white_circle:',
    medium: ':large_yellow_circle:',
    high: ':large_orange_circle:',
    urgent: ':red_circle:',
  }[priority] || ':white_circle:';

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Human Agent Needed', emoji: true },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Priority:*\n${priorityEmoji} ${priority.toUpperCase()}` },
        { type: 'mrkdwn', text: `*Category:*\n${category}` },
        { type: 'mrkdwn', text: `*User:*\n\`${userId.slice(0, 8)}...\`` },
        { type: 'mrkdwn', text: `*Conversation:*\n\`${conversationId.slice(0, 8)}...\`` },
      ],
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Reason:*\n${reason}` },
    },
  ];

  await postToSlack({ blocks });
}

module.exports = { notifySlack, notifyEscalation };
