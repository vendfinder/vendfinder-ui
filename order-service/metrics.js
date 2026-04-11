const promClient = require('prom-client');

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register, prefix: 'vendfinder_order_' });

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

const ordersCreated = new promClient.Counter({
  name: 'vendfinder_orders_created_total',
  help: 'Total orders created',
  registers: [register]
});

const paymentsProcessed = new promClient.Counter({
  name: 'vendfinder_payments_processed_total',
  help: 'Total payments processed',
  labelNames: ['status'],
  registers: [register]
});

module.exports = {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  ordersCreated,
  paymentsProcessed,
};
