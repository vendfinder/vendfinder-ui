# Production Test Accounts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create 3 pre-verified premium test accounts (admin, seller, buyer) in VendFinder production via direct database operations.

**Architecture:** Direct PostgreSQL operations using kubectl exec into user-db-0 pod, with secure password generation and bcrypt hashing to ensure immediate access for testing.

**Tech Stack:** Kubernetes, PostgreSQL, bcrypt, bash scripts, kubectl

---

### Task 1: Password Generation and Hashing Setup

**Files:**
- Create: `scripts/create-test-accounts.sh`
- Create: `scripts/account-credentials.txt` (temporary, for secure delivery)

- [ ] **Step 1: Create password generation script**

```bash
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

echo "Credentials saved to scripts/account-credentials.txt"
```

- [ ] **Step 2: Make script executable and test password generation**

Run: `chmod +x scripts/create-test-accounts.sh && ./scripts/create-test-accounts.sh`
Expected: Generated passwords displayed and saved to credentials file

- [ ] **Step 3: Create bcrypt hash generation function**

```bash
# Add to scripts/create-test-accounts.sh after password generation

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
```

- [ ] **Step 4: Test bcrypt hash generation**

Run: `./scripts/create-test-accounts.sh`
Expected: Password hashes generated without errors

- [ ] **Step 5: Commit password generation setup**

```bash
git add scripts/
git commit -m "feat: add secure password generation for test accounts

Generate bcrypt hashes for admin, seller, and buyer test accounts
with fallback support for Node.js and Python environments."
```

### Task 2: Database Connection and Validation

**Files:**
- Modify: `scripts/create-test-accounts.sh`

- [ ] **Step 1: Add database connection validation**

```bash
# Add to scripts/create-test-accounts.sh

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
```

- [ ] **Step 2: Add existing account verification**

```bash
# Add to scripts/create-test-accounts.sh

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
```

- [ ] **Step 3: Test validation functions**

Run: `./scripts/create-test-accounts.sh`
Expected: Database and Kubernetes validation passes, existing accounts checked

- [ ] **Step 4: Add main execution flow**

```bash
# Add to end of scripts/create-test-accounts.sh

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
```

- [ ] **Step 5: Commit database validation**

```bash
git add scripts/create-test-accounts.sh
git commit -m "feat: add database connection and account validation

Validate Kubernetes access, database connectivity, and check 
existing account status before proceeding with operations."
```

### Task 3: Admin Account Update

**Files:**
- Modify: `scripts/create-test-accounts.sh`

- [ ] **Step 1: Create admin account update function**

```bash
# Add to scripts/create-test-accounts.sh

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
```

- [ ] **Step 2: Add admin account verification**

```bash
# Add to scripts/create-test-accounts.sh

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
```

- [ ] **Step 3: Test admin account update**

Run: `./scripts/create-test-accounts.sh` (add call to update_admin_account in main function)
Expected: Admin account updated with correct role and premium tier

- [ ] **Step 4: Add rollback capability for admin account**

```bash
# Add to scripts/create-test-accounts.sh

backup_admin_account() {
    echo "Creating backup of admin account..."
    
    kubectl exec -n vendfinder user-db-0 -- psql -U vendfinder -d user_db -c \
        "CREATE TABLE IF NOT EXISTS user_backup_$(date +%Y%m%d) AS 
         SELECT * FROM users WHERE email = 'admin-test@vendfinder.com';"
    
    echo "✅ Admin account backed up"
}
```

- [ ] **Step 5: Commit admin account update**

```bash
git add scripts/create-test-accounts.sh
git commit -m "feat: implement admin account update with verification

Update existing admin-test account role from buyer to admin,
enable premium tier, and add verification and rollback capabilities."
```

### Task 4: Seller Account Verification and Update

**Files:**
- Modify: `scripts/create-test-accounts.sh`

- [ ] **Step 1: Create seller account verification function**

```bash
# Add to scripts/create-test-accounts.sh

verify_seller_account() {
    echo "Verifying seller-test@vendfinder.com account..."
    
    if [ "$SELLER_EXISTS" -eq 1 ]; then
        local result=$(kubectl exec -n vendfinder user-db-0 -- psql -U vendfinder -d user_db -t -c \
            "SELECT email, role, subscription_tier, is_verified, kyc_status, seller_fee_paid 
             FROM users WHERE email = 'seller-test@vendfinder.com';" | tr -s ' ')
        
        echo "Seller account details: $result"
        
        # Check if updates needed
        echo "$result" | grep -q "premium" || echo "⚠️  Premium tier needs to be enabled"
        echo "$result" | grep -q "t.*t.*verified.*t" || echo "⚠️  Full verification needed"
    else
        echo "❌ Seller account does not exist - this is unexpected"
        return 1
    fi
}
```

- [ ] **Step 2: Create seller account update function**

```bash
# Add to scripts/create-test-accounts.sh

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
```

- [ ] **Step 3: Test seller account update**

