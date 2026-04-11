const promClient = require('prom-client');

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'vendfinder'
});

// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register });

// Custom VendFinder Metrics
const vendorProductsGauge = new promClient.Gauge({
  name: 'vendfinder_vendor_products_total',
  help: 'Total number of products by vendor',
  labelNames: ['vendor_id', 'vendor_name', 'category', 'status'],
  registers: [register]
});

const vendorSalesCounter = new promClient.Counter({
  name: 'vendfinder_vendor_sales_total',
  help: 'Total number of sales by vendor',
  labelNames: ['vendor_id', 'vendor_name', 'product_name', 'category'],
  registers: [register]
});

const vendorRevenueGauge = new promClient.Gauge({
  name: 'vendfinder_vendor_revenue_dollars',
  help: 'Total revenue by vendor in dollars',
  labelNames: ['vendor_id', 'vendor_name'],
  registers: [register]
});

const orderStatusGauge = new promClient.Gauge({
  name: 'vendfinder_orders_by_status',
  help: 'Number of orders by status and vendor',
  labelNames: ['vendor_id', 'vendor_name', 'status'],
  registers: [register]
});

const productInventoryGauge = new promClient.Gauge({
  name: 'vendfinder_product_inventory',
  help: 'Current inventory count by product and vendor',
  labelNames: ['vendor_id', 'vendor_name', 'product_id', 'product_name', 'category', 'size'],
  registers: [register]
});

const paymentStatusGauge = new promClient.Gauge({
  name: 'vendfinder_payments_by_status',
  help: 'Payment counts by status and vendor',
  labelNames: ['vendor_id', 'vendor_name', 'payment_status'],
  registers: [register]
});

// Request metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'vendfinder_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'vendfinder_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Database query metrics
const dbQueryDuration = new promClient.Histogram({
  name: 'vendfinder_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

// Utility functions to update metrics
class MetricsCollector {

  // Update vendor product metrics
  static updateVendorProducts(vendorId, vendorName, category, status, count) {
    vendorProductsGauge.set(
      { vendor_id: vendorId, vendor_name: vendorName, category, status },
      count
    );
  }

  // Increment vendor sales
  static incrementVendorSales(vendorId, vendorName, productName, category) {
    vendorSalesCounter.inc({
      vendor_id: vendorId,
      vendor_name: vendorName,
      product_name: productName,
      category
    });
  }

  // Update vendor revenue
  static updateVendorRevenue(vendorId, vendorName, revenue) {
    vendorRevenueGauge.set(
      { vendor_id: vendorId, vendor_name: vendorName },
      revenue
    );
  }

  // Update order status counts
  static updateOrderStatus(vendorId, vendorName, status, count) {
    orderStatusGauge.set(
      { vendor_id: vendorId, vendor_name: vendorName, status },
      count
    );
  }

  // Update product inventory
  static updateProductInventory(vendorId, vendorName, productId, productName, category, size, count) {
    productInventoryGauge.set({
      vendor_id: vendorId,
      vendor_name: vendorName,
      product_id: productId,
      product_name: productName,
      category,
      size: size || 'N/A'
    }, count);
  }

  // Update payment status counts
  static updatePaymentStatus(vendorId, vendorName, paymentStatus, count) {
    paymentStatusGauge.set(
      { vendor_id: vendorId, vendor_name: vendorName, payment_status: paymentStatus },
      count
    );
  }

  // Record HTTP request
  static recordHttpRequest(method, route, statusCode, duration) {
    httpRequestDuration.observe(
      { method, route, status_code: statusCode },
      duration
    );
    httpRequestsTotal.inc({ method, route, status_code: statusCode });
  }

  // Record database query
  static recordDbQuery(queryType, table, duration) {
    dbQueryDuration.observe({ query_type: queryType, table }, duration);
  }

  // Clear all metrics (useful for testing)
  static clearMetrics() {
    register.resetMetrics();
  }
}

// Express middleware for HTTP metrics
function httpMetricsMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.url;
    MetricsCollector.recordHttpRequest(req.method, route, res.statusCode, duration);
  });

  next();
}

// Database query wrapper for metrics
function wrapDatabaseQuery(pool, queryType, table) {
  const originalQuery = pool.query.bind(pool);

  return async function(text, params) {
    const start = Date.now();
    try {
      const result = await originalQuery(text, params);
      const duration = (Date.now() - start) / 1000;
      MetricsCollector.recordDbQuery(queryType, table, duration);
      return result;
    } catch (error) {
      const duration = (Date.now() - start) / 1000;
      MetricsCollector.recordDbQuery(`${queryType}_error`, table, duration);
      throw error;
    }
  };
}

module.exports = {
  register,
  MetricsCollector,
  httpMetricsMiddleware,
  wrapDatabaseQuery,
  // Export individual metrics for direct access
  vendorProductsGauge,
  vendorSalesCounter,
  vendorRevenueGauge,
  orderStatusGauge,
  productInventoryGauge,
  paymentStatusGauge,
  httpRequestDuration,
  httpRequestsTotal,
  dbQueryDuration
};