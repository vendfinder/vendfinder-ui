#!/bin/bash
# scripts/parity-analysis/tier1-infrastructure.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/k8s-utils.sh"

# Configuration
CONFIG_FILE="$SCRIPT_DIR/../../config/parity-analysis.yaml"
REPORT_FILE="$1"

main() {
    log_info "Starting Tier 1: Infrastructure & Configuration Analysis"

    # Load configuration
    load_config "$CONFIG_FILE"

    local prod_namespace staging_namespace
    prod_namespace=$(yq eval '.environments.production.namespace' "$CONFIG_FILE")
    staging_namespace=$(yq eval '.environments.staging.namespace' "$CONFIG_FILE")

    log_info "Analyzing production namespace: $prod_namespace"
    log_info "Analyzing staging namespace: $staging_namespace"

    # Initialize report section
    echo "## Tier 1: Infrastructure & Configuration Analysis" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    # Run infrastructure comparisons
    compare_deployments "$prod_namespace" "$staging_namespace" "$REPORT_FILE"
    compare_configmaps "$prod_namespace" "$staging_namespace" "$REPORT_FILE"
    compare_services "$prod_namespace" "$staging_namespace" "$REPORT_FILE"
    compare_resource_limits "$prod_namespace" "$staging_namespace" "$REPORT_FILE"
    compare_ingress_configs "$prod_namespace" "$staging_namespace" "$REPORT_FILE"

    log_info "Tier 1 analysis complete"
}

compare_resource_limits() {
    local prod_namespace="$1"
    local staging_namespace="$2"
    local report_file="$3"

    log_info "Comparing resource limits between environments"

    # Get all deployments from config
    local services
    services=$(yq eval '.services[].name' "$CONFIG_FILE")

    while IFS= read -r service; do
        if kubectl get deployment "$service" -n "$prod_namespace" >/dev/null 2>&1 && kubectl get deployment "$service" -n "$staging_namespace" >/dev/null 2>&1; then
            local prod_limits staging_limits
            prod_limits=$(get_resource_limits "deployment/$service" "$prod_namespace")
            staging_limits=$(get_resource_limits "deployment/$service" "$staging_namespace")

            # Compare CPU and memory limits
            local prod_cpu staging_cpu prod_memory staging_memory
            prod_cpu=$(echo "$prod_limits" | jq -r '.limits.cpu // "none"')
            staging_cpu=$(echo "$staging_limits" | jq -r '.limits.cpu // "none"')
            prod_memory=$(echo "$prod_limits" | jq -r '.limits.memory // "none"')
            staging_memory=$(echo "$staging_limits" | jq -r '.limits.memory // "none"')

            if [[ "$prod_cpu" != "$staging_cpu" ]] || [[ "$prod_memory" != "$staging_memory" ]]; then
                add_discrepancy "$report_file" "HIGH" "Resource Limit Mismatch" \
                    "$service has different resource limits: prod(cpu:$prod_cpu,mem:$prod_memory) vs staging(cpu:$staging_cpu,mem:$staging_memory)" \
                    "kubectl patch deployment $service -n $staging_namespace -p '{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"$service\",\"resources\":{\"limits\":{\"cpu\":\"$prod_cpu\",\"memory\":\"$prod_memory\"}}}]}}}}'"
            fi
        fi
    done <<< "$services"
}

compare_ingress_configs() {
    local prod_namespace="$1"
    local staging_namespace="$2"
    local report_file="$3"

    log_info "Comparing ingress configurations"

    local prod_ingresses staging_ingresses
    prod_ingresses=$(kubectl get ingress -n "$prod_namespace" -o name 2>/dev/null | sort)
    staging_ingresses=$(kubectl get ingress -n "$staging_namespace" -o name 2>/dev/null | sort)

    # Check for missing ingress rules in staging
    while IFS= read -r ingress; do
        if [[ -n "$ingress" ]] && ! echo "$staging_ingresses" | grep -q "$ingress"; then
            add_discrepancy "$report_file" "HIGH" "Missing Ingress" \
                "Ingress $ingress exists in production but missing in staging" \
                "kubectl get $ingress -n $prod_namespace -o yaml | sed 's/$prod_namespace/$staging_namespace/g' | kubectl apply -f -"
        fi
    done <<< "$prod_ingresses"

    # Compare ingress hosts and paths
    while IFS= read -r ingress; do
        if [[ -n "$ingress" ]] && echo "$staging_ingresses" | grep -q "$ingress"; then
            compare_ingress_rules "$ingress" "$prod_namespace" "$staging_namespace" "$report_file"
        fi
    done <<< "$prod_ingresses"
}

compare_ingress_rules() {
    local ingress="$1"
    local prod_namespace="$2"
    local staging_namespace="$3"
    local report_file="$4"

    local prod_hosts staging_hosts
    prod_hosts=$(kubectl get "$ingress" -n "$prod_namespace" -o jsonpath='{.spec.rules[*].host}')
    staging_hosts=$(kubectl get "$ingress" -n "$staging_namespace" -o jsonpath='{.spec.rules[*].host}')

    # Check if staging uses appropriate subdomain
    if echo "$staging_hosts" | grep -v "staging\." | grep -q "vendfinder.com"; then
        add_discrepancy "$report_file" "CRITICAL" "Ingress Host Mismatch" \
            "$ingress in staging uses production domain: $staging_hosts" \
            "Update ingress host to use staging.vendfinder.com subdomain"
    fi
}

# Run main function if script executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ $# -ne 1 ]]; then
        echo "Usage: $0 <report_file>" >&2
        exit 1
    fi
    main "$@"
fi