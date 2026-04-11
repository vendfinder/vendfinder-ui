const logger = require('./logger');

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'sandbox'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    const text = await res.text();
    logger.error('PayPal auth failed', { status: res.status, body: text });
    throw new Error('Failed to get PayPal access token');
  }
  const data = await res.json();
  return data.access_token;
}

async function createOrder(amount, currency, metadata) {
  const accessToken = await getAccessToken();
  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: metadata.order_id,
        description: `VendFinder Order ${metadata.order_number}`,
        custom_id: metadata.order_id,
        amount: {
          currency_code: currency.toUpperCase(),
          value: amount.toFixed(2),
        },
      }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error('PayPal create order failed', { status: res.status, body: text });
    throw new Error('Failed to create PayPal order');
  }

  const data = await res.json();
  logger.info('PayPal order created', { paypalOrderId: data.id, orderId: metadata.order_id });
  return data;
}

async function captureOrder(paypalOrderId) {
  const accessToken = await getAccessToken();
  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error('PayPal capture failed', { status: res.status, body: text, paypalOrderId });
    throw new Error('Failed to capture PayPal payment');
  }

  const data = await res.json();
  logger.info('PayPal payment captured', { paypalOrderId, status: data.status });
  return data;
}

async function verifyWebhookSignature(headers, body) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    logger.warn('PAYPAL_WEBHOOK_ID not configured, skipping verification');
    return true;
  }

  const accessToken = await getAccessToken();
  const res = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: body,
    }),
  });

  const data = await res.json();
  return data.verification_status === 'SUCCESS';
}

async function createPayout(recipientEmail, amount, currency, metadata) {
  const accessToken = await getAccessToken();
  const senderBatchId = `VF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;

  const res = await fetch(`${PAYPAL_API_BASE}/v1/payments/payouts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: senderBatchId,
        email_subject: 'You have a payout from VendFinder',
        email_message: `Your payout for order ${metadata.order_number} has been processed.`,
      },
      items: [{
        recipient_type: 'EMAIL',
        amount: {
          value: amount.toFixed(2),
          currency: currency.toUpperCase(),
        },
        receiver: recipientEmail,
        note: `VendFinder payout for order ${metadata.order_number}`,
        sender_item_id: metadata.payout_id,
      }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error('PayPal payout failed', { status: res.status, body: text, recipientEmail });
    throw new Error('Failed to create PayPal payout');
  }

  const data = await res.json();
  logger.info('PayPal payout created', {
    batchId: data.batch_header.payout_batch_id,
    payoutId: metadata.payout_id,
  });
  return data;
}

async function getPayoutStatus(payoutBatchId) {
  const accessToken = await getAccessToken();
  const res = await fetch(`${PAYPAL_API_BASE}/v1/payments/payouts/${payoutBatchId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error('PayPal payout status check failed', { status: res.status, body: text });
    throw new Error('Failed to get PayPal payout status');
  }

  return res.json();
}

module.exports = {
  createOrder,
  captureOrder,
  createPayout,
  getPayoutStatus,
  verifyWebhookSignature,
  PAYPAL_CLIENT_ID,
  PAYPAL_API_BASE,
};
