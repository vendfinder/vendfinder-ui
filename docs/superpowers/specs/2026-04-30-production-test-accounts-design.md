# Production Test Accounts Creation Design

**Date:** 2026-04-30  
**Purpose:** Create verified premium test accounts for VendFinder production environment  
**Approach:** Direct database operations for immediate access

## Overview

Create 3 pre-verified premium test accounts to address ongoing platform login issues and enable comprehensive testing across all user roles.

## Requirements

### Account Specifications
- **3 total accounts** with distinct roles
- **Pre-verified status** (email, KYC, ToS)
- **Premium tier capabilities** for full feature testing
- **Secure password generation** with delivery

### Target Accounts
1. `admin-test@vendfinder.com` - Fix existing account role (buyer → admin)
2. `seller-test@vendfinder.com` - Verify existing account has premium tier
3. `buyer-test@vendfinder.com` - Create new premium buyer account

## Architecture

### Database Schema
Using existing VendFinder user database:
- **Database:** `postgresql://vendfinder:stagingpassword123@user-db:5432/user_db`
- **Primary Table:** `users` 
- **Pod:** `user-db-0` in `vendfinder` namespace

### Account Configuration

#### Standard Settings (All Accounts)
```sql
is_verified = true
is_active = true  
email_verified_at = CURRENT_TIMESTAMP
subscription_tier = 'premium'
kyc_status = 'verified'
kyc_verified_at = CURRENT_TIMESTAMP  
tos_accepted_at = CURRENT_TIMESTAMP
privacy_accepted_at = CURRENT_TIMESTAMP
tos_version = '1.0'
auth_provider = 'email'
failed_login_attempts = 0
```

#### Role-Specific Settings
- **Admin Account:** `role = 'admin'`
- **Seller Account:** `role = 'seller'`, `seller_fee_paid = true`, `seller_fee_paid_at = CURRENT_TIMESTAMP`
- **Buyer Account:** `role = 'buyer'`

## Implementation Plan

### Phase 1: Password Generation
- Generate 3 secure passwords (16+ characters, mixed complexity)
- Create bcrypt hashes with appropriate salt rounds
- Store passwords securely for delivery

### Phase 2: Database Operations  
- Execute via `kubectl exec` into user-db-0 pod
- Use transaction for atomicity
- Update admin-test account role and premium features
- Verify seller-test account configuration  
- Insert new buyer-test account

### Phase 3: Validation
- Verify account creation via database queries
- Test login functionality through user service
- Confirm premium tier features are accessible

## Security Considerations

- **Password Security:** Generate cryptographically secure passwords, hash with bcrypt
- **Database Access:** Use existing vendfinder user credentials, maintain transaction isolation  
- **Production Safety:** Single transaction rollback capability, no destructive operations
- **Credential Management:** Secure password delivery, recommend rotation after testing

## Success Criteria

1. All 3 accounts exist with correct roles and premium tier
2. All accounts are fully verified (email, KYC, ToS)  
3. Login functionality confirmed for all accounts
4. Premium features accessible for testing
5. No disruption to existing production accounts

## Rollback Plan

- Transaction-based operations allow immediate rollback
- Maintain backup of original admin-test account data
- Can disable accounts via `is_active = false` if issues arise

## Dependencies

- Kubernetes access to vendfinder namespace
- PostgreSQL access via user-db-0 pod  
- kubectl permissions for exec operations