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

# Update seller account
update_seller_account() {
    echo "Updating seller-test@vendfinder.com account..."

    local seller_email="seller-test@vendfinder.com"
    local seller_hash="$SELLER_HASH"

    # SQL to update seller account
    local sql="UPDATE users SET
        password_hash = '$seller_hash',
        role = 'seller',
        subscription_tier = 'premium',
        is_verified = true,
        is_active = true,
        email_verified_at = CURRENT_TIMESTAMP,
        kyc_status = 'verified',
        kyc_verified_at = CURRENT_TIMESTAMP,
        tos_accepted_at = CURRENT_TIMESTAMP,
        privacy_accepted_at = CURRENT_TIMESTAMP,
        seller_fee_paid = true,
        seller_fee_paid_at = CURRENT_TIMESTAMP,
        tos_version = '1.0',
        auth_provider = 'email',
        failed_login_attempts = 0,
        locked_at = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE email = '$seller_email';"

    kubectl exec -n vendfinder user-db-0 -- psql -U vendfinder -d user_db -c "$sql"

    if [ $? -eq 0 ]; then
        echo "✅ Seller account updated successfully"
    else
        echo "❌ Failed to update seller account"
        return 1
    fi
}

# Verify seller account
verify_seller_account() {
    echo "Verifying seller account configuration..."

    local result=$(kubectl exec -n vendfinder user-db-0 -- psql -U vendfinder -d user_db -t -c \
        "SELECT email, role, subscription_tier, is_verified, kyc_status, seller_fee_paid
         FROM users WHERE email = 'seller-test@vendfinder.com';" | tr -s ' ')

    echo "Seller account details: $result"

    echo "$result" | grep -q "seller" && echo "✅ Role correctly set to seller" || echo "❌ Role not set correctly"
    echo "$result" | grep -q "premium" && echo "✅ Premium tier enabled" || echo "❌ Premium tier not enabled"
    echo "$result" | grep -q "t.*verified.*t" && echo "✅ Account verified and seller fee paid" || echo "❌ Account configuration issue"
}

# Create buyer account
create_buyer_account() {
    echo "Creating buyer-test@vendfinder.com account..."

    local buyer_email="buyer-test@vendfinder.com"
    local buyer_username="vf_buyer_test"
    local buyer_hash="$BUYER_HASH"

    # Check if account already exists
    if [ "$BUYER_EXISTS" -eq 1 ]; then
        echo "⚠️  Buyer account already exists, updating instead..."
        update_existing_buyer_account
        return
    fi

    # SQL to create new buyer account
    local sql="INSERT INTO users (
        email, username, password_hash, role, subscription_tier,
        is_verified, is_active, email_verified_at, kyc_status, kyc_verified_at,
        tos_accepted_at, privacy_accepted_at, tos_version, auth_provider,
        failed_login_attempts, created_at, updated_at
    ) VALUES (
        '$buyer_email', '$buyer_username', '$buyer_hash', 'buyer', 'premium',
        true, true, CURRENT_TIMESTAMP, 'verified', CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, '1.0', 'email',
        0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    );"

    kubectl exec -n vendfinder user-db-0 -- psql -U vendfinder -d user_db -c "$sql"

    if [ $? -eq 0 ]; then
        echo "✅ Buyer account created successfully"
    else
        echo "❌ Failed to create buyer account"
        return 1
    fi
}

# Update existing buyer account
update_existing_buyer_account() {
    echo "Updating existing buyer-test@vendfinder.com account..."

    local buyer_email="buyer-test@vendfinder.com"
    local buyer_hash="$BUYER_HASH"

    # SQL to update existing buyer account
    local sql="UPDATE users SET
        password_hash = '$buyer_hash',
        role = 'buyer',
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
    WHERE email = '$buyer_email';"

    kubectl exec -n vendfinder user-db-0 -- psql -U vendfinder -d user_db -c "$sql"

    echo "✅ Existing buyer account updated"
}

# Verify buyer account
verify_buyer_account() {
    echo "Verifying buyer account configuration..."

    local result=$(kubectl exec -n vendfinder user-db-0 -- psql -U vendfinder -d user_db -t -c \
        "SELECT email, username, role, subscription_tier, is_verified, kyc_status
         FROM users WHERE email = 'buyer-test@vendfinder.com';" | tr -s ' ')

    echo "Buyer account details: $result"

    echo "$result" | grep -q "buyer" && echo "✅ Role correctly set to buyer" || echo "❌ Role not set correctly"
    echo "$result" | grep -q "premium" && echo "✅ Premium tier enabled" || echo "❌ Premium tier not enabled"
    echo "$result" | grep -q "t.*verified" && echo "✅ Account verified" || echo "❌ Account not verified"
}

# Final verification of all accounts
final_verification() {
    echo "Running final verification of all accounts..."

    # Get all test accounts
    local all_accounts=$(kubectl exec -n vendfinder user-db-0 -- psql -U vendfinder -d user_db -t -c \
        "SELECT email, role, subscription_tier, is_verified, is_active, kyc_status
         FROM users WHERE email IN ('admin-test@vendfinder.com', 'seller-test@vendfinder.com', 'buyer-test@vendfinder.com')
         ORDER BY email;" | tr -s ' ')

    echo "=== Final Account Summary ==="
    echo "$all_accounts"
    echo

    # Count successful accounts
    local account_count=$(echo "$all_accounts" | wc -l)
    local premium_count=$(echo "$all_accounts" | grep -c "premium")
    local verified_count=$(echo "$all_accounts" | grep -c "t.*t.*verified")

    echo "📊 Summary:"
    echo "   Total accounts: $account_count"
    echo "   Premium tier: $premium_count"
    echo "   Verified: $verified_count"

    if [ "$account_count" -eq 3 ] && [ "$premium_count" -eq 3 ] && [ "$verified_count" -eq 3 ]; then
        echo "✅ All accounts successfully configured!"
        return 0
    else
        echo "❌ Some accounts may not be properly configured"
        return 1
    fi
}

# Main execution function
main() {
    echo "=== VendFinder Test Accounts Creation ==="
    echo "Timestamp: $(date)"
    echo

    # Pre-flight checks
    validate_k8s_access
    validate_db_connection
    check_existing_accounts
    echo

    # Create database backup
    backup_admin_account
    echo

    # Account operations
    echo "🔄 Starting account operations..."

    # Update admin account
    update_admin_account
    verify_admin_account
    echo

    # Update seller account
    update_seller_account
    verify_seller_account
    echo

    # Create/update buyer account
    create_buyer_account
    verify_buyer_account
    echo

    # Final verification
    echo "🔍 Final account verification..."
    final_verification

    echo
    echo "✅ All operations completed successfully!"
    echo "📄 Credentials saved in: scripts/account-credentials.txt"
    echo "🔐 Please securely store and distribute credentials"
}

# Only run main if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main
fi

echo "Credentials saved to scripts/account-credentials.txt"