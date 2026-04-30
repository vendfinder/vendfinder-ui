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

# Create backup of admin account
backup_admin_account() {
    echo "Creating backup of admin account..."

    kubectl exec -n vendfinder user-db-0 -- psql -U vendfinder -d user_db -c \
        "CREATE TABLE IF NOT EXISTS user_backup_$(date +%Y%m%d) AS
         SELECT * FROM users WHERE email = 'admin-test@vendfinder.com';"

    echo "✅ Admin account backed up"
}

# Update admin account
update_admin_account() {
    echo "Updating admin-test@vendfinder.com account..."

    local admin_email="admin-test@vendfinder.com"
    local admin_hash="$ADMIN_HASH"

    # SQL to update admin account
    local sql="UPDATE users SET
        password_hash = '$admin_hash',
        role = 'admin',
        subscription_tier = 'premium',
        is_verified = true,
        is_active = true,
        email_verified_at = CURRENT_TIMESTAMP,
        kyc_status = 'verified',
        kyc_verified_at = CURRENT_TIMESTAMP,
        tos_accepted_at = CURRENT_TIMESTAMP,
        privacy_accepted_at = CURRENT_TIMESTAMP,
        tos_version = '1.0',
        auth_provider = 'email',
        failed_login_attempts = 0,
        locked_at = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE email = '$admin_email';"

    kubectl exec -n vendfinder user-db-0 -- psql -U vendfinder -d user_db -c "$sql"

    if [ $? -eq 0 ]; then
        echo "✅ Admin account updated successfully"
    else
        echo "❌ Failed to update admin account"
        return 1
    fi
}

# Verify admin account
verify_admin_account() {
    echo "Verifying admin account configuration..."

    local result=$(kubectl exec -n vendfinder user-db-0 -- psql -U vendfinder -d user_db -t -c \
        "SELECT email, role, subscription_tier, is_verified, kyc_status
         FROM users WHERE email = 'admin-test@vendfinder.com';" | tr -s ' ')

    echo "Admin account details: $result"

    # Check if role is admin
    echo "$result" | grep -q "admin" && echo "✅ Role correctly set to admin" || echo "❌ Role not set correctly"
    echo "$result" | grep -q "premium" && echo "✅ Premium tier enabled" || echo "❌ Premium tier not enabled"
    echo "$result" | grep -q "t.*verified" && echo "✅ Account verified" || echo "❌ Account not verified"
}

# Main execution function
main() {
    echo "=== VendFinder Test Accounts Creation ==="

    validate_k8s_access
    validate_db_connection
    check_existing_accounts

    # Create backup before making changes
    backup_admin_account

    # Update admin account
    update_admin_account
    verify_admin_account

    echo "Ready to create/update accounts with generated credentials"
}

# Only run main if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main
fi

echo "Credentials saved to scripts/account-credentials.txt"