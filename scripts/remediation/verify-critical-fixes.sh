#!/bin/bash
# scripts/remediation/verify-critical-fixes.sh
# Quick verification of emergency fixes

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../parity-analysis/lib/common.sh"

STAGING_NAMESPACE="vendfinder-staging"

main() {
    log_info "🔍 VERIFYING EMERGENCY FIXES"

    verify_image_tags
    verify_resource_limits
    verify_essential_configs

    log_info "✅ Verification complete"
}

verify_image_tags() {
    log_info "Checking image tags..."

    # Check api-gateway
    local api_image
    api_image=$(kubectl get deployment api-gateway -n "$STAGING_NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "not found")

    if [[ "$api_image" =~ staging- ]]; then
        log_info "✅ api-gateway: $api_image (correct staging tag)"
    else
        log_warn "❌ api-gateway: $api_image (still wrong tag format)"
    fi

    # Check email-service
    local email_image
    email_image=$(kubectl get deployment email-service -n "$STAGING_NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "not found")

    if [[ "$email_image" =~ staging- ]]; then
        log_info "✅ email-service: $email_image (correct staging tag)"
    else
        log_warn "❌ email-service: $email_image (still wrong tag format)"
    fi
}

verify_resource_limits() {
    log_info "Checking resource limits..."

    local services=("user-service" "chat-service" "product-service" "order-service" "websocket-service" "support-bot")

    for service in "${services[@]}"; do
        local limits
        limits=$(kubectl get deployment "$service" -n "$STAGING_NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].resources.limits}' 2>/dev/null || echo "{}")

        local cpu mem
        cpu=$(echo "$limits" | jq -r '.cpu // "none"')
        mem=$(echo "$limits" | jq -r '.memory // "none"')

        if [[ "$cpu" != "none" ]] && [[ "$mem" != "none" ]]; then
            log_info "✅ $service: CPU=$cpu, Memory=$mem"
        else
            log_warn "❌ $service: Missing resource limits"
        fi
    done
}

verify_essential_configs() {
    log_info "Checking essential ConfigMaps..."

    local configs=("chat-config" "frontend-code" "frontend-routes" "vendfinder-dashboards")

    for config in "${configs[@]}"; do
        if kubectl get configmap "$config" -n "$STAGING_NAMESPACE" >/dev/null 2>&1; then
            log_info "✅ $config: Present"
        else
            log_warn "❌ $config: Missing"
        fi
    done
}

# Run main function if script executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi