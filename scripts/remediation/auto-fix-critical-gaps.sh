#!/bin/bash
# scripts/remediation/auto-fix-critical-gaps.sh
# AUTO-FIX: Critical production vs staging gaps (no confirmation needed)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../parity-analysis/lib/common.sh"

# Configuration
PROD_NAMESPACE="vendfinder"
STAGING_NAMESPACE="vendfinder-staging"

main() {
    log_critical "🚨 AUTO-FIXING CRITICAL GAPS (no confirmation needed)"

    # Validate tools and access
    validate_tools
    validate_k8s_access

    # Execute fixes immediately
    fix_image_tag_mismatches
    fix_resource_limits
    copy_essential_configmaps

    log_critical "✅ CRITICAL GAPS FIXED!"
    log_info "🔍 Run verification: ./scripts/remediation/verify-critical-fixes.sh"
}

fix_image_tag_mismatches() {
    log_critical "🔧 FIXING IMAGE TAG MISMATCHES"

    # Fix api-gateway using production-style tag in staging
    log_info "Fixing api-gateway image tag..."
    if kubectl get deployment api-gateway -n "$STAGING_NAMESPACE" >/dev/null 2>&1; then
        local current_image
        current_image=$(kubectl get deployment api-gateway -n "$STAGING_NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}')

        if [[ "$current_image" =~ v[0-9] ]]; then
            local staging_tag="${current_image//v/staging-}"
            log_info "Updating: $current_image → $staging_tag"

            kubectl set image deployment/api-gateway -n "$STAGING_NAMESPACE" \
                "api-gateway=$staging_tag" && log_info "✅ api-gateway image updated" || log_error "❌ Failed to update api-gateway"
        else
            log_info "api-gateway already has correct tag format"
        fi
    fi

    # Fix email-service using production-style tag in staging
    log_info "Fixing email-service image tag..."
    if kubectl get deployment email-service -n "$STAGING_NAMESPACE" >/dev/null 2>&1; then
        local current_image
        current_image=$(kubectl get deployment email-service -n "$STAGING_NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}')

        if [[ "$current_image" =~ v[0-9] ]]; then
            local staging_tag="${current_image//v/staging-}"
            log_info "Updating: $current_image → $staging_tag"

            kubectl set image deployment/email-service -n "$STAGING_NAMESPACE" \
                "email-service=$staging_tag" && log_info "✅ email-service image updated" || log_error "❌ Failed to update email-service"
        else
            log_info "email-service already has correct tag format"
        fi
    fi
}

fix_resource_limits() {
    log_critical "🔧 FIXING RESOURCE LIMITS"

    # Services that need resource limit alignment with production
    declare -A resource_fixes=(
        ["user-service"]="500m:512Mi"
        ["product-service"]="500m:512Mi"
        ["chat-service"]="500m:256Mi"
        ["order-service"]="500m:512Mi"
        ["websocket-service"]="500m:256Mi"
        ["support-bot"]="500m:512Mi"
    )

    for service in "${!resource_fixes[@]}"; do
        if kubectl get deployment "$service" -n "$STAGING_NAMESPACE" >/dev/null 2>&1; then
            local limits="${resource_fixes[$service]}"
            local cpu_limit="${limits%%:*}"
            local mem_limit="${limits##*:}"

            log_info "Setting $service limits: CPU=$cpu_limit, Memory=$mem_limit"

            kubectl patch deployment "$service" -n "$STAGING_NAMESPACE" -p \
                "{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"$service\",\"resources\":{\"limits\":{\"cpu\":\"$cpu_limit\",\"memory\":\"$mem_limit\"}}}]}}}}" \
                && log_info "✅ $service limits updated" || log_error "❌ Failed to update $service limits"
        else
            log_warn "⚠️  $service deployment not found in staging"
        fi
    done
}

copy_essential_configmaps() {
    log_critical "🔧 COPYING ESSENTIAL CONFIGMAPS"

    # Essential ConfigMaps needed in staging
    local essential_configs=(
        "chat-config"
        "frontend-code"
        "frontend-routes"
        "vendfinder-dashboards"
    )

    for config in "${essential_configs[@]}"; do
        log_info "Processing ConfigMap: $config"

        if kubectl get configmap "$config" -n "$PROD_NAMESPACE" >/dev/null 2>&1; then
            # Copy from production to staging with namespace adjustment
            log_info "Copying $config from production to staging..."

            kubectl get configmap "$config" -n "$PROD_NAMESPACE" -o yaml | \
                sed "s/namespace: $PROD_NAMESPACE/namespace: $STAGING_NAMESPACE/g" | \
                sed '/resourceVersion:/d' | \
                sed '/uid:/d' | \
                sed '/creationTimestamp:/d' | \
                kubectl apply -f - && log_info "✅ $config copied" || log_error "❌ Failed to copy $config"
        else
            log_warn "⚠️  $config not found in production - skipping"
        fi
    done
}

validate_k8s_access() {
    # Check basic kubectl access (simplified validation)
    if ! kubectl get namespaces >/dev/null 2>&1; then
        log_error "No kubectl access to cluster"
        exit 1
    fi

    if ! kubectl get namespace "$STAGING_NAMESPACE" >/dev/null 2>&1; then
        log_error "Staging namespace $STAGING_NAMESPACE does not exist"
        exit 1
    fi

    log_info "✅ Kubernetes access validated"
}

# Run main function if script executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi