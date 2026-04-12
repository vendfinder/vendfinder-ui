const { Pool } = require('pg');

// Buyer Order Status Checker
// Checks on Kathie Lee's order from Sally's Gucci bag
class BuyerOrderChecker {
  constructor() {
    this.orderPool = new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        'postgresql://vendfinder:vendfinder_pass@localhost:5435/order_db',
    });
  }

  async checkKathieLeeOrder() {
    try {
      console.log("🔍 Checking Kathie Lee's order status...\n");

      const buyerEmail = 'jgroover87@yahoo.com';
      const orderNumber = 'VF-2026-00017';
      const sallyVendorId = 'a3256ba6-bdb2-4893-aed6-3b148ca80e8a';

      // Check the specific order
      const orderQuery = `
        SELECT
          o.id,
          o.order_number,
          o.total_amount,
          o.status as order_status,
          o.created_at,
          o.updated_at,
          o.buyer_email,
          o.shipping_address,
          o.tracking_number,
          oi.product_name,
          oi.price,
          oi.vendor_id,
          p.amount as payment_amount,
          p.status as payment_status,
          p.stripe_payment_intent_id,
          p.created_at as payment_date
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN payments p ON o.id = p.order_id
        WHERE (o.buyer_email = $1 OR o.order_number = $2)
        AND oi.vendor_id = $3
        ORDER BY o.created_at DESC;
      `;

      const result = await this.orderPool.query(orderQuery, [
        buyerEmail,
        orderNumber,
        sallyVendorId,
      ]);

      if (result.rows.length === 0) {
        console.log('❌ No order found for Kathie Lee from Sally');
        return { found: false };
      }

      const order = result.rows[0];

      console.log('👤 Buyer Information:');
      console.log('====================');
      console.log(`Email: ${order.buyer_email}`);
      console.log(`Order Number: ${order.order_number}`);
      console.log(`Order Date: ${order.created_at}`);
      console.log(`Last Updated: ${order.updated_at}`);

      console.log('\n📦 Order Details:');
      console.log('=================');
      console.log(`Product: ${order.product_name}`);
      console.log(`Price: $${order.price}`);
      console.log(`Total: $${order.total_amount}`);
      console.log(`Order Status: ${order.order_status}`);

      console.log('\n💳 Payment Information:');
      console.log('=======================');
      console.log(`Payment Amount: $${order.payment_amount}`);
      console.log(`Payment Status: ${order.payment_status}`);
      console.log(
        `Stripe Payment ID: ${order.stripe_payment_intent_id || 'N/A'}`
      );
      console.log(`Payment Date: ${order.payment_date}`);

      console.log('\n🚚 Shipping Information:');
      console.log('========================');
      console.log(
        `Shipping Address: ${order.shipping_address || 'Not provided'}`
      );
      console.log(
        `Tracking Number: ${order.tracking_number || 'Not assigned yet'}`
      );

      // Analyze order status
      console.log('\n📊 Order Analysis:');
      console.log('==================');

      const daysSinceOrder = Math.floor(
        (new Date() - new Date(order.created_at)) / (1000 * 60 * 60 * 24)
      );
      console.log(`Days since order: ${daysSinceOrder}`);

      if (
        order.payment_status === 'succeeded' &&
        order.order_status === 'processing'
      ) {
        console.log(
          '⏳ Status: Payment successful, awaiting shipment from Sally'
        );
        if (daysSinceOrder > 2) {
          console.log('⚠️  Order has been processing for more than 2 days');
          console.log('💡 Recommendation: Sally should ship the item soon');
        }
      } else if (order.order_status === 'shipped') {
        console.log('🚚 Status: Item has been shipped');
      } else if (order.order_status === 'delivered') {
        console.log('✅ Status: Item delivered successfully');
      } else {
        console.log(
          `❓ Status: ${order.order_status} (payment: ${order.payment_status})`
        );
      }

      // Check if there might be issues
      const issues = [];
      if (order.payment_status !== 'succeeded') {
        issues.push(`Payment not successful: ${order.payment_status}`);
      }
      if (daysSinceOrder > 5 && order.order_status === 'processing') {
        issues.push('Order processing longer than expected (5+ days)');
      }
      if (!order.shipping_address) {
        issues.push('No shipping address on file');
      }

      if (issues.length > 0) {
        console.log('\n⚠️  Potential Issues:');
        console.log('=====================');
        issues.forEach((issue) => console.log(`   - ${issue}`));
      } else {
        console.log('\n✅ No issues detected with this order');
      }

      return {
        found: true,
        order: order,
        daysSinceOrder: daysSinceOrder,
        issues: issues,
        needsAction:
          issues.length > 0 ||
          (daysSinceOrder > 2 && order.order_status === 'processing'),
      };
    } catch (error) {
      console.error('❌ Error checking buyer order:', error);
      throw error;
    }
  }

  async close() {
    await this.orderPool.end();
  }
}

// CLI Usage
async function main() {
  const checker = new BuyerOrderChecker();

  try {
    console.log('👤 Kathie Lee Order Status Check');
    console.log('================================\n');
    console.log("Checking order for Sally's Gucci bag...\n");

    const result = await checker.checkKathieLeeOrder();

    console.log('\n📋 Summary:');
    console.log('===========');

    if (!result.found) {
      console.log('❌ Order not found - this indicates a data issue');
    } else if (result.needsAction) {
      console.log('⚠️  Order may need attention from Sally or support');
    } else {
      console.log('✅ Order appears to be progressing normally');
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(
        '💡 Database not available. Start with: docker compose up -d order-db'
      );
    }
    console.error('💥 Check failed:', error.message);
    process.exit(1);
  } finally {
    await checker.close();
  }
}

// Export for programmatic use
module.exports = BuyerOrderChecker;

// Run if called directly
if (require.main === module) {
  main();
}
