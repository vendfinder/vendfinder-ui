const Stripe = require('stripe');
const logger = require('./logger');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-04-10',
});

async function createPaymentIntent(amount, currency = 'usd', metadata = {}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
    });
    return paymentIntent;
  } catch (err) {
    logger.error('Failed to create PaymentIntent', { error: err.message });
    throw err;
  }
}

function constructWebhookEvent(body, signature) {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!endpointSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  }
  return stripe.webhooks.constructEvent(body, signature, endpointSecret);
}

module.exports = { stripe, createPaymentIntent, constructWebhookEvent };
