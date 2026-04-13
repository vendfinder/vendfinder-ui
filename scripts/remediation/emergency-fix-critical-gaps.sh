#!/bin/bash
# scripts/remediation/emergency-fix-critical-gaps.sh
# EMERGENCY: Fix critical production vs staging gaps causing deployment failures

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../parity-analysis/lib/common.sh"

# Configuration
CONFIG_FILE="$SCRIPT_DIR/../config/parity-analysis.yaml"
PROD_NAMESPACE="vendfinder"
STAGING_NAMESPACE="vendfinder-staging"

main() {
    log_critical "EMERGENCY: Fixing critical production vs staging gaps"

    # Validate tools and permissions
    validate_tools
    validate_k8s_access

    # Show what we're about to fix
    log_info "=== CRITICAL GAPS TO FIX ==="
    log_info "• Image tag mismatches (staging images in wrong namespace)"
    log_info "• Missing essential services in staging"
    log_info "• Resource limit misalignments"
    log_info "• Essential ConfigMap gaps"

    # Ask for confirmation
    echo "⚠️  This will make changes to the staging environment."
    echo "🔍 Found critical gaps that are causing deployment failures."
    echo ""
    read -p "Continue with emergency fixes? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Emergency fix cancelled by user"
        exit 0
    fi

    # Execute fixes in priority order
    fix_image_tag_mismatches
    fix_resource_limits
    copy_essential_configmaps

    log_critical "Emergency fixes completed! Run analysis again to verify."
    log_info "Next: Deploy missing services manually or via full remediation system"
}

fix_image_tag_mismatches() {
    log_critical "🚨 FIXING IMAGE TAG MISMATCHES"

    # Fix api-gateway using production-style tag in staging
    log_info "Fixing api-gateway image tag in staging..."
    local current_image
    current_image=$(kubectl get deployment api-gateway -n "$STAGING_NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "")

    if [[ -n "$current_image" ]] && [[ "$current_image" =~ v[0-9] ]]; then
        local staging_tag
        staging_tag=${current_image//v/staging-}
        log_warn "Current: $current_image"
        log_info "Fixing to: $staging_tag"

        kubectl set image deployment/api-gateway -n "$STAGING_NAMESPACE" \
            "api-gateway=$staging_tag" || log_error "Failed to update api-gateway image"
    fi

    # Fix email-service using production-style tag in staging
    log_info "Fixing email-service image tag in staging..."
    current_image=$(kubectl get deployment email-service -n "$STAGING_NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "")

    if [[ -n "$current_image" ]] && [[ "$current_image" =~ v[0-9] ]]; then
        local staging_tag
        staging_tag=${current_image//v/staging-}
        log_warn "Current: $current_image"
        log_info "Fixing to: $staging_tag"

        kubectl set image deployment/email-service -n "$STAGING_NAMESPACE" \
            "email-service=$staging_tag" || log_error "Failed to update email-service image"
    fi

    log_info "✅ Image tag mismatches fixed"
}

fix_resource_limits() {
    log_critical "🚨 FIXING RESOURCE LIMIT MISMATCHES"

    # Critical services that need resource limit alignment
    declare -A resource_fixes=(
        ["user-service"]="500m:512Mi"
        ["chat-service"]="500m:256Mi"
        ["product-service"]="500m:512Mi"
        ["order-service"]="500m:512Mi"
        ["websocket-service"]="500m:256Mi"
        ["support-bot"]="500m:512Mi"
    )

    for service in "${!resource_fixes[@]}"; do
        local limits="${resource_fixes[$service]}"
        local cpu_limit="${limits%%:*}"
        local mem_limit="${limits##*:}"

        log_info "Fixing resource limits for $service (CPU: $cpu_limit, Memory: $mem_limit)"

        kubectl patch deployment "$service" -n "$STAGING_NAMESPACE" -p \
            "{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"$service\",\"resources\":{\"limits\":{\"cpu\":\"$cpu_limit\",\"memory\":\"$mem_limit\"}}}]}}}}" \
            || log_error "Failed to update $service resource limits"
    done

    log_info "✅ Resource limits aligned"
}

copy_essential_configmaps() {
    log_critical "🚨 COPYING ESSENTIAL CONFIGMAPS"

    # Essential ConfigMaps that staging needs
    local essential_configs=(
        "chat-config"
        "frontend-code"
        "frontend-routes"
        "vendfinder-dashboards"
    )

    for config in "${essential_configs[@]}"; do
        log_info "Copying ConfigMap: $config"

        if kubectl get configmap "$config" -n "$PROD_NAMESPACE" >/dev/null 2>&1; then
            # Get the ConfigMap from production and modify for staging
            kubectl get configmap "$config" -n "$PROD_NAMESPACE" -o yaml | \
                sed "s/namespace: $PROD_NAMESPACE/namespace: $STAGING_NAMESPACE/g" | \
                sed '/resourceVersion:/d' | \
                sed '/uid:/d' | \
                sed '/creationTimestamp:/d' | \
                kubectl apply -f - || log_error "Failed to copy $config"
        else
            log_warn "ConfigMap $config not found in production"
        fi
    done

    log_info "✅ Essential ConfigMaps copied"
}

validate_k8s_access() {
    log_info "Validating Kubernetes access..."

    # Check if we can access both namespaces
    if ! kubectl auth can-i get deployments --namespace="$PROD_NAMESPACE" >/dev/null 2>&1; then
        log_error "No access to production namespace: $PROD_NAMESPACE"
        exit 1
    fi

    if ! kubectl auth can-i get deployments --namespace="$STAGING_NAMESPACE" >/dev/null 2>&1; then
        log_error "No access to staging namespace: $STAGING_NAMESPACE"
        exit 1
    fi

    # Check if staging namespace exists
    if ! kubectl get namespace "$STAGING_NAMESPACE" >/dev/null 2>&1; then
        log_error "Staging namespace does not exist: $STAGING_NAMESPACE"
        exit 1
    fi

    log_info "✅ Kubernetes access validated"
}

# Run main function if script executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi