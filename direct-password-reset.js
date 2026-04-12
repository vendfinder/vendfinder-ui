/**
 * Direct password reset script to run inside user-service container
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  let pool;

  try {
    // Try common database connection patterns
    const dbUrls = [
      process.env.DATABASE_URL,
      'postgresql://vendfinder:vendfinder_pass@user-db:5432/user_db',
      'postgresql://postgres:postgres@user-db:5432/users',
      'postgresql://vendfinder:vendfinder_pass@vendor-db:5432/vendor_db',
    ];

    let connected = false;

    for (const url of dbUrls) {
      if (!url) continue;

      try {
        console.log(`Trying connection: ${url.replace(/:[^:]*@/, ':***@')}`);
        pool = new Pool({ connectionString: url });

        // Test connection
        await pool.query('SELECT 1');
        console.log('✅ Connected successfully!');
        connected = true;
        break;
      } catch (e) {
        console.log(`❌ Connection failed: ${e.message}`);
        if (pool) pool.end();
      }
    }

    if (!connected) {
      console.log('❌ Could not connect to any database');
      return;
    }

    // Hash new password
    const newPassword = 'testpass123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log(`\n🔐 Resetting password for testuser12345`);
    console.log(`📧 Email: testuser12345@example.com`);
    console.log(`🔑 New password: ${newPassword}`);

    // Try to update password
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE username = $2 OR email = $3 RETURNING username, email',
      [hashedPassword, 'testuser12345', 'testuser12345@example.com']
    );

    if (result.rowCount > 0) {
      console.log('✅ Password reset successful!');
      console.log('Updated user:', result.rows[0]);
      console.log('\n🚀 You can now login with:');
      console.log(`Username: testuser12345`);
      console.log(`Password: ${newPassword}`);
    } else {
      console.log('❌ User not found');

      // Try to see what users exist
      const users = await pool.query(
        'SELECT username, email FROM users LIMIT 5'
      );
      console.log('Available users:');
      users.rows.forEach((u) => console.log(`- ${u.username} (${u.email})`));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (pool) pool.end();
  }
}

resetPassword().catch(console.error);
