const Anthropic = require('@anthropic-ai/sdk').default;
const config = require('../config');
const { lookupOrder, searchUserOrders, lookupProduct } = require('./context');

const client = new Anthropic({ apiKey: config.anthropicApiKey });

const SYSTEM_PROMPT = `You are VendBot, the official customer support assistant for VendFinder — a marketplace for buying and selling vending machines, parts, and supplies.

Your role is to help customers with:
- Order inquiries (tracking, status, delivery issues)
- Returns and refunds (eligibility, process, disputes)
- Product questions (specifications, compatibility, availability)
- Account issues (profile, payment methods, settings)
- Platform usage (how to buy, sell, list items, manage inventory)

Guidelines:
- Be friendly, professional, and concise
- Use the available tools to look up real order/product data before answering
- Never make promises about refunds, credits, or policy exceptions — escalate those to human support
- If you cannot resolve an issue or the customer asks for a human agent, use the escalate_to_human tool
- Keep responses under 200 words unless a detailed explanation is needed
- Reference specific order numbers, product names, and prices when available
- If the user's message is unclear, ask a clarifying question
- Do not discuss topics unrelated to VendFinder or customer support

Return policy summary (for reference):
- Items can be returned within 30 days of delivery
- Items must be in original condition
- Buyer pays return shipping unless item was misrepresented
- Refunds are processed within 5-7 business days after item is received
- Custom/modified items are final sale

Shipping policy:
- Sellers must ship within 3 business days of order confirmation
- Tracking information is provided once shipped
- Standard shipping is 5-7 business days, expedited is 2-3 business days

Fee structure:
- Sellers pay a 9.5% transaction fee on completed sales
- No listing fees for the first 50 active listings
- Payout processing takes 2-3 business days after delivery confirmation`;

const tools = [
  {
    name: 'lookup_order',
    description: 'Look up order details including status, tracking, items, and delivery info. Use when the customer mentions a specific order number or ID.',
    input_schema: {
      type: 'object',
      properties: {
        order_id: { type: 'string', description: 'The order ID to look up' },
      },
      required: ['order_id'],
    },
  },
  {
    name: 'search_user_orders',
    description: "Search for the customer's recent orders. Use when they ask about 'my order' or 'my recent purchase' without specifying an order ID.",
    input_schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'],
          description: 'Optional: filter by order status',
        },
      },
    },
  },
  {
    name: 'lookup_product',
    description: 'Look up product details including price, availability, specifications, and seller info.',
    input_schema: {
      type: 'object',
      properties: {
        product_id: { type: 'string', description: 'The product ID to look up' },
      },
      required: ['product_id'],
    },
  },
  {
    name: 'escalate_to_human',
    description: 'Escalate the conversation to a human support agent. Use when: you cannot resolve the issue, the customer explicitly requests a human, or the issue involves refunds/disputes/policy exceptions that require manual action.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Why this needs human attention' },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'Priority level based on severity and urgency',
        },
        category: {
          type: 'string',
          enum: ['order_issue', 'return_request', 'account_problem', 'billing', 'technical', 'other'],
          description: 'Issue category for routing',
        },
      },
      required: ['reason', 'priority', 'category'],
    },
  },
];

async function executeTool(toolName, toolInput, userId) {
  switch (toolName) {
    case 'lookup_order':
      return await lookupOrder(toolInput.order_id, userId);
    case 'search_user_orders':
      return await searchUserOrders(userId, toolInput.status);
    case 'lookup_product':
      return await lookupProduct(toolInput.product_id);
    case 'escalate_to_human':
      return { escalated: true, ...toolInput };
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

async function processMessage(conversationHistory, context, userId) {
  // Build messages array from conversation history
  const messages = conversationHistory.map((msg) => ({
    role: msg.senderId === config.botUserId ? 'assistant' : 'user',
    content: msg.content,
  }));

  // Merge consecutive messages of the same role (Claude requires alternating roles)
  const mergedMessages = [];
  for (const msg of messages) {
    const last = mergedMessages[mergedMessages.length - 1];
    if (last && last.role === msg.role) {
      last.content += '\n' + msg.content;
    } else {
      mergedMessages.push({ ...msg });
    }
  }

  // Ensure we have at least one user message
  if (mergedMessages.length === 0 || mergedMessages[0].role !== 'user') {
    return {
      response: "Hi! I'm VendBot, your VendFinder support assistant. How can I help you today?",
      escalated: false,
      escalation: null,
    };
  }

  // Add context to system prompt
  let systemPrompt = SYSTEM_PROMPT;
  if (context.product) {
    systemPrompt += `\n\nConversation context — Product: ${context.product.name} (ID: ${context.product.id}, Price: $${context.product.price})`;
  }
  if (context.category) {
    const categoryLabels = {
      order: 'Order Issue',
      return: 'Returns & Refunds',
      product: 'Product Question',
      account: 'Account Help',
      other: 'General',
    };
    systemPrompt += `\n\nCustomer selected support category: ${categoryLabels[context.category] || context.category}`;
  }

  let escalated = false;
  let escalation = null;

  // Initial Claude API call
  let response = await client.messages.create({
    model: config.anthropicModel,
    max_tokens: 1024,
    system: systemPrompt,
    tools,
    messages: mergedMessages,
  });

  // Handle tool use loop (max 5 iterations to prevent runaway)
  let iterations = 0;
  while (response.stop_reason === 'tool_use' && iterations < 5) {
    iterations++;

    const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');
    const toolResults = [];

    for (const toolUse of toolUseBlocks) {
      const result = await executeTool(toolUse.name, toolUse.input, userId);

      if (toolUse.name === 'escalate_to_human' && result.escalated) {
        escalated = true;
        escalation = {
          reason: toolUse.input.reason,
          priority: toolUse.input.priority,
          category: toolUse.input.category,
        };
      }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(result),
      });
    }

    // Continue conversation with tool results
    mergedMessages.push({ role: 'assistant', content: response.content });
    mergedMessages.push({ role: 'user', content: toolResults });

    response = await client.messages.create({
      model: config.anthropicModel,
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages: mergedMessages,
    });
  }

  // Extract text response
  const textBlock = response.content.find((b) => b.type === 'text');
  const botResponse = textBlock
    ? textBlock.text
    : "I'm having trouble processing your request. Let me connect you with a human agent.";

  return {
    response: botResponse,
    escalated,
    escalation,
  };
}

module.exports = { processMessage };
