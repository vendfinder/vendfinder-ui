const { Pool } = require('pg');

// Fix Sally's paywall issue by checking and updating her seller fee status
class SallyPaywallFix {
  constructor() {
    // Connect to user database
    this.userPool = new Pool({
      connectionString:
        process.env.USER_DATABASE_URL ||
        'postgresql://vendfinder:vendfinder_pass@localhost:5433/user_db'
    });
  }

  async checkSallyStatus() {
    try {
      console.log("🔍 Checking Sally's current paywall status...\n");

      // Find Sally by email (from the verification summary)
      const sallyEmail = 'sally@vendfinder.com';

      const userQuery = `
        SELECT
          id,
          email,
          username,
          role,
          trial_ends_at,
          seller_fee_paid,
          seller_fee_paid_at,
          created_at,
          updated_at
        FROM users
        WHERE email = $1
      `;

      const result = await this.userPool.query(userQuery, [sallyEmail]);

      if (result.rows.length === 0) {
        console.log(`❌ Sally not found with email: ${sallyEmail}`);
        return null;
      }

      const sally = result.rows[0];
      console.log("📋 Sally's Current Status:");
      console.log('========================');
      console.log(`User ID: ${sally.id}`);
      console.log(`Email: ${sally.email}`);
      console.log(`Username: ${sally.username || 'N/A'}`);
      console.log(`Role: ${sally.role}`);
      console.log(`Trial Ends: ${sally.trial_ends_at || 'N/A'}`);
      console.log(`Seller Fee Paid: ${sally.seller_fee_paid ? '✅ YES' : '❌ NO'}`);
      console.log(`Fee Paid At: ${sally.seller_fee_paid_at || 'Never'}`);
      console.log(`Account Created: ${sally.created_at}`);

      // Check if trial is still active
      const trialActive = sally.trial_ends_at && new Date() < new Date(sally.trial_ends_at);
      const canList = trialActive || sally.seller_fee_paid;

      console.log(`\n🚪 Listing Access:`);
      console.log(`Trial Active: ${trialActive ? '✅ YES' : '❌ NO'}`);
      console.log(`Can List Products: ${canList ? '✅ YES' : '❌ NO (PAYWALL ACTIVE)'}`);

      return sally;
    } catch (error) {
      console.error("❌ Error checking Sally's status:", error);
      throw error;
    }
  }

  async fixSallyPaywall(sallyId) {
    try {
      console.log(`\n🔧 Removing paywall for Sally (ID: ${sallyId})...`);

      const updateQuery = `
        UPDATE users
        SET
          seller_fee_paid = TRUE,
          seller_fee_paid_at = NOW(),
          updated_at = NOW()
        WHERE id = $1
        RETURNING id, email, seller_fee_paid, seller_fee_paid_at
      `;

      const result = await this.userPool.query(updateQuery, [sallyId]);
      const updatedSally = result.rows[0];

      console.log("✅ Paywall removed successfully!");
      console.log('==============================');
      console.log(`User ID: ${updatedSally.id}`);
      console.log(`Email: ${updatedSally.email}`);
      console.log(`Seller Fee Paid: ${updatedSally.seller_fee_paid ? '✅ YES' : '❌ NO'}`);
      console.log(`Fee Paid At: ${updatedSally.seller_fee_paid_at}`);

      return updatedSally;
    } catch (error) {
      console.error("❌ Error fixing Sally's paywall:", error);
      throw error;
    }
  }

  async close() {
    await this.userPool.end();
  }
}

async function main() {
  const fixer = new SallyPaywallFix();

  try {
    console.log('🚪 Sally Paywall Fix Utility');
    console.log('============================\n');

    // Check current status
    const sally = await fixer.checkSallyStatus();

    if (!sally) {
      console.log("❌ Cannot proceed without Sally's user record");
      return;
    }

    // Check if paywall fix is needed
    if (sally.seller_fee_paid) {
      console.log("\n🎉 Sally's seller fee is already marked as paid!");
      console.log("No paywall fix needed. She should have access to her products.");
    } else {
      console.log("\n⚠️  Sally's seller fee is NOT marked as paid.");
      console.log("This explains why she's blocked by the paywall.");

      // Fix the paywall
      await fixer.fixSallyPaywall(sally.id);

      console.log("\n🎉 Success! Sally can now access her listed products.");
      console.log("The paywall has been removed and she can:");
      console.log("- View her existing product listings");
      console.log("- Edit her products");
      console.log("- Create new listings");
      console.log("- Access her vendor dashboard");
    }

  } catch (error) {
    console.error('💥 Fix failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Tip: Make sure the user database is running:');
      console.log('   docker compose up -d user-db');
    }
    process.exit(1);
  } finally {
    await fixer.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = SallyPaywallFix;