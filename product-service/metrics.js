const promClient = require('prom-client');

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register, prefix: 'vendfinder_product_' });

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

const productsCreated = new promClient.Counter({
  name: 'vendfinder_products_created_total',
  help: 'Total products created',
  registers: [register]
});

const asksCreated = new promClient.Counter({
  name: 'vendfinder_asks_created_total',
  help: 'Total asks/listings created',
  registers: [register]
});

const bidsPlaced = new promClient.Counter({
  name: 'vendfinder_bids_placed_total',
  help: 'Total bids placed',
  registers: [register]
});

module.exports = {
  register,
  httpRequestsTotal,
  httpRequestDuration,
  productsCreated,
  asksCreated,
  bidsPlaced,
};
