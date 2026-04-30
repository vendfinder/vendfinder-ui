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

# Validate database connectivity
validate_db_connection() {
    echo "Validating database connection..."
    kubectl exec -n vendfinder user-db-0 -- psql -U vendfinder -d user_db -c "SELECT 1;" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Database connection successful"
    else
        echo "❌ Database connection failed"
        exit 1
    fi
}

# Validate Kubernetes access
validate_k8s_access() {
    echo "Validating Kubernetes access..."
    kubectl get pod -n vendfinder user-db-0 > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Kubernetes access successful"
    else
        echo "❌ Cannot access user-db-0 pod"
        exit 1
    fi
}

# Check existing accounts
check_existing_accounts() {
    echo "Checking existing accounts..."

    # Check admin-test account
    ADMIN_EXISTS=$(kubectl exec -n vendfinder user-db-0 -- psql -U vendfinder -d user_db -t -c \
        "SELECT COUNT(*) FROM users WHERE email = 'admin-test@vendfinder.com';" | tr -d ' ')

    # Check seller-test account
    SELLER_EXISTS=$(kubectl exec -n vendfinder user-db-0 -- psql -U vendfinder -d user_db -t -c \
        "SELECT COUNT(*) FROM users WHERE email = 'seller-test@vendfinder.com';" | tr -d ' ')

    # Check buyer-test account
    BUYER_EXISTS=$(kubectl exec -n vendfinder user-db-0 -- psql -U vendfinder -d user_db -t -c \
        "SELECT COUNT(*) FROM users WHERE email = 'buyer-test@vendfinder.com';" | tr -d ' ')

    echo "Admin account exists: $ADMIN_EXISTS"
    echo "Seller account exists: $SELLER_EXISTS"
    echo "Buyer account exists: $BUYER_EXISTS"
}

echo "Password hashes generated successfully"

main() {
    echo "=== VendFinder Test Accounts Creation ==="

    validate_k8s_access
    validate_db_connection
    check_existing_accounts

    echo "Ready to create/update accounts with generated credentials"
}

# Only run main if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main
fi

echo "Credentials saved to scripts/account-credentials.txt"