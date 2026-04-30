#!/bin/bash
# scripts/create-test-accounts.sh

set -euo pipefail

# Generate secure passwords
ADMIN_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-16)
SELLER_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-16)
BUYER_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-16)

echo "Generated passwords for VendFinder test accounts"
echo "Admin Password: $ADMIN_PASSWORD"
echo "Seller Password: $SELLER_PASSWORD"
echo "Buyer Password: $BUYER_PASSWORD"

# Store in temp file for later use
cat > scripts/account-credentials.txt << EOF
VendFinder Test Account Credentials
Generated: $(date)

Admin Account:
Email: admin-test@vendfinder.com
Password: $ADMIN_PASSWORD
Role: admin

Seller Account:
Email: seller-test@vendfinder.com
Password: $SELLER_PASSWORD
Role: seller

Buyer Account:
Email: buyer-test@vendfinder.com
Password: $BUYER_PASSWORD
Role: buyer

All accounts have premium tier and full verification.
EOF

# Function to generate bcrypt hash
generate_bcrypt_hash() {
    local password="$1"
    # Use Node.js to generate bcrypt hash (salt rounds 12)
    node -e "
    const bcrypt = require('bcrypt');
    const hash = bcrypt.hashSync('$password', 12);
    console.log(hash);
    " 2>/dev/null || {
        # Fallback: use Python if Node.js not available
        python3 -c "
import bcrypt
password = '$password'.encode('utf-8')
hashed = bcrypt.hashpw(password, bcrypt.gensalt(rounds=12))
print(hashed.decode('utf-8'))
        "
    }
}

# Generate password hashes
ADMIN_HASH=$(generate_bcrypt_hash "$ADMIN_PASSWORD")
SELLER_HASH=$(generate_bcrypt_hash "$SELLER_PASSWORD")
BUYER_HASH=$(generate_bcrypt_hash "$BUYER_PASSWORD")

echo "Password hashes generated successfully"

echo "Credentials saved to scripts/account-credentials.txt"