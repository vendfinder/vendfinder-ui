#!/bin/bash
# scripts/remediation/fix-resource-limits.sh
# Fix remaining resource limit mismatches

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../parity-analysis/lib/common.sh"

STAGING_NAMESPACE="vendfinder-staging"

main() {
    log_info "🔧 FIXING REMAINING RESOURCE LIMITS"

    # Fix user-service (currently has empty limits, should be 500m:512Mi)
    log_info "Fixing user-service resource limits..."
    kubectl patch deployment user-service -n "$STAGING_NAMESPACE" -p \
        '{"spec":{"template":{"spec":{"containers":[{"name":"user-service","resources":{"limits":{"cpu":"500m","memory":"512Mi"}}}]}}}}' \
        && log_info "✅ user-service limits fixed" || log_error "❌ Failed to fix user-service"

    # Fix product-service (currently has empty limits, should be 500m:512Mi)
    log_info "Fixing product-service resource limits..."
    kubectl patch deployment product-service -n "$STAGING_NAMESPACE" -p \
        '{"spec":{"template":{"spec":{"containers":[{"name":"product-service","resources":{"limits":{"cpu":"500m","memory":"512Mi"}}}]}}}}' \
        && log_info "✅ product-service limits fixed" || log_error "❌ Failed to fix product-service"

    # Upgrade order-service (currently 250m:256Mi, should be 500m:512Mi)
    log_info "Upgrading order-service resource limits..."
    kubectl patch deployment order-service -n "$STAGING_NAMESPACE" -p \
        '{"spec":{"template":{"spec":{"containers":[{"name":"order-service","resources":{"limits":{"cpu":"500m","memory":"512Mi"}}}]}}}}' \
        && log_info "✅ order-service limits upgraded" || log_error "❌ Failed to upgrade order-service"

    # Upgrade websocket-service (currently 200m:128Mi, should be 500m:256Mi)
    log_info "Upgrading websocket-service resource limits..."
    kubectl patch deployment websocket-service -n "$STAGING_NAMESPACE" -p \
        '{"spec":{"template":{"spec":{"containers":[{"name":"websocket-service","resources":{"limits":{"cpu":"500m","memory":"256Mi"}}}]}}}}' \
        && log_info "✅ websocket-service limits upgraded" || log_error "❌ Failed to upgrade websocket-service"

    # Upgrade support-bot (currently 200m:256Mi, should be 500m:512Mi)
    log_info "Upgrading support-bot resource limits..."
    kubectl patch deployment support-bot -n "$STAGING_NAMESPACE" -p \
        '{"spec":{"template":{"spec":{"containers":[{"name":"support-bot","resources":{"limits":{"cpu":"500m","memory":"512Mi"}}}]}}}}' \
        && log_info "✅ support-bot limits upgraded" || log_error "❌ Failed to upgrade support-bot"

    log_info "✅ Resource limit fixes complete!"
    log_info "🔍 Run verification: ./scripts/remediation/verify-critical-fixes.sh"
}

# Run main function if script executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi