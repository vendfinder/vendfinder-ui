#!/bin/bash
# scripts/remediation/fix-missing-env-vars.sh
# Fix critical missing environment variables causing service failures

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../parity-analysis/lib/common.sh"

PROD_NAMESPACE="vendfinder"
STAGING_NAMESPACE="vendfinder-staging"

main() {
    log_critical "🚨 FIXING MISSING ENVIRONMENT VARIABLES"

    # Fix missing DATABASE_URL variables
    fix_missing_database_urls

    # Fix missing ANTHROPIC_API_KEY
    fix_missing_anthropic_keys

    # Show current status
    verify_environment_variables

    log_critical "✅ Environment variable fixes complete!"
}

fix_missing_database_urls() {
    log_critical "🔧 FIXING MISSING DATABASE_URL VARIABLES"

    # Define database URLs for each service based on the configuration
    declare -A database_urls=(
        ["user-service:production"]="postgresql://vendfinder:vendfinder_pass@user-db:5432/user_db"
        ["user-service:staging"]="postgresql://vendfinder:vendfinder_pass@user-db:5432/user_db_staging"
        ["chat-service:production"]="postgresql://vendfinder:vendfinder_pass@chat-db:5432/chat_db"
        ["chat-service:staging"]="postgresql://vendfinder:vendfinder_pass@chat-db:5432/chat_db_staging"
        ["product-service:production"]="postgresql://vendfinder:vendfinder_pass@product-db:5432/product_db"
        ["product-service:staging"]="postgresql://vendfinder:vendfinder_pass@product-db:5432/product_db_staging"
        ["order-service:production"]="postgresql://vendfinder:vendfinder_pass@order-db:5432/order_db"
        ["order-service:staging"]="postgresql://vendfinder:vendfinder_pass@order-db:5432/order_db_staging"
    )

    local services=("user-service" "chat-service" "product-service" "order-service")

    for service in "${services[@]}"; do
        # Fix production environment
        local prod_key="${service}:production"
        if [[ -n "${database_urls[$prod_key]}" ]]; then
            log_info "Adding DATABASE_URL to $service in production..."

            kubectl patch deployment "$service" -n "$PROD_NAMESPACE" -p \
                "{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"$service\",\"env\":[{\"name\":\"DATABASE_URL\",\"value\":\"${database_urls[$prod_key]}\"}]}]}}}}" \
                && log_info "✅ $service DATABASE_URL added in production" || log_error "❌ Failed to add DATABASE_URL to $service in production"
        fi

        # Fix staging environment
        local staging_key="${service}:staging"
        if [[ -n "${database_urls[$staging_key]}" ]]; then
            log_info "Adding DATABASE_URL to $service in staging..."

            kubectl patch deployment "$service" -n "$STAGING_NAMESPACE" -p \
                "{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"$service\",\"env\":[{\"name\":\"DATABASE_URL\",\"value\":\"${database_urls[$staging_key]}\"}]}]}}}}" \
                && log_info "✅ $service DATABASE_URL added in staging" || log_error "❌ Failed to add DATABASE_URL to $service in staging"
        fi
    done
}

fix_missing_anthropic_keys() {
    log_critical "🔧 FIXING MISSING ANTHROPIC_API_KEY"

    # Note: In a real environment, this would use a secret management system
    # For now, we'll add a placeholder that needs to be updated with the actual key
    local placeholder_key="sk-ant-api-key-placeholder-REPLACE-WITH-ACTUAL-KEY"

    log_info "Adding ANTHROPIC_API_KEY to support-bot in production..."
    kubectl patch deployment support-bot -n "$PROD_NAMESPACE" -p \
        "{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"support-bot\",\"env\":[{\"name\":\"ANTHROPIC_API_KEY\",\"value\":\"$placeholder_key\"}]}]}}}}" \
        && log_info "✅ support-bot ANTHROPIC_API_KEY added in production" || log_error "❌ Failed to add ANTHROPIC_API_KEY to support-bot in production"

    log_info "Adding ANTHROPIC_API_KEY to support-bot in staging..."
    kubectl patch deployment support-bot -n "$STAGING_NAMESPACE" -p \
        "{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"support-bot\",\"env\":[{\"name\":\"ANTHROPIC_API_KEY\",\"value\":\"$placeholder_key\"}]}]}}}}" \
        && log_info "✅ support-bot ANTHROPIC_API_KEY added in staging" || log_error "❌ Failed to add ANTHROPIC_API_KEY to support-bot in staging"

    log_warn "⚠️  IMPORTANT: Replace placeholder ANTHROPIC_API_KEY with actual API key!"
    log_warn "   Production: kubectl patch deployment support-bot -n $PROD_NAMESPACE -p '{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"support-bot\",\"env\":[{\"name\":\"ANTHROPIC_API_KEY\",\"value\":\"ACTUAL_KEY_HERE\"}]}]}}}}'"
    log_warn "   Staging: kubectl patch deployment support-bot -n $STAGING_NAMESPACE -p '{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"support-bot\",\"env\":[{\"name\":\"ANTHROPIC_API_KEY\",\"value\":\"ACTUAL_KEY_HERE\"}]}]}}}}'"
}

verify_environment_variables() {
    log_info "🔍 VERIFYING ENVIRONMENT VARIABLES"

    local services=("user-service" "chat-service" "product-service" "order-service")

    for service in "${services[@]}"; do
        # Check production DATABASE_URL
        local prod_db_url
        prod_db_url=$(kubectl get deployment "$service" -n "$PROD_NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="DATABASE_URL")].value}' 2>/dev/null || echo "")

        if [[ -n "$prod_db_url" ]]; then
            log_info "✅ $service (prod): DATABASE_URL present"
        else
            log_warn "❌ $service (prod): DATABASE_URL missing"
        fi

        # Check staging DATABASE_URL
        local staging_db_url
        staging_db_url=$(kubectl get deployment "$service" -n "$STAGING_NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="DATABASE_URL")].value}' 2>/dev/null || echo "")

        if [[ -n "$staging_db_url" ]]; then
            log_info "✅ $service (staging): DATABASE_URL present"
        else
            log_warn "❌ $service (staging): DATABASE_URL missing"
        fi
    done

    # Check ANTHROPIC_API_KEY
    local prod_anthropic_key staging_anthropic_key
    prod_anthropic_key=$(kubectl get deployment support-bot -n "$PROD_NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="ANTHROPIC_API_KEY")].value}' 2>/dev/null || echo "")
    staging_anthropic_key=$(kubectl get deployment support-bot -n "$STAGING_NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].env[?(@.name=="ANTHROPIC_API_KEY")].value}' 2>/dev/null || echo "")

    if [[ -n "$prod_anthropic_key" ]]; then
        log_info "✅ support-bot (prod): ANTHROPIC_API_KEY present"
    else
        log_warn "❌ support-bot (prod): ANTHROPIC_API_KEY missing"
    fi

    if [[ -n "$staging_anthropic_key" ]]; then
        log_info "✅ support-bot (staging): ANTHROPIC_API_KEY present"
    else
        log_warn "❌ support-bot (staging): ANTHROPIC_API_KEY missing"
    fi
}

# Run main function if script executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi