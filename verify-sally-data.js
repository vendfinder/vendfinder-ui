const { Pool } = require('pg');

// Sally Data Verification Script
// Connects directly to the database to verify Sally's corrected vendor data
class SallyDataVerifier {
  constructor() {
    // Use the same database URL as the order service
    this.orderPool = new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        'postgresql://vendfinder:vendfinder_pass@localhost:5435/order_db',
    });
  }

  async verifyData() {
    try {
      console.log("🔍 Verifying Sally's corrected vendor data...\n");

      const sallyVendorId = 'a3256ba6-bdb2-4893-aed6-3b148ca80e8a';

      // Check Sally's orders
      const ordersQuery = `
        SELECT
          o.id,
          o.order_number,
          o.total_amount,
          o.status as order_status,
          o.created_at,
          oi.product_name,
          oi.price,
          oi.quantity,
          p.amount as payment_amount,
          p.status as payment_status,
          p.stripe_payment_intent_id
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN payments p ON o.id = p.order_id
        WHERE oi.vendor_id = $1
        ORDER BY o.created_at DESC;
      `;

      const ordersResult = await this.orderPool.query(ordersQuery, [
        sallyVendorId,
      ]);

      console.log("📦 Sally's Orders:");
      console.log('==================');

      if (ordersResult.rows.length === 0) {
        console.log('❌ No orders found for Sally');
      } else {
        let totalRevenue = 0;
        ordersResult.rows.forEach((row, index) => {
          console.log(`\n${index + 1}. Order: ${row.order_number}`);
          console.log(`   Product: ${row.product_name}`);
          console.log(`   Price: $${row.price}`);
          console.log(`   Order Status: ${row.order_status}`);
          console.log(`   Payment Status: ${row.payment_status}`);
          console.log(`   Payment Amount: $${row.payment_amount}`);
          console.log(`   Stripe ID: ${row.stripe_payment_intent_id || 'N/A'}`);
          console.log(`   Date: ${row.created_at}`);

          if (
            row.payment_status === 'succeeded' ||
            row.payment_status === 'paid'
          ) {
            totalRevenue += parseFloat(row.payment_amount) || 0;
          }
        });

        console.log(
          `\n💰 Total Revenue (Successful Payments): $${totalRevenue.toFixed(2)}`
        );
      }

      // Check vendor stats calculation
      console.log('\n📊 Vendor Stats Verification:');
      console.log('==============================');

      const statsQuery = `
        SELECT
          COUNT(DISTINCT o.id) as total_orders,
          COALESCE(SUM(CASE WHEN p.status = 'succeeded' THEN p.amount ELSE 0 END), 0) as total_revenue,
          COUNT(CASE WHEN o.status = 'processing' THEN 1 END) as orders_processing,
          COUNT(CASE WHEN o.status = 'shipped' THEN 1 END) as orders_shipped,
          COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as orders_delivered
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN payments p ON o.id = p.order_id
        WHERE oi.vendor_id = $1;
      `;

      const statsResult = await this.orderPool.query(statsQuery, [
        sallyVendorId,
      ]);
      const stats = statsResult.rows[0];

      console.log(`Total Orders: ${stats.total_orders}`);
      console.log(
        `Total Revenue: $${parseFloat(stats.total_revenue).toFixed(2)}`
      );
      console.log(`Processing: ${stats.orders_processing}`);
      console.log(`Shipped: ${stats.orders_shipped}`);
      console.log(`Delivered: ${stats.orders_delivered}`);

      // Check for incorrect assignments (Wolf Grey, YSL)
      console.log('\n🚫 Checking for Incorrect Product Assignments:');
      console.log('===============================================');

      const incorrectProductsQuery = `
        SELECT
          oi.product_name,
          o.order_number,
          o.status
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.vendor_id = $1
        AND (
          oi.product_name ILIKE '%wolf grey%' OR
          oi.product_name ILIKE '%air jordan%' OR
          oi.product_name ILIKE '%ysl%' OR
          oi.product_name ILIKE '%saint laurent%'
        );
      `;

      const incorrectResult = await this.orderPool.query(
        incorrectProductsQuery,
        [sallyVendorId]
      );

      if (incorrectResult.rows.length === 0) {
        console.log('✅ No incorrect product assignments found');
      } else {
        console.log('❌ Found incorrect product assignments:');
        incorrectResult.rows.forEach((row) => {
          console.log(`   - ${row.product_name} (Order: ${row.order_number})`);
        });
      }

      // Expected correct products for Sally
      console.log('\n✅ Expected Correct Products:');
      console.log('=============================');

      const correctProductsQuery = `
        SELECT
          oi.product_name,
          o.order_number,
          o.status,
          p.status as payment_status,
          p.amount
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN payments p ON o.id = p.order_id
        WHERE oi.vendor_id = $1
        AND (
          oi.product_name ILIKE '%gucci%' OR
          oi.product_name ILIKE '%marmont%'
        );
      `;

      const correctResult = await this.orderPool.query(correctProductsQuery, [
        sallyVendorId,
      ]);

      if (correctResult.rows.length === 0) {
        console.log('⚠️  No Gucci products found for Sally');
      } else {
        console.log("Products that should appear in Sally's dashboard:");
        correctResult.rows.forEach((row) => {
          console.log(`   ✅ ${row.product_name}`);
          console.log(`      Order: ${row.order_number}`);
          console.log(`      Status: ${row.status}`);
          console.log(`      Payment: ${row.payment_status} - $${row.amount}`);
        });
      }

      return {
        totalOrders: parseInt(stats.total_orders),
        totalRevenue: parseFloat(stats.total_revenue),
        hasIncorrectProducts: incorrectResult.rows.length > 0,
        hasCorrectProducts: correctResult.rows.length > 0,
        orders: ordersResult.rows,
      };
    } catch (error) {
      console.error("❌ Error verifying Sally's data:", error);
      if (error.code === 'ECONNREFUSED') {
        console.log('\n💡 Tip: Make sure the order database is running:');
        console.log('   docker compose up -d order-db');
        console.log('   # Then wait a moment and try again');
      }
      throw error;
    }
  }

  async close() {
    await this.orderPool.end();
  }
}