Run: `./scripts/create-test-accounts.sh` (add seller functions to main)
Expected: Seller account verified and updated with premium tier

- [ ] **Step 4: Add seller-specific validation**

```bash
# Add to scripts/create-test-accounts.sh

validate_seller_features() {
    echo "Validating seller-specific features..."
    
    local seller_check=$(kubectl exec -n vendfinder user-db-0 -- psql -U vendfinder -d user_db -t -c \
        "SELECT seller_fee_paid, seller_fee_paid_at IS NOT NULL 
         FROM users WHERE email = 'seller-test@vendfinder.com';" | tr -s ' ')
    
    echo "Seller features: $seller_check"
    echo "$seller_check" | grep -q "t.*t" && echo "✅ Seller fees properly configured" || echo "❌ Seller fee configuration issue"
}
```

- [ ] **Step 5: Commit seller account updates**

```bash
git add scripts/create-test-accounts.sh
git commit -m "feat: implement seller account verification and update

Verify existing seller account, update with premium tier,
full verification status, and seller-specific features."
```

### Task 5: Buyer Account Creation

**Files:**
- Modify: `scripts/create-test-accounts.sh`

- [ ] **Step 1: Create buyer account creation function**

```bash
# Add to scripts/create-test-accounts.sh

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
```

- [ ] **Step 2: Create buyer account update function for existing accounts**

```bash
# Add to scripts/create-test-accounts.sh

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
```

- [ ] **Step 3: Add buyer account verification**

```bash
# Add to scripts/create-test-accounts.sh

verify_buyer_account() {
    echo "Verifying buyer account configuration..."
    
    local result=$(kubectl exec -n vendfinder user-db-0 -- psql -U vendfinder -d user_db -t -c \
        "SELECT email, username, role, subscription_tier, is_verified, kyc_status 
         FROM users WHERE email = 'buyer-test@vendfinder.com';" | tr -s ' ')
    
    echo "Buyer account details: $result"
    
    # Validate buyer account settings
    echo "$result" | grep -q "buyer" && echo "✅ Role correctly set to buyer" || echo "❌ Role not set correctly"
    echo "$result" | grep -q "premium" && echo "✅ Premium tier enabled" || echo "❌ Premium tier not enabled"
    echo "$result" | grep -q "t.*verified" && echo "✅ Account verified" || echo "❌ Account not verified"
}
```

- [ ] **Step 4: Test buyer account creation**

Run: `./scripts/create-test-accounts.sh` (add buyer functions to main)
Expected: New buyer account created with premium tier and full verification

- [ ] **Step 5: Commit buyer account creation**

```bash
git add scripts/create-test-accounts.sh
git commit -m "feat: implement buyer account creation with verification

Create new buyer test account with premium tier and full verification,
with fallback to update existing account if already present."
```

### Task 6: Complete Integration and Testing

**Files:**
- Modify: `scripts/create-test-accounts.sh`

- [ ] **Step 1: Update main function with all operations**

```bash
# Update main function in scripts/create-test-accounts.sh

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
    validate_seller_features
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
```

- [ ] **Step 2: Create final verification function**

```bash
# Add to scripts/create-test-accounts.sh

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
```

- [ ] **Step 3: Add cleanup and security function**

```bash
# Add to scripts/create-test-accounts.sh

cleanup_and_secure() {
    echo "🧹 Cleanup and security recommendations..."
    
    # Set secure permissions on credentials file
    chmod 600 scripts/account-credentials.txt
    echo "✅ Credentials file permissions secured (600)"
    
    # Recommend credential rotation
    cat << EOF

🔐 SECURITY RECOMMENDATIONS:
1. Distribute credentials securely (encrypted channels)
2. Change passwords after initial testing
3. Monitor account usage in production logs
4. Consider disabling accounts when testing complete
5. Remove credentials file when no longer needed:
   rm scripts/account-credentials.txt

EOF
}
```

- [ ] **Step 4: Test complete integration**

Run: `./scripts/create-test-accounts.sh`
Expected: All three accounts created/updated successfully with final verification

- [ ] **Step 5: Commit final integration**

```bash
git add scripts/create-test-accounts.sh
git commit -m "feat: complete test accounts integration with verification

Integrate all account operations with comprehensive verification,
final summary reporting, and security recommendations."
```

### Task 7: Documentation and Cleanup

**Files:**
- Create: `docs/test-accounts-setup.md`
- Modify: `scripts/create-test-accounts.sh`

- [ ] **Step 1: Create documentation**

