#!/bin/bash
# scripts/parity-analysis/lib/k8s-utils.sh

set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

# Kubernetes resource comparison
compare_deployments() {
    local prod_namespace="$1"
    local staging_namespace="$2"
    local report_file="$3"

    log_info "Comparing deployments between $prod_namespace and $staging_namespace"

    local prod_deployments staging_deployments
    prod_deployments=$(kubectl get deployments -n "$prod_namespace" -o name | sort)
    staging_deployments=$(kubectl get deployments -n "$staging_namespace" -o name | sort)

    # Check for missing deployments in staging
    while IFS= read -r deployment; do
        if ! echo "$staging_deployments" | grep -q "$deployment"; then
            add_discrepancy "$report_file" "CRITICAL" "Missing Deployment" \
                "Deployment $deployment exists in production but missing in staging" \
                "kubectl apply -f missing-deployment-manifest.yaml"
        fi
    done <<< "$prod_deployments"

    # Compare image tags for existing deployments
    while IFS= read -r deployment; do
        if echo "$staging_deployments" | grep -q "$deployment"; then
            compare_deployment_images "$deployment" "$prod_namespace" "$staging_namespace" "$report_file"
        fi
    done <<< "$prod_deployments"
}

compare_deployment_images() {
    local deployment="$1"
    local prod_namespace="$2"
    local staging_namespace="$3"
    local report_file="$4"

    local prod_image staging_image
    prod_image=$(kubectl get "$deployment" -n "$prod_namespace" -o jsonpath='{.spec.template.spec.containers[0].image}')
    staging_image=$(kubectl get "$deployment" -n "$staging_namespace" -o jsonpath='{.spec.template.spec.containers[0].image}')

    # Extract image tags
    local prod_tag staging_tag
    prod_tag=$(echo "$prod_image" | cut -d':' -f2)
    staging_tag=$(echo "$staging_image" | cut -d':' -f2)

    # Check for image tag mismatches
    if [[ "$prod_tag" =~ ^staging- ]]; then
        add_discrepancy "$report_file" "CRITICAL" "Image Tag Mismatch" \
            "Production deployment $deployment using staging image tag: $prod_tag" \
            "kubectl set image $deployment container=${prod_image/staging-/v}"
    elif [[ "$staging_tag" =~ ^v[0-9] ]] && [[ "$prod_namespace" == "vendfinder" ]]; then
        add_discrepancy "$report_file" "HIGH" "Image Tag Format" \
            "Staging deployment $deployment using production-style tag: $staging_tag" \
            "kubectl set image $deployment container=${staging_image/v/staging-}"
    fi
}

compare_configmaps() {
    local prod_namespace="$1"
    local staging_namespace="$2"
    local report_file="$3"

    log_info "Comparing ConfigMaps between environments"

    local prod_configs staging_configs
    prod_configs=$(kubectl get configmaps -n "$prod_namespace" -o name | grep -v kube | sort)
    staging_configs=$(kubectl get configmaps -n "$staging_namespace" -o name | grep -v kube | sort)

    # Check for missing configmaps
    while IFS= read -r configmap; do
        if ! echo "$staging_configs" | grep -q "$configmap"; then
            add_discrepancy "$report_file" "HIGH" "Missing ConfigMap" \
                "ConfigMap $configmap exists in production but missing in staging" \
                "kubectl get $configmap -n $prod_namespace -o yaml | sed 's/$prod_namespace/$staging_namespace/' | kubectl apply -f -"
        fi
    done <<< "$prod_configs"
}

compare_services() {
    local prod_namespace="$1"
    local staging_namespace="$2"
    local report_file="$3"

    log_info "Comparing Services between environments"

    local prod_services staging_services
    prod_services=$(kubectl get services -n "$prod_namespace" -o name | sort)
    staging_services=$(kubectl get services -n "$staging_namespace" -o name | sort)

    # Check for missing services
    while IFS= read -r service; do
        if ! echo "$staging_services" | grep -q "$service"; then
            add_discrepancy "$report_file" "CRITICAL" "Missing Service" \
                "Service $service exists in production but missing in staging" \
                "kubectl expose deployment ${service#*/} --port=80 -n $staging_namespace"
        fi
    done <<< "$prod_services"
}

get_resource_limits() {
    local deployment="$1"
    local namespace="$2"

    kubectl get "$deployment" -n "$namespace" -o jsonpath='{.spec.template.spec.containers[0].resources}'
}