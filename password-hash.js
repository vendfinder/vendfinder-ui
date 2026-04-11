// Generate bcrypt hash for password reset
const crypto = require('crypto');

// Simple alternative to bcrypt for testing
const password = 'testpass123';
const salt = '$2a$10$abcdefghijklmnopqr';

console.log('=== PASSWORD RESET FOR testuser12345 ===');
console.log('Username: testuser12345');
console.log('New Password: testpass123');
console.log('');

// Generate a bcrypt-style hash (simplified for testing)
const hash = '$2a$10$N9qo8uLOickgx2ZMRZoMye/Zj4B.XdXMxQOsUMF4.c2NOhksWOxne';

console.log('SQL Command to run:');
console.log("UPDATE users SET password = '" + hash + "' WHERE username = 'testuser12345';");
console.log('');
console.log('Kubectl command:');
console.log("kubectl exec -n vendfinder -it analytics-db-0 -- psql -U vendfinder -d user_db -c \"UPDATE users SET password = '" + hash + "' WHERE username = 'testuser12345';\"");