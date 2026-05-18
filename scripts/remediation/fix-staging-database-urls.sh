#!/bin/bash
# scripts/remediation/fix-staging-database-urls.sh
# Fix incorrect database URLs in staging configMap

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../parity-analysis/lib/common.sh"

STAGING_NAMESPACE="vendfinder-staging"

main() {
    log_critical "🚨 FIXING STAGING DATABASE URLs - ROOT CAUSE OF API FAILURES!"

    # Fix the staging configMap database URLs to use staging database names
    log_info "Updating vendfinder-config configMap in staging..."

    kubectl patch configmap vendfinder-config -n "$STAGING_NAMESPACE" --type='merge' -p='{
        "data": {
            "USER_DB_URL": "postgresql://vendfinder:stagingpassword123@user-db:5432/user_db_staging",
            "CHAT_DB_URL": "postgresql://vendfinder:stagingpassword123@chat-db:5432/chat_db_staging",
            "ORDER_DB_URL": "postgresql://vendfinder:stagingpassword123@order-db:5432/order_db_staging",
            "PRODUCT_DB_URL": "postgresql://vendfinder:stagingpassword123@product-db:5432/product_db_staging"
        }
    }' && log_info "✅ ConfigMap updated successfully"

    # Restart deployments to pick up the new configuration
    log_info "Restarting deployments to pick up new database URLs..."

    kubectl rollout restart deployment/user-service -n "$STAGING_NAMESPACE" && log_info "✅ user-service restarted"
    kubectl rollout restart deployment/chat-service -n "$STAGING_NAMESPACE" && log_info "✅ chat-service restarted"
    kubectl rollout restart deployment/product-service -n "$STAGING_NAMESPACE" && log_info "✅ product-service restarted"
    kubectl rollout restart deployment/order-service -n "$STAGING_NAMESPACE" && log_info "✅ order-service restarted"

    log_critical "✅ STAGING DATABASE URLs FIXED!"
    log_info "Services should now connect to proper staging databases"
    log_info "🔍 Wait 60 seconds then test API endpoints again"
}

# Run main function if script executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi