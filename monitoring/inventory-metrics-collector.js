const { Pool } = require('pg');
const { MetricsCollector, register } = require('./metrics');
const express = require('express');

// VendFinder Inventory Metrics Collector
// Periodically collects inventory and sales data for Prometheus
class InventoryMetricsCollector {
  constructor() {
    this.orderPool = new Pool({
      connectionString: process.env.ORDER_DB_URL || 'postgresql://vendfinder:vendfinder_pass@order-db:5432/order_db'
    });

    this.productPool = new Pool({
      connectionString: process.env.PRODUCT_DB_URL || 'postgresql://vendfinder:vendfinder_pass@product-db:5432/product_db'
    });

    this.userPool = new Pool({
      connectionString: process.env.USER_DB_URL || 'postgresql://vendfinder:vendfinder_pass@user-db:5432/user_db'
    });

    this.collectInterval = parseInt(process.env.METRICS_COLLECT_INTERVAL) || 30000; // 30 seconds
    this.isCollecting = false;
  }

  async start() {
    console.log('🚀 Starting VendFinder Inventory Metrics Collector...');
    console.log(`📊 Collection interval: ${this.collectInterval}ms`);

    // Initial collection
    await this.collectAllMetrics();

    // Set up periodic collection
    this.intervalId = setInterval(async () => {
      if (!this.isCollecting) {
        await this.collectAllMetrics();
      }
    }, this.collectInterval);

    console.log('✅ Metrics collector started successfully');
  }

  async collectAllMetrics() {
    if (this.isCollecting) {
      console.log('⏭️  Skipping collection - already in progress');
      return;
    }

    this.isCollecting = true;
    const startTime = Date.now();

    try {
      console.log('📈 Collecting inventory and sales metrics...');

      // Collect all metrics in parallel for efficiency
      await Promise.all([
        this.collectVendorInventory(),
        this.collectVendorSales(),
        this.collectVendorRevenue(),
        this.collectOrderStatuses(),
        this.collectPaymentStatuses(),
        this.collectProductInventory()
      ]);

      const duration = Date.now() - startTime;
      console.log(`✅ Metrics collection completed in ${duration}ms`);

    } catch (error) {
      console.error('❌ Error collecting metrics:', error);
      MetricsCollector.recordDbQuery('metrics_collection_error', 'all', (Date.now() - startTime) / 1000);
    } finally {
      this.isCollecting = false;
    }
  }

  async collectVendorInventory() {
    try {
      // Get vendor product counts by category and status
      const inventoryQuery = `
        SELECT
          v.id as vendor_id,
          v.name as vendor_name,
          p.category,
          p.status,
          COUNT(*) as product_count
        FROM vendors v
        LEFT JOIN products p ON v.id = p.vendor_id
        WHERE v.id IS NOT NULL
        GROUP BY v.id, v.name, p.category, p.status
        ORDER BY v.name, p.category;
      `;

      const result = await this.productPool.query(inventoryQuery);

      // Clear existing vendor product metrics
      const vendorProductsGauge = require('./metrics').vendorProductsGauge;
      vendorProductsGauge.reset();

      result.rows.forEach(row => {
        if (row.category && row.status) {
          MetricsCollector.updateVendorProducts(
            row.vendor_id,
            row.vendor_name || `vendor-${row.vendor_id.slice(-8)}`,
            row.category,
            row.status,
            parseInt(row.product_count)
          );
        }
      });

      console.log(`📦 Updated vendor inventory metrics for ${result.rows.length} vendor/category combinations`);

    } catch (error) {
      console.error('❌ Error collecting vendor inventory:', error);
    }
  }

  async collectVendorSales() {
    try {
      // Get vendor sales counts by product
      const salesQuery = `
        SELECT
          oi.vendor_id,
          COALESCE(v.name, 'Unknown Vendor') as vendor_name,
          oi.product_name,
          p.category,
          COUNT(*) as sales_count
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN vendors v ON oi.vendor_id = v.id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.status IN ('delivered', 'shipped', 'processing')
        GROUP BY oi.vendor_id, v.name, oi.product_name, p.category
        ORDER BY sales_count DESC;
      `;

      const result = await this.orderPool.query(salesQuery);

      // Clear existing sales metrics
      const vendorSalesCounter = require('./metrics').vendorSalesCounter;
      vendorSalesCounter.reset();

      result.rows.forEach(row => {
        // Set counter to current sales count (simulating increments)
        for (let i = 0; i < parseInt(row.sales_count); i++) {
          MetricsCollector.incrementVendorSales(
            row.vendor_id,
            row.vendor_name,
            row.product_name,
            row.category || 'unknown'
          );
        }
      });

      console.log(`💰 Updated vendor sales metrics for ${result.rows.length} product sales`);

    } catch (error) {
      console.error('❌ Error collecting vendor sales:', error);
    }
  }

  async collectVendorRevenue() {
    try {
      // Get vendor revenue from successful payments
      const revenueQuery = `
        SELECT
          oi.vendor_id,
          COALESCE(v.name, 'Unknown Vendor') as vendor_name,
          COALESCE(SUM(CASE WHEN p.status = 'succeeded' THEN p.amount ELSE 0 END), 0) as total_revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN payments p ON o.id = p.order_id
        LEFT JOIN vendors v ON oi.vendor_id = v.id
        GROUP BY oi.vendor_id, v.name
        ORDER BY total_revenue DESC;
      `;

      const result = await this.orderPool.query(revenueQuery);

      // Clear existing revenue metrics
      const vendorRevenueGauge = require('./metrics').vendorRevenueGauge;
      vendorRevenueGauge.reset();

      result.rows.forEach(row => {
        MetricsCollector.updateVendorRevenue(
          row.vendor_id,
          row.vendor_name,
          parseFloat(row.total_revenue)
        );
      });

      console.log(`💵 Updated revenue metrics for ${result.rows.length} vendors`);

    } catch (error) {
      console.error('❌ Error collecting vendor revenue:', error);
    }
  }