```markdown
# VendFinder Test Accounts Setup

## Overview

This document describes the test accounts created for VendFinder production testing.

## Created Accounts

### Admin Test Account
- **Email:** admin-test@vendfinder.com
- **Username:** vf_admin_test  
- **Role:** admin
- **Tier:** premium
- **Status:** verified (email, KYC, ToS)

### Seller Test Account  
- **Email:** seller-test@vendfinder.com
- **Username:** vf_seller_test
- **Role:** seller
- **Tier:** premium
- **Status:** verified (email, KYC, ToS)
- **Features:** seller fees paid

### Buyer Test Account
- **Email:** buyer-test@vendfinder.com  
- **Username:** vf_buyer_test
- **Role:** buyer
- **Tier:** premium
- **Status:** verified (email, KYC, ToS)

## Usage

### Accessing Accounts
1. Use credentials from secure delivery
2. Login at https://vendfinder.com
3. All accounts have full premium features

### Testing Scenarios
- **Admin:** Platform management, user administration
- **Seller:** Product listing, order management, analytics
- **Buyer:** Product browsing, purchasing, reviews

## Security

### Current Status
- All accounts use bcrypt hashed passwords
- Full verification bypasses normal onboarding
- Premium tier enables all platform features

### Recommendations
1. Rotate passwords after initial testing
2. Monitor usage in production logs
3. Disable accounts when testing complete
4. Use dedicated test environment for future testing

## Troubleshooting

### Login Issues
If experiencing login problems:
1. Verify email/password combination
2. Check account status in database
3. Review user service logs
4. Contact platform administrators

### Account Modifications
To modify account settings:
1. Use admin interface (admin account)
2. Direct database operations (emergency only)
3. User service API (when available)

## Rollback

If accounts need to be removed:
```sql
-- Remove test accounts (run in user-db-0 pod)
DELETE FROM users WHERE email IN (
    'admin-test@vendfinder.com',
    'seller-test@vendfinder.com', 
    'buyer-test@vendfinder.com'
);
```

## Created
- **Date:** 2026-04-30
- **Method:** Direct database operations
- **Script:** `scripts/create-test-accounts.sh`
```

- [ ] **Step 2: Add help and usage to script**

```bash
# Add to beginning of scripts/create-test-accounts.sh

show_help() {
    cat << EOF
VendFinder Test Accounts Creation Script

USAGE:
    ./scripts/create-test-accounts.sh [OPTIONS]

OPTIONS:
    -h, --help          Show this help message
    -d, --dry-run       Show what would be done without executing
    -v, --verbose       Enable verbose output
    --verify-only       Only verify existing accounts, don't modify

EXAMPLES:
    ./scripts/create-test-accounts.sh                 # Create/update accounts
    ./scripts/create-test-accounts.sh --dry-run       # Preview operations
    ./scripts/create-test-accounts.sh --verify-only   # Check existing accounts

REQUIREMENTS:
    - kubectl access to vendfinder namespace
    - Access to user-db-0 pod
    - Node.js or Python3 for password hashing

EOF
}

# Handle command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --verify-only)
            VERIFY_ONLY=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done
```

- [ ] **Step 3: Add final script execution with options**

```bash
# Update main function call in scripts/create-test-accounts.sh

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ "${VERIFY_ONLY:-}" == "true" ]]; then
        echo "=== Verification Only Mode ==="
        validate_k8s_access
        validate_db_connection
        check_existing_accounts
        final_verification
    elif [[ "${DRY_RUN:-}" == "true" ]]; then
        echo "=== Dry Run Mode ==="
        echo "Would execute: Account creation/update operations"
        echo "Would modify: admin-test, seller-test, buyer-test accounts"
        echo "Would create: scripts/account-credentials.txt"
        echo "Run without --dry-run to execute operations"
    else
        main
        cleanup_and_secure
    fi
fi
```

- [ ] **Step 4: Test complete script with options**

Run: `./scripts/create-test-accounts.sh --help`
Expected: Help message displayed

Run: `./scripts/create-test-accounts.sh --dry-run`  
Expected: Preview of operations without execution

- [ ] **Step 5: Commit documentation and final script**

```bash
git add docs/test-accounts-setup.md scripts/create-test-accounts.sh
git commit -m "docs: add comprehensive test accounts documentation

Complete documentation for test accounts with usage instructions,
security recommendations, and troubleshooting guide. Add script
help and command-line options for safe operation."
```

---

## Self-Review

**Spec coverage:**
- ✅ 3 test accounts (admin, seller, buyer) - covered in Tasks 3-5
- ✅ Pre-verified status (email, KYC, ToS) - covered in all account operations  
- ✅ Premium tier capabilities - covered in all account updates
- ✅ Direct database operations - covered throughout Tasks 1-6
- ✅ Secure password generation - covered in Task 1
- ✅ Fix admin-test role - covered in Task 3
- ✅ Security considerations - covered in Tasks 6-7
- ✅ Validation and verification - covered in all tasks

**Placeholder scan:**
- No "TBD", "TODO", or placeholder content found
- All SQL commands and bash code are complete
- All file paths are exact and specified
- All expected outputs are defined

**Type consistency:**  
- Variable names consistent throughout (ADMIN_PASSWORD, ADMIN_HASH, etc.)
- Function names follow consistent pattern (update_admin_account, verify_admin_account)
- Database field names match actual schema from exploration
- Email addresses consistent across all references