// CLI Usage
async function main() {
  const verifier = new SallyDataVerifier();

  try {
    console.log('🔍 Sally Data Verification Report');
    console.log('=================================\n');
    console.log(`Sally Vendor ID: a3256ba6-bdb2-4893-aed6-3b148ca80e8a`);
    console.log(`Database: order_db (port 5435)\n`);

    const result = await verifier.verifyData();

    console.log('\n📋 Summary:');
    console.log('===========');
    console.log(`✅ Data verification completed`);
    console.log(`📦 Total Orders: ${result.totalOrders}`);
    console.log(`💰 Total Revenue: $${result.totalRevenue.toFixed(2)}`);
    console.log(
      `${result.hasIncorrectProducts ? '❌' : '✅'} Incorrect Products: ${result.hasIncorrectProducts ? 'Found' : 'None'}`
    );
    console.log(
      `${result.hasCorrectProducts ? '✅' : '⚠️'} Correct Products: ${result.hasCorrectProducts ? 'Found' : 'Missing'}`
    );

    if (
      result.totalRevenue > 0 &&
      !result.hasIncorrectProducts &&
      result.hasCorrectProducts
    ) {
      console.log("\n🎉 Sally's data appears to be correctly fixed!");
      console.log('Her dashboard should now show the right sales information.');
    } else {
      console.log("\n⚠️  Sally's data may need further investigation.");
    }
  } catch (error) {
    console.error('💥 Verification failed:', error.message);
    process.exit(1);
  } finally {
    await verifier.close();
  }
}

// Export for programmatic use
module.exports = SallyDataVerifier;

// Run if called directly
if (require.main === module) {
  main();
}