  async collectOrderStatuses() {
    try {
      // Get order counts by status and vendor
      const orderStatusQuery = `
        SELECT
          oi.vendor_id,
          COALESCE(v.name, 'Unknown Vendor') as vendor_name,
          o.status,
          COUNT(*) as order_count
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN vendors v ON oi.vendor_id = v.id
        GROUP BY oi.vendor_id, v.name, o.status
        ORDER BY order_count DESC;
      `;

      const result = await this.orderPool.query(orderStatusQuery);

      // Clear existing order status metrics
      const orderStatusGauge = require('./metrics').orderStatusGauge;
      orderStatusGauge.reset();

      result.rows.forEach(row => {
        MetricsCollector.updateOrderStatus(
          row.vendor_id,
          row.vendor_name,
          row.status,
          parseInt(row.order_count)
        );
      });

      console.log(`📋 Updated order status metrics for ${result.rows.length} vendor/status combinations`);

    } catch (error) {
      console.error('❌ Error collecting order statuses:', error);
    }
  }

  async collectPaymentStatuses() {
    try {
      // Get payment counts by status and vendor
      const paymentStatusQuery = `
        SELECT
          oi.vendor_id,
          COALESCE(v.name, 'Unknown Vendor') as vendor_name,
          p.status as payment_status,
          COUNT(*) as payment_count
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN payments p ON o.id = p.order_id
        LEFT JOIN vendors v ON oi.vendor_id = v.id
        WHERE p.status IS NOT NULL
        GROUP BY oi.vendor_id, v.name, p.status
        ORDER BY payment_count DESC;
      `;

      const result = await this.orderPool.query(paymentStatusQuery);

      // Clear existing payment status metrics
      const paymentStatusGauge = require('./metrics').paymentStatusGauge;
      paymentStatusGauge.reset();

      result.rows.forEach(row => {
        MetricsCollector.updatePaymentStatus(
          row.vendor_id,
          row.vendor_name,
          row.payment_status,
          parseInt(row.payment_count)
        );
      });

      console.log(`💳 Updated payment status metrics for ${result.rows.length} vendor/payment combinations`);

    } catch (error) {
      console.error('❌ Error collecting payment statuses:', error);
    }
  }

  async collectProductInventory() {
    try {
      // Get detailed product inventory
      const inventoryQuery = `
        SELECT
          p.vendor_id,
          COALESCE(v.name, 'Unknown Vendor') as vendor_name,
          p.id as product_id,
          p.name as product_name,
          p.category,
          p.available_sizes,
          p.stock_count,
          p.status
        FROM products p
        LEFT JOIN vendors v ON p.vendor_id = v.id
        WHERE p.status = 'active' AND p.stock_count > 0
        ORDER BY p.vendor_id, p.category, p.name;
      `;

      const result = await this.productPool.query(inventoryQuery);

      // Clear existing product inventory metrics
      const productInventoryGauge = require('./metrics').productInventoryGauge;
      productInventoryGauge.reset();

      result.rows.forEach(row => {
        // Handle available sizes (could be an array)
        let sizes = ['N/A'];
        try {
          if (row.available_sizes) {
            sizes = Array.isArray(row.available_sizes)
              ? row.available_sizes
              : JSON.parse(row.available_sizes);
          }
        } catch (e) {
          sizes = ['N/A'];
        }

        sizes.forEach(size => {
          MetricsCollector.updateProductInventory(
            row.vendor_id,
            row.vendor_name,
            row.product_id,
            row.product_name,
            row.category,
            size,
            parseInt(row.stock_count) || 0
          );
        });
      });

      console.log(`🏷️  Updated product inventory metrics for ${result.rows.length} products`);

    } catch (error) {
      console.error('❌ Error collecting product inventory:', error);
    }
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('🛑 Metrics collector stopped');
    }

    await Promise.all([
      this.orderPool.end(),
      this.productPool.end(),
      this.userPool.end()
    ]);
  }
}

// Express app to serve metrics
const app = express();
const PORT = process.env.PORT || 9091;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'vendfinder-inventory-metrics',
    timestamp: new Date().toISOString()
  });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    console.error('❌ Error serving metrics:', error);
    res.status(500).end('Error serving metrics');
  }
});

// Manual metrics collection trigger (for debugging)
app.post('/collect', async (req, res) => {
  try {
    await collector.collectAllMetrics();
    res.json({ status: 'success', message: 'Metrics collected successfully' });
  } catch (error) {
    console.error('❌ Manual collection failed:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Start the metrics collector
const collector = new InventoryMetricsCollector();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  await collector.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  await collector.stop();
  process.exit(0);
});

// Start everything
async function start() {
  try {
    await collector.start();

    app.listen(PORT, () => {
      console.log(`📊 VendFinder Inventory Metrics Collector running on port ${PORT}`);
      console.log(`🔗 Metrics endpoint: http://localhost:${PORT}/metrics`);
      console.log(`💚 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('💥 Failed to start metrics collector:', error);
    process.exit(1);
  }
}

// Start if this file is run directly
if (require.main === module) {
  start();
}

module.exports = { InventoryMetricsCollector, app };