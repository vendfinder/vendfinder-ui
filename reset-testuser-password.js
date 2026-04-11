#!/usr/bin/env node

/**
 * Quick script to reset testuser12345 password for PDF upload testing
 */

const bcrypt = require('bcryptjs');

async function main() {
  const username = 'testuser12345';
  const newPassword = 'testpass123';

  console.log('\n🔑 Password Reset for testuser12345');
  console.log('=====================================');

  try {
    // Hash the password (same as user-service uses)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log(`✅ Generated password hash for: ${username}`);
    console.log(`📝 Password: ${newPassword}`);
    console.log(`🔐 Hash: ${hashedPassword}`);

    console.log('\n🗄️  To update in database, run this SQL:');
    console.log(`UPDATE users SET password = '${hashedPassword}' WHERE username = '${username}';`);

    console.log('\n📋 Or use kubectl to execute:');
    console.log(`kubectl exec -n vendfinder deployment/user-service -- psql $DATABASE_URL -c "UPDATE users SET password = '${hashedPassword}' WHERE username = '${username}'"`);

    console.log('\n🚀 After update, login with:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${newPassword}`);

  } catch (error) {
    console.error('❌ Error generating password hash:', error.message);
  }
}

main().catch(console.error);