const { Pool } = require('pg');

// Jordan 4 Sales Finder
// Searches for all Jordan 4 related sales and orders in the system
class Jordan4SalesFinder {
  constructor() {
    this.orderPool = new Pool({
      connectionString:
        process.env.DATABASE_URL ||
        'postgresql://vendfinder:vendfinder_pass@localhost:5435/order_db',
    });
  }

  async findJordan4Sales() {
    try {
      console.log('🔍 Searching for Jordan 4 sales...\n');

      // Search for Jordan 4 orders
      const jordan4Query = `
        SELECT
          o.id,
          o.order_number,
          o.total_amount,
          o.status as order_status,
          o.buyer_email,
          o.created_at,
          oi.product_name,
          oi.price,
          oi.vendor_id,
          p.amount as payment_amount,
          p.status as payment_status,
          p.stripe_payment_intent_id
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN payments p ON o.id = p.order_id
        WHERE (
          oi.product_name ILIKE '%jordan%4%' OR
          oi.product_name ILIKE '%jordan 4%' OR
          oi.product_name ILIKE '%air jordan 4%' OR
          oi.product_name ILIKE '%aj4%' OR
          oi.product_name ILIKE '%jordan iv%'
        )
        ORDER BY o.created_at DESC;
      `;

      const result = await this.orderPool.query(jordan4Query);

      console.log('👟 Jordan 4 Sales Found:');
      console.log('========================');

      if (result.rows.length === 0) {
        console.log('❌ No Jordan 4 sales found in the database');

        // Show what we'd expect to find
        console.log('\n💡 Expected Jordan 4 Products:');
        console.log(
          '- Air Jordan 4 Retro Bred (Product ID: 00000000-0000-0000-0000-000000000001)'
        );
        console.log('- Price: $215 - $250');
        console.log('- Available sizes: 7-13');

        return { found: false, orders: [] };
      }

      let totalJordan4Revenue = 0;
      const vendorSales = {};

      result.rows.forEach((row, index) => {
        console.log(`\n${index + 1}. Order: ${row.order_number}`);
        console.log(`   Product: ${row.product_name}`);
        console.log(`   Buyer: ${row.buyer_email}`);
        console.log(`   Price: $${row.price}`);
        console.log(`   Order Status: ${row.order_status}`);
        console.log(`   Payment Status: ${row.payment_status || 'N/A'}`);
        console.log(`   Vendor ID: ${row.vendor_id}`);
        console.log(`   Date: ${row.created_at}`);
        console.log(`   Stripe ID: ${row.stripe_payment_intent_id || 'N/A'}`);

        // Track revenue
        if (
          row.payment_status === 'succeeded' ||
          row.payment_status === 'paid'
        ) {
          totalJordan4Revenue +=
            parseFloat(row.payment_amount) || parseFloat(row.price) || 0;
        }

        // Track by vendor
        if (!vendorSales[row.vendor_id]) {
          vendorSales[row.vendor_id] = [];
        }
        vendorSales[row.vendor_id].push(row);
      });

      console.log(
        `\n💰 Total Jordan 4 Revenue: $${totalJordan4Revenue.toFixed(2)}`
      );

      // Show breakdown by vendor
      console.log('\n📊 Sales by Vendor:');
      console.log('===================');
      Object.keys(vendorSales).forEach((vendorId) => {
        const sales = vendorSales[vendorId];
        const vendorRevenue = sales.reduce((sum, sale) => {
          if (
            sale.payment_status === 'succeeded' ||
            sale.payment_status === 'paid'
          ) {
            return (
              sum +
              (parseFloat(sale.payment_amount) || parseFloat(sale.price) || 0)
            );
          }
          return sum;
        }, 0);

        console.log(
          `Vendor ${vendorId}: ${sales.length} sales, $${vendorRevenue.toFixed(2)} revenue`
        );
      });

      return {
        found: true,
        orders: result.rows,
        totalRevenue: totalJordan4Revenue,
        vendorBreakdown: vendorSales,
      };
    } catch (error) {
      console.error('❌ Error searching for Jordan 4 sales:', error);
      if (error.code === 'ECONNREFUSED') {
        console.log(
          '\n💡 Database not available. The search data might be in static files.'
        );
        this.showStaticJordan4Data();
      }
      throw error;
    }
  }

  showStaticJordan4Data() {
    console.log('\n📱 Jordan 4 Data from Static Files:');
    console.log('===================================');

    console.log('🏪 Active Listings:');
    console.log('- Air Jordan 4 Retro Bred (LST-001)');
    console.log('  Size: US 10 | Condition: New');
    console.log('  Ask Price: $285 | Lowest Ask: $265');
    console.log('  Highest Bid: $240 | Last Sale: $270');
    console.log('  Status: Active | Views: 342');

    console.log('\n🛒 Recent Purchases:');
    console.log('- Purchase ID: PUR-001');
    console.log('  Product: Air Jordan 4 Retro Bred');
    console.log('  Size: US 10 | Price: $245');
    console.log('  Status: Delivered | Date: 2024-09-05');
    console.log('  Seller: SneakerVault (seller-12)');
    console.log('  Tracking: 1Z999AA10123456790');

    console.log('\n💝 Favorites & Portfolio:');
    console.log('- Favorited by multiple users');
    console.log('- In portfolio with current value tracking');
    console.log('- Lowest Ask: $265');

    console.log('\n💰 Payout Data:');
    console.log('- Multiple Jordan 4 sales in payout batches');
    console.log('- Payment method: PayPal');
    console.log('- Status: Pending processing');
  }

  async close() {
    await this.orderPool.end();
  }
}

// CLI Usage
async function main() {
  const finder = new Jordan4SalesFinder();

  try {
    console.log('👟 Jordan 4 Sales Search');
    console.log('========================\n');

    const result = await finder.findJordan4Sales();

    console.log('\n📋 Summary:');
    console.log('===========');

    if (result.found) {
      console.log(`✅ Found ${result.orders.length} Jordan 4 sales`);
      console.log(`💰 Total Revenue: $${result.totalRevenue.toFixed(2)}`);
      console.log(
        `👥 Unique Vendors: ${Object.keys(result.vendorBreakdown).length}`
      );
    } else {
      console.log('❌ No Jordan 4 sales found in database');
      console.log('💡 Check static data files for product listings');
    }
  } catch (error) {
    console.error('💥 Search failed:', error.message);
    process.exit(1);
  } finally {
    await finder.close();
  }
}

// Export for programmatic use
module.exports = Jordan4SalesFinder;

// Run if called directly
if (require.main === module) {
  main();
}
