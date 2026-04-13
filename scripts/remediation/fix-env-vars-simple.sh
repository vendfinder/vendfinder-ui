#!/bin/bash
# scripts/remediation/fix-env-vars-simple.sh
# Fix missing environment variables (simplified version)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../parity-analysis/lib/common.sh"

PROD_NAMESPACE="vendfinder"
STAGING_NAMESPACE="vendfinder-staging"

main() {
    log_critical "🚨 FIXING MISSING ENVIRONMENT VARIABLES"

    # Fix DATABASE_URL for each service individually
    fix_user_service_database
    fix_chat_service_database
    fix_product_service_database
    fix_order_service_database

    # Fix ANTHROPIC_API_KEY
    fix_anthropic_key

    log_critical "✅ Environment variable fixes complete!"
}

fix_user_service_database() {
    log_info "🔧 Adding DATABASE_URL to user-service..."

    # Production
    kubectl patch deployment user-service -n "$PROD_NAMESPACE" -p \
        '{"spec":{"template":{"spec":{"containers":[{"name":"user-service","env":[{"name":"DATABASE_URL","value":"postgresql://vendfinder:vendfinder_pass@user-db:5432/user_db"}]}]}}}}' \
        && log_info "✅ user-service DATABASE_URL added (prod)" || log_error "❌ Failed user-service (prod)"

    # Staging
    kubectl patch deployment user-service -n "$STAGING_NAMESPACE" -p \
        '{"spec":{"template":{"spec":{"containers":[{"name":"user-service","env":[{"name":"DATABASE_URL","value":"postgresql://vendfinder:vendfinder_pass@user-db:5432/user_db_staging"}]}]}}}}' \
        && log_info "✅ user-service DATABASE_URL added (staging)" || log_error "❌ Failed user-service (staging)"
}

fix_chat_service_database() {
    log_info "🔧 Adding DATABASE_URL to chat-service..."

    # Production
    kubectl patch deployment chat-service -n "$PROD_NAMESPACE" -p \
        '{"spec":{"template":{"spec":{"containers":[{"name":"chat-service","env":[{"name":"DATABASE_URL","value":"postgresql://vendfinder:vendfinder_pass@chat-db:5432/chat_db"}]}]}}}}' \
        && log_info "✅ chat-service DATABASE_URL added (prod)" || log_error "❌ Failed chat-service (prod)"

    # Staging
    kubectl patch deployment chat-service -n "$STAGING_NAMESPACE" -p \
        '{"spec":{"template":{"spec":{"containers":[{"name":"chat-service","env":[{"name":"DATABASE_URL","value":"postgresql://vendfinder:vendfinder_pass@chat-db:5432/chat_db_staging"}]}]}}}}' \
        && log_info "✅ chat-service DATABASE_URL added (staging)" || log_error "❌ Failed chat-service (staging)"
}

fix_product_service_database() {
    log_info "🔧 Adding DATABASE_URL to product-service..."

    # Production
    kubectl patch deployment product-service -n "$PROD_NAMESPACE" -p \
        '{"spec":{"template":{"spec":{"containers":[{"name":"product-service","env":[{"name":"DATABASE_URL","value":"postgresql://vendfinder:vendfinder_pass@product-db:5432/product_db"}]}]}}}}' \
        && log_info "✅ product-service DATABASE_URL added (prod)" || log_error "❌ Failed product-service (prod)"

    # Staging
    kubectl patch deployment product-service -n "$STAGING_NAMESPACE" -p \
        '{"spec":{"template":{"spec":{"containers":[{"name":"product-service","env":[{"name":"DATABASE_URL","value":"postgresql://vendfinder:vendfinder_pass@product-db:5432/product_db_staging"}]}]}}}}' \
        && log_info "✅ product-service DATABASE_URL added (staging)" || log_error "❌ Failed product-service (staging)"
}

fix_order_service_database() {
    log_info "🔧 Adding DATABASE_URL to order-service..."

    # Production
    kubectl patch deployment order-service -n "$PROD_NAMESPACE" -p \
        '{"spec":{"template":{"spec":{"containers":[{"name":"order-service","env":[{"name":"DATABASE_URL","value":"postgresql://vendfinder:vendfinder_pass@order-db:5432/order_db"}]}]}}}}' \
        && log_info "✅ order-service DATABASE_URL added (prod)" || log_error "❌ Failed order-service (prod)"

    # Staging
    kubectl patch deployment order-service -n "$STAGING_NAMESPACE" -p \
        '{"spec":{"template":{"spec":{"containers":[{"name":"order-service","env":[{"name":"DATABASE_URL","value":"postgresql://vendfinder:vendfinder_pass@order-db:5432/order_db_staging"}]}]}}}}' \
        && log_info "✅ order-service DATABASE_URL added (staging)" || log_error "❌ Failed order-service (staging)"
}

fix_anthropic_key() {
    log_info "🔧 Adding ANTHROPIC_API_KEY to support-bot..."

    local placeholder_key="sk-ant-api-key-placeholder-REPLACE-WITH-ACTUAL-KEY"

    # Production
    kubectl patch deployment support-bot -n "$PROD_NAMESPACE" -p \
        "{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"support-bot\",\"env\":[{\"name\":\"ANTHROPIC_API_KEY\",\"value\":\"$placeholder_key\"}]}]}}}}" \
        && log_info "✅ support-bot ANTHROPIC_API_KEY added (prod)" || log_error "❌ Failed support-bot (prod)"

    # Staging
    kubectl patch deployment support-bot -n "$STAGING_NAMESPACE" -p \
        "{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"support-bot\",\"env\":[{\"name\":\"ANTHROPIC_API_KEY\",\"value\":\"$placeholder_key\"}]}]}}}}" \
        && log_info "✅ support-bot ANTHROPIC_API_KEY added (staging)" || log_error "❌ Failed support-bot (staging)"

    log_warn "⚠️  IMPORTANT: Replace placeholder ANTHROPIC_API_KEY with actual API key!"
}

# Run main function if script executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi